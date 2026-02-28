import { NextRequest, NextResponse } from "next/server";
import { initUser, getTrialStatus } from "@/lib/trial";

export async function POST(request: NextRequest) {
  const { deviceId } = await request.json();

  if (!deviceId) {
    return NextResponse.json({ error: "Missing deviceId" }, { status: 400 });
  }

  initUser(deviceId);
  const status = getTrialStatus(deviceId);

  return NextResponse.json(status);
}
