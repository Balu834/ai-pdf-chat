import { getAdminClient } from "@/lib/admin-client";

// gpt-4o-mini token prices (USD)
const PRICE_INPUT_PER_TOKEN  = 0.00000015; // $0.15 / 1M input
const PRICE_OUTPUT_PER_TOKEN = 0.00000060; // $0.60 / 1M output

export async function getCredits(userId) {
  const { data } = await getAdminClient()
    .from("user_credits")
    .select("balance, lifetime_earned, lifetime_spent")
    .eq("user_id", userId)
    .maybeSingle();
  return data ?? { balance: 0, lifetime_earned: 0, lifetime_spent: 0 };
}

export async function addCredits(userId, amount, type = "bonus", description = "") {
  try {
    await getAdminClient().rpc("provision_credits", {
      p_user_id:    userId,
      p_amount:     amount,
      p_type:       type,
      p_description: description,
    });
  } catch (err) {
    console.warn("[credits] addCredits failed:", err.message);
  }
}

// Returns true if a credit was deducted, false if balance was 0
export async function deductCredit(userId) {
  try {
    const { data } = await getAdminClient().rpc("deduct_one_credit", { p_user_id: userId });
    return data === true;
  } catch (err) {
    console.warn("[credits] deductCredit failed:", err.message);
    return false;
  }
}

export async function logUsage(userId, {
  documentId = null,
  sessionId  = null,
  promptTokens     = 0,
  completionTokens = 0,
  creditsUsed      = 0,
} = {}) {
  const totalTokens = promptTokens + completionTokens;
  const costUsd = (promptTokens * PRICE_INPUT_PER_TOKEN) + (completionTokens * PRICE_OUTPUT_PER_TOKEN);

  try {
    await getAdminClient().from("usage_logs").insert({
      user_id:           userId,
      document_id:       documentId,
      session_id:        sessionId,
      prompt_tokens:     promptTokens,
      completion_tokens: completionTokens,
      total_tokens:      totalTokens,
      cost_usd:          costUsd,
      credits_used:      creditsUsed,
    });
  } catch (err) {
    console.warn("[credits] logUsage failed (non-fatal):", err.message);
  }

  return { totalTokens, costUsd };
}

export async function getRecentTransactions(userId, limit = 10) {
  const { data } = await getAdminClient()
    .from("credit_transactions")
    .select("id, type, amount, description, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getUsageSummary(userId) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await getAdminClient()
    .from("usage_logs")
    .select("total_tokens, cost_usd, credits_used, created_at")
    .eq("user_id", userId)
    .gte("created_at", thirtyDaysAgo);

  if (!data?.length) return { total_tokens: 0, cost_usd: 0, credits_used: 0, questions: 0 };

  return data.reduce(
    (acc, r) => ({
      total_tokens:  acc.total_tokens  + r.total_tokens,
      cost_usd:      acc.cost_usd      + Number(r.cost_usd),
      credits_used:  acc.credits_used  + r.credits_used,
      questions:     acc.questions     + 1,
    }),
    { total_tokens: 0, cost_usd: 0, credits_used: 0, questions: 0 }
  );
}
