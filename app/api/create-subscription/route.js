import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/lib/supabase-server-client";
import { PLANS } from "@/lib/razorpay-plans";

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Razorpay keys not configured" }, { status: 503 });
    }

    // Which plan are we buying? Default to "pro" if not specified or invalid.
    let tier = "pro";
    try {
      const body = await req.json();
      if (body?.plan === "team") tier = "team";
    } catch { /* body is optional */ }

    const planMeta = PLANS[tier];

    const razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Use cached plan ID from env var, or create a new one the first time
    let planId = process.env[planMeta.envKey];

    if (!planId) {
      const plan = await razorpay.plans.create({
        period:   "monthly",
        interval: 1,
        item: {
          name:        planMeta.name,
          amount:      planMeta.amount,
          currency:    planMeta.currency,
          description: planMeta.description,
        },
      });
      planId = plan.id;
      console.log(
        `[create-subscription] New Razorpay Plan created for ${tier}: ${planId}\n` +
        `  → Add to Vercel env: ${planMeta.envKey}=${planId}`
      );
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id:         planId,
      total_count:     120,  // 120 monthly cycles = 10 years (effectively unlimited)
      quantity:        1,
      customer_notify: 1,
      notes: {
        user_id: user.id,
        email:   user.email || "",
        tier,
      },
    });

    return NextResponse.json({
      subscription_id: subscription.id,
      tier,
      amount: planMeta.amount,
    });
  } catch (err) {
    console.error("[create-subscription]", err);
    return NextResponse.json(
      { error: err.message || "Failed to create subscription" },
      { status: 500 }
    );
  }
}
