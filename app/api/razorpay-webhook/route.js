import { NextResponse } from "next/server";
import crypto from "crypto";
import { upsertUserPlan, getUserIdByRazorpaySubscription } from "@/lib/user-plan";

// Tell Next.js not to parse the body — we need the raw string for HMAC verification
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";

    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      console.error("[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET env var not set");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    // Verify Razorpay webhook signature
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== signature) {
      console.warn("[razorpay-webhook] Invalid signature — possible spoofed request");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    const eventType = event.event;
    const entity = event.payload?.subscription?.entity;
    const subscriptionId = entity?.id;

    if (!subscriptionId) {
      // Not a subscription event — acknowledge and ignore
      return NextResponse.json({ received: true });
    }

    // Prefer user_id embedded in subscription notes (set when creating subscription)
    // Fall back to DB lookup by subscription ID
    let userId = entity?.notes?.user_id || null;
    if (!userId) {
      userId = await getUserIdByRazorpaySubscription(subscriptionId);
    }

    if (!userId) {
      console.warn("[razorpay-webhook] Cannot find user for subscription:", subscriptionId);
      return NextResponse.json({ received: true });
    }

    switch (eventType) {
      case "subscription.activated":
        // First payment made — user is now Pro
        await upsertUserPlan(userId, {
          plan: "pro",
          razorpay_subscription_id: subscriptionId,
        });
        console.log(`[razorpay-webhook] subscription.activated → user ${userId} is now Pro`);
        break;

      case "subscription.charged":
        // Recurring renewal succeeded — keep Pro
        await upsertUserPlan(userId, {
          plan: "pro",
          razorpay_subscription_id: subscriptionId,
        });
        console.log(`[razorpay-webhook] subscription.charged → renewed Pro for user ${userId}`);
        break;

      case "subscription.cancelled":
        // User cancelled — downgrade to Free
        await upsertUserPlan(userId, {
          plan: "free",
          razorpay_subscription_id: null,
        });
        console.log(`[razorpay-webhook] subscription.cancelled → user ${userId} downgraded to Free`);
        break;

      case "subscription.halted":
        // Payment failed after all retries — downgrade to Free
        await upsertUserPlan(userId, {
          plan: "free",
          razorpay_subscription_id: null,
        });
        console.log(`[razorpay-webhook] subscription.halted → user ${userId} downgraded to Free`);
        break;

      case "subscription.completed":
        // All billing cycles done (only relevant if total_count is finite and exhausted)
        await upsertUserPlan(userId, {
          plan: "free",
          razorpay_subscription_id: null,
        });
        console.log(`[razorpay-webhook] subscription.completed → user ${userId} downgraded to Free`);
        break;

      default:
        // subscription.pending, subscription.paused, payment.failed, etc. — ignore
        console.log(`[razorpay-webhook] Unhandled event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[razorpay-webhook] Error:", err.message);
    // Return 200 so Razorpay doesn't keep retrying on our parse errors
    return NextResponse.json({ received: true, error: err.message });
  }
}
