import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { createClient as createAdmin } from "@supabase/supabase-js";

const admin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_AMOUNT_PAISE = 29900; // ₹299 in paise

/**
 * POST /api/coupons/validate
 * Body: { code: "SAVE50" }
 *
 * Returns:
 *   { valid: true, discount_type, discount_value, final_amount_paise, savings_paise }
 *   { valid: false, error: "..." }
 */
export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { code } = await request.json();
    if (!code?.trim()) {
      return NextResponse.json({ valid: false, error: "Enter a coupon code" });
    }

    const upperCode = code.trim().toUpperCase();

    // 1. Fetch coupon (service role bypasses RLS)
    const { data: coupon, error: fetchError } = await admin
      .from("coupons")
      .select("id, code, discount_type, discount_value, expiry_date, usage_limit, used_count, active")
      .eq("code", upperCode)
      .maybeSingle();

    if (fetchError || !coupon) {
      return NextResponse.json({ valid: false, error: "Invalid coupon code" });
    }

    if (!coupon.active) {
      return NextResponse.json({ valid: false, error: "This coupon is no longer active" });
    }

    // 2. Check expiry
    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      return NextResponse.json({ valid: false, error: "This coupon has expired" });
    }

    // 3. Check usage limit
    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json({ valid: false, error: "This coupon has reached its usage limit" });
    }

    // 4. Check if this user already used this coupon
    const { data: alreadyUsed } = await admin
      .from("coupon_uses")
      .select("id")
      .eq("coupon_id", coupon.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (alreadyUsed) {
      return NextResponse.json({ valid: false, error: "You have already used this coupon" });
    }

    // 5. Calculate discounted amount
    let discountPaise = 0;
    if (coupon.discount_type === "percentage") {
      discountPaise = Math.round((BASE_AMOUNT_PAISE * coupon.discount_value) / 100);
    } else {
      // fixed — discount_value is in rupees
      discountPaise = Math.round(coupon.discount_value * 100);
    }
    // Minimum charge ₹1 (100 paise) — Razorpay requirement
    const finalAmountPaise = Math.max(100, BASE_AMOUNT_PAISE - discountPaise);

    return NextResponse.json({
      valid: true,
      coupon_id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: Number(coupon.discount_value),
      discount_amount_paise: discountPaise,
      final_amount_paise: finalAmountPaise,
      original_amount_paise: BASE_AMOUNT_PAISE,
      savings_display: coupon.discount_type === "percentage"
        ? `${coupon.discount_value}% off`
        : `₹${coupon.discount_value} off`,
    });
  } catch (err) {
    console.error("[coupons/validate]", err);
    return NextResponse.json({ valid: false, error: "Could not validate coupon" }, { status: 500 });
  }
}
