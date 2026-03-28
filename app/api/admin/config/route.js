import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { parse } from "cookie";
import crypto from "crypto";

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

  const providers = await prisma.provider.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(providers);
}

export async function POST(req) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, endpoint, apiKey, maxContext } = await req.json();

    if (!name || !endpoint || !apiKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const proxyKey = `vp-${crypto.randomBytes(16).toString("hex")}`;

    const provider = await prisma.provider.create({
      data: {
        name,
        endpoint,
        apiKey,
        maxContext: parseInt(maxContext) || 0,
        proxyKey,
      },
    });

    return NextResponse.json(provider);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    await prisma.provider.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
