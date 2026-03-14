import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSubscriptionId } from "@/lib/trial";

export async function POST(request: NextRequest) {
  const { deviceId } = await request.json();

  if (!deviceId) {
    return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  }

  const subscriptionId = getSubscriptionId(deviceId);
  if (!subscriptionId) {
    return NextResponse.json({ error: "no_subscription" }, { status: 404 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  // cancel_at_period_end: true → 今月末まで使えて、翌月から止まる
  await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });

  return NextResponse.json({ ok: true });
}
