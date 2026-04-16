/**
 * lib/subscription.ts
 *
 * Single source of truth for all subscription checks.
 *
 * Design principles:
 *   1. NEVER swallow errors silently — a DB failure must NOT look like "user is free".
 *      Silent failures are what cause paid users to get 403.
 *   2. All reads use the service-role client to bypass RLS.
 *   3. Expiry is checked at call time — no caching, no stale state.
 *   4. upgradeUser() is idempotent — safe to call multiple times.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Plan = "free" | "pro";
export type SubStatus = "active" | "inactive" | "cancelled" | "expired" | "halted";

export interface Subscription {
  userId:          string;
  plan:            Plan;
  status:          SubStatus;
  /** True when user has current Pro access (includes grace period). */
  isPro:           boolean;
  currentPeriodEnd: string | null;  // ISO string, null = no expiry
  /** Set when payment fails. User stays Pro until this date. */
  graceUntil:      string | null;
  inGracePeriod:   boolean;
}

export interface UploadLimitCheck {
  allowed: boolean;
  used:    number;
  limit:   number | null;   // null = unlimited
  isPro:   boolean;
}

export interface QuestionLimitCheck {
  allowed: boolean;
  used:    number;
  limit:   number | null;
  isPro:   boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const LIMITS = {
  free: {
    pdfs:      3,   // lifetime — matches insert_document_if_under_limit DB function
    questions: 10,  // lifetime
  },
} as const;

// ─── Private: admin client ────────────────────────────────────────────────────

function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    // Throw immediately — missing env var should be a loud error in logs,
    // not a silent denial of Pro access.
    throw new Error(
      "[subscription] Missing env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
      "All subscription checks will fail until these are set."
    );
  }

  return createClient(url, key);
}

// ─── Core: getSubscription ────────────────────────────────────────────────────

/**
 * Fetch and evaluate a user's subscription.
 *
 * Throws on DB errors — callers must handle and return 500,
 * NOT 403, so paid users are never denied access due to infrastructure issues.
 */
export async function getSubscription(userId: string): Promise<Subscription> {
  const db = getAdminClient();

  const { data, error } = await db
    .from("user_plans")
    .select("plan, subscription_status, pro_expires_at, grace_until")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    // Log fully and throw — this will become a 500 in the API route, not a 403.
    console.error("[subscription] DB read failed for user", userId, "—", error.message);
    throw new Error(`Subscription check failed: ${error.message}`);
  }

  // No row — trigger should have created one at signup. If it didn't
  // (legacy user, trigger not yet deployed), provision now so the user
  // is never stuck in limbo and gets correct state on next request.
  if (!data) {
    console.warn("[subscription] No user_plans row for", userId, "— auto-provisioning free plan");

    const { error: provisionErr } = await db
      .from("user_plans")
      .upsert(
        { user_id: userId, plan: "free", subscription_status: "inactive", updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );

    if (provisionErr) {
      // Row creation failed — throw so the caller returns 500, not a silent 403
      console.error("[subscription] auto-provision failed for", userId, ":", provisionErr.message);
      throw new Error(`Could not provision user plan: ${provisionErr.message}`);
    }

    return {
      userId,
      plan:             "free",
      status:           "inactive",
      isPro:            false,
      currentPeriodEnd: null,
      graceUntil:       null,
      inGracePeriod:    false,
    };
  }

  const now     = new Date();
  const dbStatus = data.subscription_status as string;

  const periodEnd     = data.pro_expires_at ? new Date(data.pro_expires_at) : null;
  const graceEnd      = data.grace_until    ? new Date(data.grace_until)    : null;

  // Three independent signals that grant Pro access — any one is sufficient:
  //  1. subscription_status = "active"  → DB says subscription is live right now.
  //     This is set by verify-payment and cleared to "expired"/"cancelled" by the
  //     cron / webhook, so trusting it is safe. Protects against missed webhook
  //     renewals where pro_expires_at drifts behind but status is still "active".
  //  2. pro_expires_at > now            → paid period explicitly still running.
  //  3. grace_until > now               → payment failed, 3-day grace window.
  const statusActive  = dbStatus === "active";
  const periodActive  = !!periodEnd && periodEnd > now;
  const inGracePeriod = !!graceEnd  && graceEnd  > now;

  const isPro = data.plan === "pro" && (statusActive || periodActive || inGracePeriod);

  // Derive a clean status for reporting (does not affect the isPro gate above)
  let status: SubStatus;
  if (dbStatus === "cancelled")                 status = "cancelled";
  else if (dbStatus === "halted")               status = "halted";
  else if (!isPro && data.plan === "pro")       status = "expired";
  else if (data.plan === "pro")                 status = "active";
  else                                          status = "inactive";

  return {
    userId,
    plan:             isPro ? "pro" : "free",
    status,
    isPro,
    currentPeriodEnd: data.pro_expires_at ?? null,
    graceUntil:       data.grace_until    ?? null,
    inGracePeriod,
  };
}

// ─── Upload limit check ───────────────────────────────────────────────────────

/**
 * Check whether a user may upload another PDF.
 * Pro users always get { allowed: true, limit: null }.
 * Throws on infrastructure errors — callers return 500, not 403.
 */
export async function checkUploadLimit(userId: string): Promise<UploadLimitCheck> {
  const sub = await getSubscription(userId);

  if (sub.isPro) {
    return { allowed: true, used: 0, limit: null, isPro: true };
  }

  // Count directly from documents table — always accurate.
  // user_stats.total_pdfs is a derived counter that can drift if the
  // increment_total_pdfs RPC fails or documents are deleted without
  // decrementing. A live COUNT(*) is the only reliable source of truth.
  const db = getAdminClient();
  const { count, error } = await db
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("[subscription] checkUploadLimit doc count failed for", userId, "—", error.message);
    throw new Error(`Usage check failed: ${error.message}`);
  }

  const used  = count ?? 0;
  const limit = LIMITS.free.pdfs;

  return { allowed: used < limit, used, limit, isPro: false };
}

// ─── Question limit check ─────────────────────────────────────────────────────

export async function checkQuestionLimit(userId: string): Promise<QuestionLimitCheck> {
  const sub = await getSubscription(userId);

  if (sub.isPro) {
    return { allowed: true, used: 0, limit: null, isPro: true };
  }

  const db = getAdminClient();
  const { data, error } = await db
    .from("user_stats")
    .select("total_questions")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[subscription] checkQuestionLimit stats read failed for", userId, "—", error.message);
    throw new Error(`Usage check failed: ${error.message}`);
  }

  const used  = data?.total_questions ?? 0;
  const limit = LIMITS.free.questions;

  return { allowed: used < limit, used, limit, isPro: false };
}

// ─── Upgrade user ─────────────────────────────────────────────────────────────

/**
 * Idempotent: safe to call from both verify-payment and webhook.
 * Throws on failure — let callers decide whether to surface as 500.
 */
export async function upgradeUserToPro(
  userId:     string,
  periodDays: number = 30
): Promise<{ proExpiresAt: string }> {
  const db = getAdminClient();
  const proExpiresAt = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await db.from("user_plans").upsert(
    {
      user_id:             userId,
      plan:                "pro",
      is_trial:            false,
      subscription_status: "active",
      pro_expires_at:      proExpiresAt,
      grace_until:         null,
      updated_at:          new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[subscription] upgradeUserToPro failed for", userId, "—", error.message);
    throw new Error(`Upgrade failed: ${error.message}`);
  }

  console.log(`[subscription] ✅ User ${userId} upgraded to Pro — expires ${proExpiresAt}`);
  return { proExpiresAt };
}

// ─── Increment usage counters ─────────────────────────────────────────────────

export async function recordPdfUpload(userId: string): Promise<void> {
  const db = getAdminClient();
  const { error } = await db.rpc("increment_total_pdfs", { p_user_id: userId });
  if (error) {
    // Non-fatal — upload already succeeded. Log and continue.
    console.warn("[subscription] recordPdfUpload failed for", userId, "—", error.message);
  }
}

export async function recordQuestion(userId: string): Promise<void> {
  const db = getAdminClient();
  const { error } = await db.rpc("increment_total_questions", { p_user_id: userId });
  if (error) {
    console.warn("[subscription] recordQuestion failed for", userId, "—", error.message);
  }
}
