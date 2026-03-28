import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { countTokens, countMessageTokens } from "@/lib/tokenizer";

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const provider = await prisma.provider.findUnique({
      where: { proxyKey },
    });

    if (!provider || !provider.enabled) {
      return NextResponse.json({ error: "Invalid or Disabled API Key" }, { status: 401 });
    }

    const body = await req.json();

    // 1. Model Filtering
    if (provider.allowedModels) {
      const allowed = provider.allowedModels.split(",").map(m => m.trim().toLowerCase());
      if (!allowed.includes(body.model?.toLowerCase())) {
        return NextResponse.json({ error: `Model '${body.model}' is not allowed for this key.` }, { status: 403 });
      }
    }
    
    // 2. Rate Limiting (RPM/RPD)
    const now = new Date();
    const isNewMinute = now.getTime() - provider.lastMinuteAt.getTime() > 60000;
    const isNewDay = now.getTime() - provider.lastDayAt.getTime() > 86400000;

    let { rpmCounter, rpdCounter } = provider;
    if (isNewMinute) rpmCounter = 0;
    if (isNewDay) rpdCounter = 0;

    if (provider.rpmLimit > 0 && rpmCounter >= provider.rpmLimit) {
      return NextResponse.json({ error: "Rate limit exceeded (RPM)" }, { status: 429 });
    }
    if (provider.rpdLimit > 0 && rpdCounter >= provider.rpdLimit) {
      return NextResponse.json({ error: "Rate limit exceeded (RPD)" }, { status: 429 });
    }

    // Update counters in background (simplified)
    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        rpmCounter: rpmCounter + 1,
        rpdCounter: rpdCounter + 1,
        lastMinuteAt: isNewMinute ? now : undefined,
        lastDayAt: isNewDay ? now : undefined,
      }
    });

    // 3. Enforce max context size if configured
    if (provider.maxContext > 0) {
      // Simple check: if messages total tokens exceed maxContext, return error or trim (default error for now)
      const tokens = countMessageTokens(body.messages);
      if (tokens > provider.maxContext) {
        return NextResponse.json({ error: `Context size exceeded: ${tokens} > ${provider.maxContext}` }, { status: 400 });
      }
    }

    const upstreamUrl = `${provider.endpoint.replace(/\/$/, "")}/chat/completions`;
    
    const response = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(errorData || { error: "Upstream error" }, { status: response.status });
    }

    // Tracking tokens and requests
    await prisma.provider.update({
      where: { id: provider.id },
      data: { requestsMade: { increment: 1 } },
    });

    if (body.stream) {
      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let accumulatedTokens = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            controller.enqueue(value);

            // Simple token estimation for stream (can be improved)
            // OpenAI stream format is 'data: {...}'
            const lines = chunk.split("\n").filter(l => l.trim().startsWith("data: "));
            for (const line of lines) {
              const dataStr = line.replace("data: ", "").trim();
              if (dataStr === "[DONE]") break;
              try {
                const data = JSON.parse(dataStr);
                const content = data.choices?.[0]?.delta?.content || "";
                accumulatedTokens += countTokens(content);
              } catch (e) {}
            }
          }

          // Update tokens in DB after stream ends
          if (accumulatedTokens > 0) {
            await prisma.provider.update({
              where: { id: provider.id },
              data: { tokensUsed: { increment: accumulatedTokens } },
            });
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: { "Content-Type": "text/event-stream" },
      });
    } else {
      const data = await response.json();
      const tokens = data.usage?.total_tokens || countTokens(data.choices?.[0]?.message?.content || "");
      
      await prisma.provider.update({
        where: { id: provider.id },
        data: { tokensUsed: { increment: tokens } },
      });

      return NextResponse.json(data);
    }
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
