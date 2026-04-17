import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/lib/supabase-server-client";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Razorpay keys not configured" }, { status: 503 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount:   29900,
      currency: "INR",
      receipt:  `receipt_${Date.now()}`,
      notes: {
        plan:    "pro",
        user_id: user.id,
        email:   user.email || "",
      },
    });

    return NextResponse.json(order);
  } catch (err) {
    console.error("[razorpay/create-order]", err);
    return NextResponse.json({ error: err.message || "Failed to create order" }, { status: 500 });
  }
}
