import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { getUserIdByRazorpaySubscription } from "@/lib/user-plan";

// Service-role client — bypasses RLS, required for webhook (no user session)
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/razorpay/webhook
 *
 * Signature: HMAC-SHA256(rawBody, RAZORPAY_WEBHOOK_SECRET)
 * Header:    X-Razorpay-Signature
 *
 * Events handled:
 *   payment.captured        → one-time coupon order: upgrade user to Pro
 *   subscription.charged    → auto-renewal: extend pro_expires_at by 30 days
 *   subscription.activated  → set status = active
 *   subscription.cancelled  → set status = cancelled (Pro continues until expiry)
 *   subscription.halted     → payment failed repeatedly
 *   subscription.completed  → subscription ended; downgrade to free
 *
 * Register at: Razorpay Dashboard → Webhooks
 * URL: https://intellixy.vercel.app/api/razorpay/webhook
 * Env: RAZORPAY_WEBHOOK_SECRET
 */
export async function POST(request) {
  // 1. Read raw body for signature verification
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.error("[webhook] RAZORPAY_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
  }

  // 2. Verify HMAC-SHA256 signature — reject anything that doesn't match
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  if (expected !== signature) {
    console.error("[webhook] Invalid signature — possible spoofed request");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event   = payload.event;
  const eventId = payload.event_id; // unique per Razorpay delivery

  // 3. Idempotency guard — skip already-processed events
  if (eventId) {
    const { data: existing } = await admin
      .from("webhook_events")
      .select("event_id")
      .eq("event_id", eventId)
      .maybeSingle();

    if (existing) {
      console.log(`[webhook] Duplicate event ${eventId} (${event}) — skipped`);
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Mark as processed (best-effort; duplicate insert is fine — unique constraint blocks it)
    try {
      await admin
        .from("webhook_events")
        .insert({ event_id: eventId, event_type: event });
    } catch {
      // Already inserted by a concurrent invocation — safe to continue
    }
  }

  console.log(`[webhook] Event: ${event} | id: ${eventId}`);

  // ─────────────────────────────────────────────────────────────────────
  // 4a. payment.captured — one-time coupon order
  //     user_id is stored in payment notes by create-discounted-order
  // ─────────────────────────────────────────────────────────────────────
  if (event === "payment.captured") {
    const payment = payload.payload?.payment?.entity;
    if (!payment) return NextResponse.json({ received: true });

    const userId    = payment.notes?.user_id;
    const paymentId = payment.id;
    const orderId   = payment.order_id;
    const amount    = payment.amount; // paise

    if (!userId) {
      // Not a one-time order we issued (e.g. subscription first-charge) — skip
      console.log(`[webhook] payment.captured with no notes.user_id — skipping (payment: ${paymentId})`);
      return NextResponse.json({ received: true });
    }

    // Idempotency: skip if payment already in ledger
    const { data: existingPay } = await admin
      .from("payments")
      .select("payment_id")
      .eq("payment_id", paymentId)
      .maybeSingle();

    if (existingPay) {
      console.log(`[webhook] payment.captured duplicate ${paymentId} — already processed`);
      return NextResponse.json({ received: true });
    }

    const proExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error: planErr } = await admin
      .from("user_plans")
      .upsert(
        {
          user_id:             userId,
          plan:                "pro",
          is_trial:            false,
          subscription_status: "active",
          pro_expires_at:      proExpiresAt,
          updated_at:          new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (planErr) {
      console.error(`[webhook] payment.captured — user_plans upsert failed for ${userId}:`, planErr.message);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }

    // Record in payments ledger (non-fatal)
    try {
      await admin.from("payments").upsert(
        {
          user_id:         userId,
          payment_id:      paymentId,
          order_id:        orderId,
          amount:          amount ?? 29900,
          original_amount: amount ?? 29900,
          discount_amount: 0,
          status:          "captured",
        },
        { onConflict: "payment_id", ignoreDuplicates: true }
      );
    } catch (ledgerErr) {
      console.warn("[webhook] payment.captured ledger write failed (non-fatal):", ledgerErr.message);
    }

    console.log(`[webhook] ✅ payment.captured — user ${userId} upgraded to Pro, expires ${proExpiresAt}`);
    return NextResponse.json({ received: true });
  }

  // ─────────────────────────────────────────────────────────────────────
  // 4b. Subscription events
  // ─────────────────────────────────────────────────────────────────────
  const subscription = payload.payload?.subscription?.entity;

  if (!subscription?.id) {
    // Not subscription-related — acknowledge and ignore
    return NextResponse.json({ received: true });
  }

  const subscriptionId = subscription.id;

  // Look up which user owns this subscription.
  // Primary: razorpay_subscription_id column (set by verify-subscription).
  // Fallback: notes.user_id embedded when create-subscription created the subscription.
  //   This handles the race where subscription.charged fires before verify-subscription
  //   has written the razorpay_subscription_id to the DB.
  let userId = await getUserIdByRazorpaySubscription(subscriptionId);

  if (!userId) {
    const notesUserId = subscription.notes?.user_id;
    if (notesUserId) {
      console.warn(`[webhook] No DB row for subscription ${subscriptionId} — using notes.user_id: ${notesUserId}`);
      userId = notesUserId;
    }
  }

  if (!userId) {
    console.warn(`[webhook] Cannot identify user for subscription ${subscriptionId} — event ${event} skipped`);
    return NextResponse.json({ received: true });
  }

  switch (event) {
    case "subscription.charged": {
      // Auto-renewal or first charge: ensure user is Pro and extend expiry.
      const nextBillingUnix = subscription.charge_at;
      const nextBillingDate = nextBillingUnix
        ? new Date(nextBillingUnix * 1000).toISOString()
        : null;
      const proExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      // Upsert first to ensure the row exists and razorpay_subscription_id is stored
      // (handles the race where this fires before verify-subscription)
      await admin.from("user_plans").upsert(
        {
          user_id:                   userId,
          plan:                      "pro",
          is_trial:                  false,
          subscription_status:       "active",
          razorpay_subscription_id:  subscriptionId,
          pro_expires_at:            proExpiresAt,
          next_billing_date:         nextBillingDate,
          grace_until:               null,
          updated_at:                new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      // Also try the RPC for proper extension logic (no-op if already done above)
      const { error } = await admin.rpc("extend_pro_subscription", {
        p_user_id:      userId,
        p_next_billing: nextBillingDate,
      });

      if (error) {
        // RPC is best-effort — upsert above already ensured Pro status
        console.warn(`[webhook] extend_pro_subscription RPC failed for ${userId} (non-fatal):`, error.message);
      }

      // Clear any grace period that was set from a prior failure
      await admin
        .from("user_plans")
        .update({ grace_until: null, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      const { data } = await admin
        .from("user_plans")
        .select("pro_expires_at, next_billing_date")
        .eq("user_id", userId)
        .maybeSingle();

      console.log(
        `[webhook] ✅ Renewed Pro for user ${userId} | expires: ${data?.pro_expires_at} | next: ${data?.next_billing_date}`
      );
      break;
    }

    case "subscription.activated": {
      await admin
        .from("user_plans")
        .update({ subscription_status: "active", updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      console.log(`[webhook] Activated for user ${userId}`);
      break;
    }

    case "subscription.cancelled": {
      await admin
        .from("user_plans")
        .update({
          subscription_status: "cancelled",
          next_billing_date:   null,
          updated_at:          new Date().toISOString(),
        })
        .eq("user_id", userId);
      console.log(`[webhook] Cancelled for user ${userId} — access until expiry`);
      break;
    }

    case "subscription.halted": {
      // Razorpay retried payment multiple times and gave up.
      // Grant a 3-day grace period before the cron downgrades the user.
      const graceUntil = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      await admin
        .from("user_plans")
        .update({
          subscription_status: "halted",
          grace_until:         graceUntil,
          next_billing_date:   null,
          updated_at:          new Date().toISOString(),
        })
        .eq("user_id", userId);
      console.log(`[webhook] Halted for user ${userId} — 3-day grace until ${graceUntil}`);
      break;
    }

    case "subscription.completed": {
      await admin
        .from("user_plans")
        .update({
          plan:                "free",
          subscription_status: "completed",
          next_billing_date:   null,
          updated_at:          new Date().toISOString(),
        })
        .eq("user_id", userId);
      console.log(`[webhook] Completed — user ${userId} downgraded to free`);
      break;
    }

    default:
      console.log(`[webhook] Unhandled subscription event: ${event}`);
  }

  return NextResponse.json({ received: true });
}
