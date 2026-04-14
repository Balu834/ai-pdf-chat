import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/lib/supabase-server-client";
import { getUserPlan } from "@/lib/user-plan";
import { createClient as createAdmin } from "@supabase/supabase-js";

const admin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/razorpay/cancel-subscription
 *
 * Cancels the user's Razorpay subscription at end of current billing cycle.
 * The user retains Pro access until pro_expires_at — they are NOT immediately
 * downgraded. The subscription.cancelled webhook (or the daily cron) handles
 * the eventual downgrade.
 *
 * cancel_at_cycle_end = 1 → Razorpay cancels after the current period ends.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const planData = await getUserPlan(user.id);
    const subscriptionId = planData.razorpay_subscription_id;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "No active Razorpay subscription found" },
        { status: 400 }
      );
    }

    if (planData.subscription_status === "cancelled") {
      return NextResponse.json(
        { error: "Subscription is already cancelled" },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // cancel_at_cycle_end = 1 → user keeps Pro until current period ends
    await razorpay.subscriptions.cancel(subscriptionId, true);

    // Optimistically update DB — webhook will also fire and confirm this
    await admin
      .from("user_plans")
      .update({
        subscription_status: "cancelled",
        next_billing_date: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    console.log(
      `[cancel-subscription] User ${user.id} cancelled subscription ${subscriptionId} — access until ${planData.pro_expires_at}`
    );

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled. You keep Pro access until your current period ends.",
      pro_expires_at: planData.pro_expires_at,
    });
  } catch (err) {
    console.error("[cancel-subscription]", err);
    return NextResponse.json(
      { error: err.message || "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
