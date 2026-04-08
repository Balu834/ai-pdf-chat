import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST() {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Razorpay keys not configured" }, { status: 503 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: 29900, // ₹299 in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: { plan: "pro" },
    });

    return NextResponse.json(order);
  } catch (err) {
    console.error("[razorpay/create-order]", err);
    return NextResponse.json({ error: err.message || "Failed to create order" }, { status: 500 });
  }
}
