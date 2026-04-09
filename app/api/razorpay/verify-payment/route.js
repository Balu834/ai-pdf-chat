import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase-server-client";

export async function POST(request) {
  try {
    // Use the user's authenticated client (session cookies) — not the broken admin client
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
    }

    // Verify Razorpay HMAC signature
    const generated = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated !== razorpay_signature) {
      console.error("[verify-payment] Signature mismatch for user:", user.id);
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Upsert using the user's own authenticated client — works with RLS
    const { error: upsertError } = await supabase
      .from("user_plans")
      .upsert(
        {
          user_id: user.id,
          plan: "pro",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("[verify-payment] DB upsert failed:", upsertError.message);
      return NextResponse.json({ error: "Failed to save plan: " + upsertError.message }, { status: 500 });
    }

    console.log(`[verify-payment] User ${user.id} (${user.email}) upgraded to Pro`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[verify-payment]", err);
    return NextResponse.json({ error: err.message || "Verification failed" }, { status: 500 });
  }
}
