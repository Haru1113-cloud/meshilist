import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// GET /api/user-data → ユーザーの料理記録・設定を取得
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [cooked, prefs] = await Promise.all([
    redis.get(`user:${userId}:cooked`),
    redis.get(`user:${userId}:prefs`),
  ]);

  return NextResponse.json({ cooked: cooked ?? [], prefs: prefs ?? {} });
}

// POST /api/user-data → ユーザーの料理記録・設定を保存
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.cooked !== undefined) {
    await redis.set(`user:${userId}:cooked`, body.cooked);
  }
  if (body.prefs !== undefined) {
    await redis.set(`user:${userId}:prefs`, body.prefs);
  }

  return NextResponse.json({ ok: true });
}
