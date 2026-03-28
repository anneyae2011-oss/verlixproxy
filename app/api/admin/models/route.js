import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { parse } from "cookie";

export const dynamic = "force-dynamic";
const JWT_SECRET = process.env.JWT_SECRET || "verlixproxy_secret_key_12345";

function verifyAdmin(req) {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return false;
  const cookies = parse(cookieHeader);
  const token = cookies.admin_session;
  if (!token) return false;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return false;
  }
}

export async function GET(req) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const providerId = searchParams.get("providerId");

  if (!providerId) {
    return NextResponse.json({ error: "Provider ID required" }, { status: 400 });
  }

  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
  });

  if (!provider) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  try {
    let baseUrl = provider.endpoint.trim().replace(/\/$/, "");
    
    // Intelligent endpoint detection
    // If it doesn't end in /v1, and we're talking to an OpenAI-compatible API,
    // we might need to append /v1/models or just /models.
    // We'll try to find the standard "models" path.
    let modelsUrl = `${baseUrl}/models`;
    
    console.log(`[Models API] Attempting to fetch models from: ${modelsUrl}`);

    const res = await fetch(modelsUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
      },
      // Short timeout to avoid hanging the build or UI
      signal: AbortSignal.timeout(10000), 
    });

    if (!res.ok) {
      console.error(`[Models API] Upstream error: ${res.status} ${res.statusText}`);
      // Try fallback if the first one failed and didn't include /v1
      if (!baseUrl.endsWith("/v1")) {
        const fallbackUrl = `${baseUrl}/v1/models`;
        console.log(`[Models API] Retrying with fallback: ${fallbackUrl}`);
        const fallbackRes = await fetch(fallbackUrl, {
          headers: { "Authorization": `Bearer ${provider.apiKey}` },
          signal: AbortSignal.timeout(10000),
        });
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          return NextResponse.json(data);
        }
      }
      return NextResponse.json({ error: `Upstream returned ${res.status}: ${res.statusText}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Models API] Connection error:", error.message);
    return NextResponse.json({ error: `Connection failed: ${error.message}` }, { status: 500 });
  }
}
