import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase-server-client";
import { upsertUserPlan } from "@/lib/user-plan";

export async function POST(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } =
      await request.json();

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
    }

    // Razorpay signature for subscriptions:
    // HMAC-SHA256(razorpay_payment_id + "|" + razorpay_subscription_id, key_secret)
    const generated = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest("hex");

    if (generated !== razorpay_signature) {
      console.error("[verify-subscription] Signature mismatch for user:", user.id);
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Mark user as Pro in the database
    await upsertUserPlan(user.id, {
      plan: "pro",
      razorpay_subscription_id,
    });

    console.log(`[verify-subscription] User ${user.id} upgraded to Pro via Razorpay`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[verify-subscription]", err);
    return NextResponse.json(
      { error: err.message || "Verification failed" },
      { status: 500 }
    );
  }
}
