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
    const upstreamUrl = `${provider.endpoint.replace(/\/$/, "")}/models`;
    const res = await fetch(upstreamUrl, {
      headers: {
        "Authorization": `Bearer ${provider.apiKey}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch models from upstream" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Models fetch error:", error);
    return NextResponse.json({ error: "Could not connect to provider endpoint" }, { status: 500 });
  }
}
