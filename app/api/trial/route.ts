import { NextRequest, NextResponse } from "next/server";
import { initUser, getTrialStatus } from "@/lib/trial";

function isAdminDevice(deviceId: string): boolean {
  const adminIds = (process.env.ADMIN_DEVICE_ID ?? "").split(",").map(s => s.trim()).filter(Boolean);
  return adminIds.includes(deviceId);
}

export async function POST(request: NextRequest) {
  const { deviceId } = await request.json();

  if (!deviceId) {
    return NextResponse.json({ error: "Missing deviceId" }, { status: 400 });
  }

  try {
    await initUser(deviceId);
    const status = await getTrialStatus(deviceId);
    return NextResponse.json({ ...status, isAdmin: isAdminDevice(deviceId) });
  } catch {
    // Redis unavailable (e.g. no internet in local dev) — return default trial status
    return NextResponse.json({
      trialActive: true, daysLeft: 3, subscribed: false, plan: null,
      generationsLeft: null, imageGenerationsLeft: null,
      freeCreditsLeft: 3, freeCreditsTotal: 3,
    });
  }
}
