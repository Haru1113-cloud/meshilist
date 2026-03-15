import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { setSubscription, getDeviceBySubscriptionId, addFreeCredits, PlanType } from "@/lib/trial";

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const deviceId = session.metadata?.deviceId;
      const planId = session.metadata?.planId as PlanType | undefined;
      // Single credit purchase
      if (deviceId && session.mode === "payment" && session.metadata?.planId === "credits") {
        addFreeCredits(deviceId, 5);
        break;
      }
      // Subscription
      if (deviceId && session.subscription) {
        setSubscription(deviceId, session.subscription as string, "active", planId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const deviceId =
        subscription.metadata?.deviceId ||
        getDeviceBySubscriptionId(subscription.id);
      if (deviceId) {
        setSubscription(deviceId, subscription.id, "canceled");
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
