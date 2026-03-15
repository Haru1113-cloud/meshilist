import { NextResponse } from "next/server";
import { getUserCount, CAMPAIGN_LIMIT } from "@/lib/trial";

export async function GET() {
  const count = getUserCount();
  const registered = Math.min(count, CAMPAIGN_LIMIT);
  const remaining = Math.max(0, CAMPAIGN_LIMIT - registered);
  return NextResponse.json({ registered, remaining, total: CAMPAIGN_LIMIT });
}
