import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/lib/supabase-server-client";

const rzp = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Credit packs: { paise, credits, label }
export const CREDIT_PACKS = [
  { id: "starter",  paise: 9900,  credits: 100,  label: "Starter Pack"  },
  { id: "popular",  paise: 29900, credits: 350,  label: "Popular Pack"  },
  { id: "power",    paise: 99900, credits: 1500, label: "Power Pack"    },
];

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { pack_id } = await req.json();
    const pack = CREDIT_PACKS.find((p) => p.id === pack_id);
    if (!pack) return NextResponse.json({ error: "Invalid pack" }, { status: 400 });

    const order = await rzp.orders.create({
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
