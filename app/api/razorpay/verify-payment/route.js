import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase-server-client";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { sendPaymentSuccessEmail } from "@/lib/email";

// Service-role client — bypasses RLS, used for all writes here
const adminDb = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    // 1. Parse body first
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      coupon_code,
      coupon_id,
      original_amount_paise,
      discount_paise,
      final_amount_paise,
      user_id: bodyUserId,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
    }

    // 2. Verify Razorpay HMAC signature FIRST — reject tampered payloads before
    //    touching the DB or trusting any claimed user_id.
    //    One-time order signature: HMAC-SHA256(order_id|payment_id)
    const generated = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated !== razorpay_signature) {
      console.error("[verify-payment] Signature mismatch — order:", razorpay_order_id);
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // 3. Resolve the user who paid.
    //
    //    Primary:  session cookie (getUser() calls Supabase server to verify JWT)
    //    Fallback: user_id from request body
    //
    //    WHY fallback is safe here: HMAC is already verified above, proving the
    //    payment came from Razorpay. Session can fail if the access token expired
    //    while the Razorpay modal was open.
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    let userId    = user?.id    ?? null;
    let userEmail = user?.email ?? null;

    if (!userId && bodyUserId) {
      console.warn(
        `[verify-payment] Session auth failed (${authError?.message ?? "no session"}). ` +
        `Falling back to body user_id: ${bodyUserId}`
      );
      const { data: adminUser } = await adminDb.auth.admin.getUserById(bodyUserId);
      userId    = adminUser?.user?.id    ?? null;
      userEmail = adminUser?.user?.email ?? null;
    }

    if (user?.id && bodyUserId && user.id !== bodyUserId) {
      console.error(
        `[verify-payment] user_id MISMATCH: session=${user.id} body=${bodyUserId}. ` +
        "Using session user_id."
      );
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized — could not identify user" }, { status: 401 });
    }

    console.log(`[verify-payment] Resolved user: ${userId}`);

    // 4. Idempotency: skip if this payment_id was already processed
    const { data: existingPayment } = await adminDb
      .from("payments")
      .select("payment_id")
      .eq("payment_id", razorpay_payment_id)
      .maybeSingle();

    if (existingPayment) {
      console.log(`[verify-payment] Duplicate payment_id ${razorpay_payment_id} — already processed`);
      const { data: planRow } = await adminDb
        .from("user_plans")
        .select("pro_expires_at")
        .eq("user_id", userId)
        .maybeSingle();
      return NextResponse.json({ success: true, pro_expires_at: planRow?.pro_expires_at });
    }

    const proExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const chargedPaise = final_amount_paise ?? original_amount_paise ?? 29900;

    // 5. Upgrade user to Pro — use admin client to bypass RLS reliably.
    //    One-time orders have no subscription_id or next_billing_date (single payment).
    const { error: upsertError } = await adminDb
      .from("user_plans")
      .upsert(
        {
          user_id:                  userId,
          plan:                     "pro",
          is_trial:                 false,
          subscription_status:      "active",
          pro_expires_at:           proExpiresAt,
          razorpay_subscription_id: null,   // one-time order — no recurring subscription
          next_billing_date:        null,
          grace_until:              null,
          updated_at:               new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("[verify-payment] user_plans upsert failed for", userId, "—", upsertError.message);
      return NextResponse.json({ error: "Failed to activate Pro plan" }, { status: 500 });
    }

    console.log(`[verify-payment] ✅ User ${userId} upgraded to Pro — expires ${proExpiresAt}`);

    // Send confirmation email (non-blocking)
    if (userEmail) {
      sendPaymentSuccessEmail(userEmail, chargedPaise, proExpiresAt).catch((e) =>
        console.warn("[verify-payment] email send failed (non-fatal):", e.message)
      );
    }

    // 6. Record payment in ledger (non-blocking)
    try {
      await adminDb.from("payments").upsert(
        {
          user_id:         userId,
          payment_id:      razorpay_payment_id,
          order_id:        razorpay_order_id,
          amount:          chargedPaise,
          original_amount: original_amount_paise ?? 29900,
          discount_amount: discount_paise ?? 0,
          coupon_code:     coupon_code ?? null,
          status:          "captured",
        },
        { onConflict: "payment_id", ignoreDuplicates: true }
      );
    } catch (ledgerErr) {
      console.warn("[verify-payment] Payment ledger write failed (non-fatal):", ledgerErr.message);
    }

    // 7. Mark coupon as used (non-blocking)
    if (coupon_id) {
      try {
        await adminDb
          .from("coupon_uses")
          .upsert(
            { coupon_id, user_id: userId },
            { onConflict: "coupon_id,user_id", ignoreDuplicates: true }
          );
        await adminDb.rpc("increment_coupon_used", { p_coupon_id: coupon_id });
      } catch (couponErr) {
        console.warn("[verify-payment] Coupon tracking failed (non-fatal):", couponErr.message);
      }
    }

    return NextResponse.json({ success: true, pro_expires_at: proExpiresAt });
  } catch (err) {
    console.error("[verify-payment] Unhandled error:", err);
    return NextResponse.json({ error: err.message || "Verification failed" }, { status: 500 });
  }
}
