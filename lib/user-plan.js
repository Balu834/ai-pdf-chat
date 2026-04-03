import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DEFAULT_PLAN = { plan: "free", stripe_customer_id: null, stripe_subscription_id: null };

export async function getUserPlan(userId) {
  try {
    const { data, error } = await admin
      .from("user_plans")
      .select("plan, stripe_customer_id, stripe_subscription_id")
      .eq("user_id", userId)
      .single();

    if (error) {
      // PGRST116 = row not found (user not yet in table) — treat as free
      if (error.code === "PGRST116") return DEFAULT_PLAN;
      // Any other DB error (table missing, etc.) — degrade to free
      console.warn("[user-plan] getUserPlan error:", error.message);
      return DEFAULT_PLAN;
    }

    return data || DEFAULT_PLAN;
  } catch (err) {
    console.warn("[user-plan] getUserPlan threw:", err.message);
    return DEFAULT_PLAN;
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
      .single();

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
