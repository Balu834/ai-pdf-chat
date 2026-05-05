import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/lib/supabase-server-client";
import { CREDIT_PACKS } from "@/lib/credit-packs";

function getRzp() {
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { pack_id } = await req.json();
    const pack = CREDIT_PACKS.find((p) => p.id === pack_id);
    if (!pack) return NextResponse.json({ error: "Invalid pack" }, { status: 400 });

    const order = await getRzp().orders.create({
      amount:   pack.paise,
      currency: "INR",
      notes:    { user_id: user.id, email: user.email, pack_id: pack.id, credits: pack.credits },
    });

    return NextResponse.json({
      id:       order.id,
      amount:   order.amount,
      currency: order.currency,
      pack,
    });
  } catch (err) {
    console.error("[buy-credits]", err);
    return NextResponse.json({ error: err.message || "Could not create order" }, { status: 500 });
  }
}
