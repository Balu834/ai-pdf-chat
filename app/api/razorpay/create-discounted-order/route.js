import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/lib/supabase-server-client";
import { createClient as createAdmin } from "@supabase/supabase-js";

const adminDb = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_AMOUNT_PAISE = 29900;

/**
 * POST /api/razorpay/create-discounted-order
 * Body: { coupon_code: "SAVE50" }
 *
 * Validates the coupon server-side (not trusting frontend) and creates
 * a Razorpay order for the discounted amount. One-time payment — user
 * gets 30 days Pro without auto-renewal. They can start a regular
 * subscription afterwards for auto-renew.
 */
export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { coupon_code } = await request.json();
    if (!coupon_code?.trim()) {
      return NextResponse.json({ error: "Coupon code required" }, { status: 400 });
    }

    const upperCode = coupon_code.trim().toUpperCase();

    // Re-validate coupon server-side (never trust the frontend validation)
    const { data: coupon } = await adminDb
      .from("coupons")
      .select("id, discount_type, discount_value, expiry_date, usage_limit, used_count, active")
      .eq("code", upperCode)
      .maybeSingle();

    if (!coupon?.active) {
      return NextResponse.json({ error: "Invalid or inactive coupon" }, { status: 400 });
    }
    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      return NextResponse.json({ error: "Coupon has expired" }, { status: 400 });
    }
    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
    }

    const { data: alreadyUsed } = await adminDb
      .from("coupon_uses")
      .select("id")
      .eq("coupon_id", coupon.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (alreadyUsed) {
      return NextResponse.json({ error: "You have already used this coupon" }, { status: 400 });
    }

    // Calculate final amount
    let discountPaise = 0;
    if (coupon.discount_type === "percentage") {
      discountPaise = Math.round((BASE_AMOUNT_PAISE * coupon.discount_value) / 100);
    } else {
      discountPaise = Math.round(coupon.discount_value * 100);
    }
    const finalAmountPaise = Math.max(100, BASE_AMOUNT_PAISE - discountPaise);

    // Create Razorpay order for the discounted amount
    const razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount:   finalAmountPaise,
      currency: "INR",
      receipt:  `coupon_${Date.now()}`,
      notes: {
        plan:        "pro",
        coupon_code: upperCode,
        coupon_id:   String(coupon.id),
        user_id:     user.id,
      },
    });

    console.log(
      `[create-discounted-order] User ${user.id} | coupon ${upperCode} | ₹${finalAmountPaise / 100} (saved ₹${discountPaise / 100})`
    );

    return NextResponse.json({
      ...order,
      coupon_code:           upperCode,
      coupon_id:             coupon.id,
      original_amount_paise: BASE_AMOUNT_PAISE,
      discount_paise:        discountPaise,
    });
  } catch (err) {
    console.error("[create-discounted-order]", err);
    return NextResponse.json({ error: err.message || "Failed to create order" }, { status: 500 });
  }
}
