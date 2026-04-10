import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/lib/supabase-server-client";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Razorpay keys not configured" }, { status: 503 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Use existing plan ID from env, or create a new one (first run only)
    let planId = process.env.RAZORPAY_PLAN_ID;

    if (!planId) {
      const plan = await razorpay.plans.create({
        period: "monthly",
        interval: 1,
        item: {
          name: "Intellixy Pro",
          amount: 29900, // ₹299 in paise
          currency: "INR",
          description: "Unlimited PDFs + questions",
        },
      });
      planId = plan.id;
      // Log so you can save it as RAZORPAY_PLAN_ID env var (avoid creating duplicate plans)
      console.log(
        `[create-subscription] New Razorpay Plan created: ${planId}\n` +
          `  → Add to Vercel env: RAZORPAY_PLAN_ID=${planId}`
      );
    }

    // Debug: confirm which plan is being used before charging
    console.log("[create-subscription] Plan ID:", planId, "| Amount: ₹299 (29900 paise)");

    // Create a new subscription for this user
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 120, // 120 monthly cycles = 10 years (effectively unlimited)
      quantity: 1,
      customer_notify: 1,
      notes: {
        user_id: user.id,
        email: user.email || "",
      },
    });

    return NextResponse.json({ subscription_id: subscription.id });
  } catch (err) {
    console.error("[create-subscription]", err);
    return NextResponse.json(
      { error: err.message || "Failed to create subscription" },
      { status: 500 }
    );
  }
}
