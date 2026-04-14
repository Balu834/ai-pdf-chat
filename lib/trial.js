import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TRIAL_DAYS = 7;

/**
 * Start a 7-day free trial for a new user.
 * Safe to call on every login — skips if the user already has a plan row.
 * Trial gives full Pro access via pro_expires_at = trial_end.
 */
export async function startTrial(userId) {
  try {
    // Only activate for brand new users (no user_plans row yet)
    const { data: existing } = await admin
      .from("user_plans")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) return; // returning user — skip

    const now = new Date();
    const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    await admin.from("user_plans").insert({
      user_id:             userId,
      plan:                "pro",
      is_trial:            true,
      subscription_status: "trial",
      trial_start:         now.toISOString(),
      trial_end:           trialEnd.toISOString(),
      pro_expires_at:      trialEnd.toISOString(), // isProActive() works without any change
      updated_at:          now.toISOString(),
    });

    console.log(`[trial] Started 7-day trial for user ${userId} — expires ${trialEnd.toISOString()}`);
  } catch (err) {
    // Non-fatal — user just won't have a trial if this fails
    console.warn("[trial] startTrial error:", err.message);
  }
}

/**
 * Returns the number of whole days remaining in a trial.
 * Returns 0 if trialEnd is null or already passed.
 */
export function getTrialDaysLeft(trialEnd) {
  if (!trialEnd) return 0;
  const ms = new Date(trialEnd) - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}
