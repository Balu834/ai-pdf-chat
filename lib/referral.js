import { getAdminClient } from "@/lib/admin-client";
import crypto from "crypto";

// One-way hash of client IP — stored for fraud detection, never plain-text
export function hashIp(ip) {
  if (!ip) return null;
  return crypto.createHash("sha256").update(ip + (process.env.IP_HASH_SALT || "intellixy")).digest("hex").slice(0, 32);
}

// Get client IP from Next.js request headers.
// x-real-ip is set by Vercel infrastructure and cannot be spoofed by clients;
// x-forwarded-for is a fallback for self-hosted deployments.
export function getClientIp(request) {
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null
  );
}

// Get or create a referral code for a user (backfills legacy accounts)
export async function getOrCreateCode(userId) {
  const { data: existing } = await getAdminClient()
    .from("user_referrals")
    .select("referral_code, total_invites, total_rewards")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return existing;

  // Trigger didn't run (legacy user) — backfill via RPC
  const { data: code } = await getAdminClient().rpc("get_or_create_referral_code", { p_user_id: userId });
  const { data: row } = await getAdminClient()
    .from("user_referrals")
    .select("referral_code, total_invites, total_rewards")
    .eq("user_id", userId)
    .maybeSingle();
  return row ?? { referral_code: code, total_invites: 0, total_rewards: 0 };
}

// Full stats for the referral dashboard card
export async function getReferralStats(userId) {
  const [refRow, referralsRes] = await Promise.all([
    getAdminClient()
      .from("user_referrals")
      .select("referral_code, total_invites, total_rewards")
      .eq("user_id", userId)
      .maybeSingle(),
    getAdminClient()
      .from("referrals")
      .select("id, referred_id, inviter_credits, created_at")
      .eq("inviter_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return {
    code:          refRow.data?.referral_code  ?? null,
    total_invites: refRow.data?.total_invites  ?? 0,
    total_rewards: refRow.data?.total_rewards  ?? 0,
    recent:        referralsRes.data           ?? [],
  };
}

// Claim a referral — calls the atomic Postgres RPC
export async function claimReferral(referredId, refCode, ipHash = null) {
  const { data, error } = await getAdminClient().rpc("claim_referral", {
    p_referred_id: referredId,
    p_ref_code:    refCode,
    p_ip_hash:     ipHash,
  });
  if (error) throw error;
  return data; // { ok, reason? }
}
