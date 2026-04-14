import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DEFAULT_PLAN = {
  plan: "free",
  pro_expires_at: null,
  grace_until: null,
  subscription_status: "inactive",
  is_trial: false,
  trial_start: null,
  trial_end: null,
  stripe_customer_id: null,
  stripe_subscription_id: null,
  razorpay_subscription_id: null,
};

const USER_PLAN_SELECT =
  "plan, pro_expires_at, grace_until, subscription_status, is_trial, trial_start, trial_end, stripe_customer_id, stripe_subscription_id, razorpay_subscription_id";

export async function getUserPlan(userId) {
  try {
    const { data, error } = await admin
      .from("user_plans")
      .select(USER_PLAN_SELECT)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[user-plan] getUserPlan DB error for", userId, ":", error.message);
      return DEFAULT_PLAN;
    }

    if (data) return data;

    // No row — trigger should have created one at signup, but didn't (legacy user,
    // trigger not yet deployed, or test environment). Provision now so subsequent
    // calls don't keep returning DEFAULT_PLAN incorrectly.
    console.warn("[user-plan] No user_plans row for", userId, "— auto-provisioning free plan");

    const { data: newRow, error: upsertErr } = await admin
      .from("user_plans")
      .upsert(
        { user_id: userId, plan: "free", subscription_status: "inactive", updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      )
      .select(USER_PLAN_SELECT)
      .single();

    if (upsertErr) {
      console.error("[user-plan] auto-provision failed for", userId, ":", upsertErr.message);
      return DEFAULT_PLAN;
    }

    return newRow || DEFAULT_PLAN;
  } catch (err) {
    console.error("[user-plan] getUserPlan threw for", userId, ":", err.message);
    return DEFAULT_PLAN;
  }
}

/**
 * Returns true if the user currently has an active Pro subscription.
 *
 * Three independent signals — any one grants Pro:
 *  1. subscription_status === "active"  — DB says subscription is live.
 *     Set by verify-payment; cleared to "expired" by cron / "cancelled" by webhook.
 *     Protects against missed webhook renewals where pro_expires_at lags behind.
 *  2. pro_expires_at > now              — paid period explicitly running.
 *  3. grace_until > now                 — payment failed, 3-day grace window.
 *
 * plan must be "pro" for any of the above to matter.
 */
export async function isProActive(userId) {
  try {
    const data = await getUserPlan(userId);
    if (data.plan !== "pro") return false;

    const now = new Date();
    if (data.subscription_status === "active")                          return true;
    if (data.pro_expires_at && new Date(data.pro_expires_at) > now)    return true;
    if (data.grace_until    && new Date(data.grace_until)    > now)    return true;
    return false;
  } catch {
    return false;
  }
}

export async function upsertUserPlan(userId, fields) {
  try {
    const { error } = await admin.from("user_plans").upsert(
      { user_id: userId, updated_at: new Date().toISOString(), ...fields },
      { onConflict: "user_id" }
    );
    if (error) console.warn("[user-plan] upsertUserPlan error:", error.message);
  } catch (err) {
    console.warn("[user-plan] upsertUserPlan threw:", err.message);
  }
}

export async function getUserIdByCustomer(stripeCustomerId) {
  try {
    const { data, error } = await admin
      .from("user_plans")
      .select("user_id")
      .eq("stripe_customer_id", stripeCustomerId)
      .maybeSingle();

    if (error) {
      console.warn("[user-plan] getUserIdByCustomer error:", error.message);
      return null;
    }
    return data?.user_id || null;
  } catch (err) {
    console.warn("[user-plan] getUserIdByCustomer threw:", err.message);
    return null;
  }
}

export async function getUserIdByRazorpaySubscription(subscriptionId) {
  try {
    const { data, error } = await admin
      .from("user_plans")
      .select("user_id")
      .eq("razorpay_subscription_id", subscriptionId)
      .maybeSingle();

    if (error) {
      console.warn("[user-plan] getUserIdByRazorpaySubscription error:", error.message);
      return null;
    }
    return data?.user_id || null;
  } catch (err) {
    console.warn("[user-plan] getUserIdByRazorpaySubscription threw:", err.message);
    return null;
  }
}
