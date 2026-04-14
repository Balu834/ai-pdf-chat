import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/cron/check-subscriptions
 *
 * Runs daily at 2 AM UTC (see vercel.json).
 * Handles three cases:
 *
 *   1. Trial users whose trial_end has passed and have no paid subscription
 *      → downgrade to free immediately
 *
 *   2. Pro users whose pro_expires_at has passed AND:
 *      - grace_until is null  → downgrade now
 *      - grace_until > now    → skip (still in grace period, cron will catch tomorrow)
 *      - grace_until ≤ now    → grace expired, downgrade now
 *
 *   3. Users in status = halted / past_due whose grace_until has also expired
 *      → downgrade to free
 *
 * Grace period is set by the webhook when `subscription.halted` fires:
 *   grace_until = halted_at + 3 days
 * It is cleared when `subscription.charged` fires (payment recovered).
 *
 * isProActive() handles on-demand grace checking for individual API calls.
 * This cron ensures the DB plan column stays authoritative for admin reports
 * and Supabase Realtime pushes the downgrade to any open dashboards.
 *
 * Security: Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically.
 * Env: CRON_SECRET
 */
export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();
  const stats = {
    expired_trials:   0,
    grace_skipped:    0,
    grace_expired:    0,
    downgraded_subs:  0,
    errors:           [],
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Expire trials that ended without upgrading
  // ──────────────────────────────────────────────────────────────────────────
  const { data: expiredTrialUsers, error: trialFetchErr } = await admin
    .from("user_plans")
    .select("user_id")
    .eq("is_trial", true)
    .eq("subscription_status", "trial")
    .lt("trial_end", now);

  if (trialFetchErr) {
    console.error("[cron] trial fetch error:", trialFetchErr.message);
    stats.errors.push(`trial_fetch: ${trialFetchErr.message}`);
  } else if (expiredTrialUsers?.length > 0) {
    const ids = expiredTrialUsers.map((u) => u.user_id);
    const { error: trialUpdateErr } = await admin
      .from("user_plans")
      .update({
        plan:                "free",
        is_trial:            false,
        subscription_status: "expired",
        pro_expires_at:      null,
        grace_until:         null,
        updated_at:          now,
      })
      .in("user_id", ids);

    if (trialUpdateErr) {
      console.error("[cron] trial update error:", trialUpdateErr.message);
      stats.errors.push(`trial_update: ${trialUpdateErr.message}`);
    } else {
      stats.expired_trials = ids.length;
      console.log(`[cron] Expired ${ids.length} trial(s)`);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Find all Pro users whose pro_expires_at has passed
  //    Include halted/past_due users (not just "active") so nothing slips
  //    through if status was set to halted before pro_expires_at elapsed.
  // ──────────────────────────────────────────────────────────────────────────
  const { data: candidateUsers, error: subFetchErr } = await admin
    .from("user_plans")
    .select("user_id, pro_expires_at, grace_until, subscription_status")
    .eq("plan", "pro")
    .eq("is_trial", false)
    .lt("pro_expires_at", now)
    .not("subscription_status", "eq", "expired"); // skip already-expired rows

  if (subFetchErr) {
    console.error("[cron] sub fetch error:", subFetchErr.message);
    stats.errors.push(`sub_fetch: ${subFetchErr.message}`);
  } else if (candidateUsers?.length > 0) {
    const toDowngrade = [];

    for (const u of candidateUsers) {
      if (u.grace_until && new Date(u.grace_until) > new Date()) {
        // Still inside grace window — cron will catch this user tomorrow
        stats.grace_skipped++;
        console.log(
          `[cron] Grace period active for user ${u.user_id} until ${u.grace_until} — skipping`
        );
        continue;
      }

      // Grace window absent or has passed → eligible for downgrade
      if (u.grace_until) stats.grace_expired++;
      toDowngrade.push(u.user_id);
    }

    if (toDowngrade.length > 0) {
      const { error: downgradeErr } = await admin
        .from("user_plans")
        .update({
          plan:                "free",
          subscription_status: "expired",
          grace_until:         null,
          next_billing_date:   null,
          updated_at:          now,
        })
        .in("user_id", toDowngrade);

      if (downgradeErr) {
        console.error("[cron] downgrade error:", downgradeErr.message);
        stats.errors.push(`downgrade: ${downgradeErr.message}`);
      } else {
        stats.downgraded_subs = toDowngrade.length;
        console.log(`[cron] Downgraded ${toDowngrade.length} user(s) to free`);
      }
    }
  }

  console.log("[cron] ✅ Done:", JSON.stringify(stats));
  return NextResponse.json({ ok: true, ran_at: now, ...stats });
}
