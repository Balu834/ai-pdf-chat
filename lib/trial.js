import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TRIAL_DAYS = 7;

/**
 * Grant a 7-day Pro trial to a brand-new user.
 *
 * Called from auth/callback immediately after session exchange.
 *
 * Design:
 *  - Uses UPSERT (not INSERT + early-return) so it works whether the
 *    on_auth_user_created trigger already created a free row or not.
 *  - subscription_status = "trial" requires the updated CHECK constraint
 *    in ensure-user-plans.sql.  If you haven't run that yet, "active" is
 *    also acceptable — pro_expires_at + is_trial are the authoritative
 *    trial signals anyway.
 *  - Skips silently if the user already has a trial or a paid plan, so
 *    it's safe to call on every login (e.g. social-auth re-logins).
 */
export async function startTrial(userId) {
  if (!userId) return;

  try {
    // ── Check whether this user already has a meaningful plan ────────────
    // We use service-role (bypasses RLS) so this read is always authoritative.
    const { data: existing, error: readErr } = await admin
      .from("user_plans")
      .select("user_id, plan, is_trial, subscription_status")
      .eq("user_id", userId)
      .maybeSingle();

    if (readErr) {
      console.warn("[trial] could not read user_plans for", userId, "—", readErr.message);
    }

    // Skip: already on a trial or a paid plan (don't override real upgrades)
    if (existing?.is_trial || existing?.plan === "pro") {
      console.log(`[trial] user ${userId} already has plan=${existing.plan} is_trial=${existing.is_trial} — skipping`);
      return;
    }

    // ── Upsert the trial row ──────────────────────────────────────────────
    // UPSERT handles two scenarios:
    //   a) No row yet (trigger failed / hasn't fired) → INSERT
    //   b) Free row from trigger → UPDATE to pro+trial
    const now      = new Date();
    const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    const { error: upsertErr } = await admin
      .from("user_plans")
      .upsert(
        {
          user_id:             userId,
          plan:                "pro",
          is_trial:            true,
          subscription_status: "trial",   // "trial" is in the constraint after ensure-user-plans.sql
          trial_start:         now.toISOString(),
          trial_end:           trialEnd.toISOString(),
          pro_expires_at:      trialEnd.toISOString(),
          updated_at:          now.toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertErr) {
      console.error("[trial] startTrial upsert failed for", userId, "—", upsertErr.message);
      return;
    }

    console.log(`[trial] Started ${TRIAL_DAYS}-day trial for user ${userId} — expires ${trialEnd.toISOString()}`);
  } catch (err) {
    // Non-fatal — user still gets a free row from the trigger
    console.warn("[trial] startTrial threw for", userId, ":", err.message);
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
