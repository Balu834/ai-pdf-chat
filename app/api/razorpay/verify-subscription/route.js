import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-client";
import Razorpay from "razorpay";
import crypto from "crypto";
import { createClient } from "@/lib/supabase-server-client";
import { sendPaymentSuccessEmail } from "@/lib/email";
import { PLANS, resolveTierFromPlanId } from "@/lib/razorpay-plans";

export async function POST(request) {
  try {
    // 1. Parse body
    const body = await request.json();
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = body;

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
    }

    // 2. Verify HMAC signature FIRST — reject tampered payloads before touching the DB
    //    Subscription signature: HMAC-SHA256(payment_id|subscription_id)
    const generated = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest("hex");

    if (generated !== razorpay_signature) {
      console.error("[verify-subscription] Signature mismatch — possible tampered request");
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // 3. Resolve the authenticated user — session cookie only (no body fallback).
    //    HMAC above proves payment validity; session proves identity.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const userId    = user?.id    ?? null;
    const userEmail = user?.email ?? null;

    if (!userId) {
      console.warn("[verify-subscription] No active session — HMAC verified but user unidentifiable");
      return NextResponse.json(
        { error: "Session expired. Please refresh the page and complete the payment again." },
        { status: 401 }
      );
    }

    console.log(`[verify-subscription] Resolved user: ${userId}`);

    // 4. Resolve the actual tier from Razorpay — never trust client-supplied plan data.
    //    Fetch the subscription to get its plan_id, then map to "pro" | "team".
    let resolvedTier   = "pro";
    let resolvedAmount = PLANS.pro.amount;

    try {
      const razorpay = new Razorpay({
        key_id:     process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      const sub      = await razorpay.subscriptions.fetch(razorpay_subscription_id);
      resolvedTier   = resolveTierFromPlanId(sub.plan_id);
      resolvedAmount = PLANS[resolvedTier]?.amount ?? PLANS.pro.amount;
      console.log(`[verify-subscription] Resolved tier: ${resolvedTier} (plan_id: ${sub.plan_id})`);
    } catch (e) {
      console.warn("[verify-subscription] Could not fetch subscription from Razorpay (defaulting to pro):", e.message);
    }

    // 5. Idempotency: skip if this payment_id was already processed
    const { data: existingPayment } = await getAdminClient()
      .from("payments")
      .select("payment_id")
      .eq("payment_id", razorpay_payment_id)
      .maybeSingle();

    if (existingPayment) {
      console.log(`[verify-subscription] Duplicate payment_id ${razorpay_payment_id} — already processed`);
      const { data: planRow } = await getAdminClient()
        .from("user_plans")
        .select("pro_expires_at")
        .eq("user_id", userId)
        .maybeSingle();
      return NextResponse.json({ success: true, pro_expires_at: planRow?.pro_expires_at });
    }

    const proExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // 6. Activate the correct plan — use admin client to bypass RLS reliably
    const { error: upsertError } = await getAdminClient()
      .from("user_plans")
      .upsert(
        {
          user_id:                   userId,
          plan:                      resolvedTier,
          is_trial:                  false,
          subscription_status:       "active",
          pro_expires_at:            proExpiresAt,
          razorpay_subscription_id,
          updated_at:                new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("[verify-subscription] user_plans upsert failed for", userId, "—", upsertError.message);
      return NextResponse.json({ error: "Failed to activate plan" }, { status: 500 });
    }

    console.log(`[verify-subscription] ✅ User ${userId} activated ${resolvedTier} — expires ${proExpiresAt}`);

    // Send confirmation email (non-blocking)
    if (userEmail) {
      sendPaymentSuccessEmail(userEmail, resolvedAmount, proExpiresAt).catch((e) =>
        console.warn("[verify-subscription] email send failed (non-fatal):", e.message)
      );
    }

    // 7. Record payment in ledger (non-blocking)
    try {
      await getAdminClient().from("payments").upsert(
        {
          user_id:         userId,
          payment_id:      razorpay_payment_id,
          subscription_id: razorpay_subscription_id,
          amount:          resolvedAmount,
          original_amount: resolvedAmount,
          discount_amount: 0,
          status:          "captured",
        },
        { onConflict: "payment_id", ignoreDuplicates: true }
      );
    } catch (ledgerErr) {
      console.warn("[verify-subscription] Payment ledger write failed (non-fatal):", ledgerErr.message);
    }

    return NextResponse.json({ success: true, pro_expires_at: proExpiresAt, tier: resolvedTier });
  } catch (err) {
    console.error("[verify-subscription] Unhandled error:", err);
    return NextResponse.json({ error: err.message || "Verification failed" }, { status: 500 });
  }
}
