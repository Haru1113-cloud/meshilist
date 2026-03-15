import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const PLAN_PRICE_MAP: Record<string, string | undefined> = {
  light: process.env.STRIPE_LIGHT_PRICE_ID,
  standard: process.env.STRIPE_STANDARD_PRICE_ID || process.env.STRIPE_MONTHLY_PRICE_ID,
  premium: process.env.STRIPE_PREMIUM_PRICE_ID,
};

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const { deviceId, planId = "standard" } = await request.json();

  if (!deviceId) {
    return NextResponse.json({ error: "Missing deviceId" }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  // Single credit purchase (5回分 ¥400)
  if (planId === "credits") {
    const creditsPriceId = process.env.STRIPE_CREDITS_PRICE_ID;
    if (!creditsPriceId) {
      return NextResponse.json({ error: "Credits price not configured" }, { status: 400 });
    }
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{ price: creditsPriceId, quantity: 1 }],
        mode: "payment",
        success_url: `${baseUrl}/app?checkout=success`,
        cancel_url: `${baseUrl}/cancel`,
        metadata: { deviceId, planId: "credits" },
      });
      return NextResponse.json({ url: session.url });
    } catch (error) {
      console.error("Stripe error:", error);
      return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
    }
  }

  const priceId = PLAN_PRICE_MAP[planId] ?? process.env.STRIPE_MONTHLY_PRICE_ID!;

  if (!priceId) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${baseUrl}/app?checkout=success`,
      cancel_url: `${baseUrl}/cancel`,
      metadata: { deviceId, planId },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
