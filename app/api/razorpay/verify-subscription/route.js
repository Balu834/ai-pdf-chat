import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase-server-client";
import { createClient as createAdmin } from "@supabase/supabase-js";

// Service-role client — bypasses RLS, used for all writes here
const adminDb = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    // 1. Authenticate the calling user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } =
      await request.json();

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
    }

    // 2. Verify Razorpay HMAC signature — subscriptions use payment_id|subscription_id
    const generated = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest("hex");

    if (generated !== razorpay_signature) {
      console.error("[verify-subscription] Signature mismatch for user:", user.id);
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // 3. Idempotency: skip if this payment_id was already processed
    const { data: existingPayment } = await adminDb
      .from("payments")
      .select("payment_id")
      .eq("payment_id", razorpay_payment_id)
      .maybeSingle();

    if (existingPayment) {
      console.log(`[verify-subscription] Duplicate payment_id ${razorpay_payment_id} — already processed`);
      const { data: planRow } = await adminDb
        .from("user_plans")
        .select("pro_expires_at")
        .eq("user_id", user.id)
        .maybeSingle();
      return NextResponse.json({ success: true, pro_expires_at: planRow?.pro_expires_at });
    }

    const proExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // 4. Upgrade user to Pro — use admin client to bypass RLS reliably
    const { error: upsertError } = await adminDb
      .from("user_plans")
      .upsert(
        {
          user_id:                   user.id,
          plan:                      "pro",
          is_trial:                  false,
          subscription_status:       "active",
          pro_expires_at:            proExpiresAt,
          razorpay_subscription_id,
          updated_at:                new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("[verify-subscription] user_plans upsert failed for", user.id, "—", upsertError.message);
      return NextResponse.json({ error: "Failed to activate Pro plan" }, { status: 500 });
    }

    console.log(`[verify-subscription] ✅ User ${user.id} upgraded to Pro — expires ${proExpiresAt}`);

    // 5. Record payment in ledger (non-blocking — log but don't fail the main flow)
    try {
      await adminDb.from("payments").upsert(
        {
          user_id:         user.id,
          payment_id:      razorpay_payment_id,
          subscription_id: razorpay_subscription_id,
          amount:          29900,
          original_amount: 29900,
          discount_amount: 0,
          status:          "captured",
        },
        { onConflict: "payment_id", ignoreDuplicates: true }
      );
    } catch (ledgerErr) {
      console.warn("[verify-subscription] Payment ledger write failed (non-fatal):", ledgerErr.message);
    }

    return NextResponse.json({ success: true, pro_expires_at: proExpiresAt });
  } catch (err) {
    console.error("[verify-subscription] Unhandled error:", err);
    return NextResponse.json({ error: err.message || "Verification failed" }, { status: 500 });
  }
}
