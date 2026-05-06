import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-client";
import { createClient } from "@/lib/supabase-server-client";

function isAdmin(email) {
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
  return adminEmails.includes(email?.toLowerCase());
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sb = getAdminClient();
    const now = new Date();
    const monthStart     = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const thirtyDaysAgo  = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      usersResult,
      activeSubsResult,
      trialUsersResult,
      mrrResult,
      lastMrrResult,
      totalRevenueResult,
      recentPaymentsResult,
      recentUsersResult,
      dailyRevenueResult,
      aiUsageResult,
    ] = await Promise.all([
      sb.auth.admin.listUsers({ perPage: 1 }),

      sb.from("user_plans")
        .select("user_id", { count: "exact", head: true })
        .eq("plan", "pro")
        .eq("is_trial", false)
        .eq("subscription_status", "active"),

      sb.from("user_plans")
        .select("user_id", { count: "exact", head: true })
        .eq("is_trial", true)
        .eq("subscription_status", "trial"),

      sb.from("payments")
        .select("amount")
        .gte("created_at", monthStart)
        .eq("status", "captured"),

      sb.from("payments")
        .select("amount")
        .gte("created_at", lastMonthStart)
        .lt("created_at", monthStart)
        .eq("status", "captured"),

      sb.from("payments")
        .select("amount")
        .eq("status", "captured"),

      sb.from("payments")
        .select("id, user_id, payment_id, amount, original_amount, discount_amount, coupon_code, status, created_at")
        .eq("status", "captured")
        .order("created_at", { ascending: false })
        .limit(20),

      sb.from("user_plans")
        .select("user_id, plan, subscription_status, is_trial, trial_end, pro_expires_at, updated_at")
        .order("updated_at", { ascending: false })
        .limit(20),

      sb.from("payments")
        .select("amount, created_at")
        .eq("status", "captured")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: true }),

      sb.from("usage_logs")
        .select("total_tokens, cost_usd, credits_used")
        .gte("created_at", thirtyDaysAgo),
    ]);

    const mrr          = (mrrResult.data          || []).reduce((s, p) => s + p.amount, 0);
    const lastMrr      = (lastMrrResult.data       || []).reduce((s, p) => s + p.amount, 0);
    const mrrChange    = lastMrr > 0 ? Math.round(((mrr - lastMrr) / lastMrr) * 100) : null;
    const totalRevenue = (totalRevenueResult.data  || []).reduce((s, p) => s + p.amount, 0);

    const dailyBuckets = {};
    for (const p of dailyRevenueResult.data || []) {
      const day = p.created_at.slice(0, 10);
      dailyBuckets[day] = (dailyBuckets[day] || 0) + p.amount;
    }
    const dailyRevenue = Object.entries(dailyBuckets).map(([date, amount]) => ({ date, amount }));

    const aiRows        = aiUsageResult.data || [];
    const aiTotalTokens  = aiRows.reduce((s, r) => s + (r.total_tokens  ?? 0), 0);
    const aiCostUsd      = aiRows.reduce((s, r) => s + Number(r.cost_usd ?? 0), 0);
    const aiCreditsSpent = aiRows.reduce((s, r) => s + (r.credits_used  ?? 0), 0);
    const aiQuestions    = aiRows.length;
    const totalRevenueUsd   = totalRevenue / 100 / 83;
    const estimatedProfit   = totalRevenueUsd - aiCostUsd;

    return NextResponse.json({
      total_users:         usersResult.data?.total ?? 0,
      active_subs:         activeSubsResult.count  ?? 0,
      trial_users:         trialUsersResult.count  ?? 0,
      mrr_paise:           mrr,
      mrr_change_pct:      mrrChange,
      total_revenue_paise: totalRevenue,
      recent_payments:     recentPaymentsResult.data || [],
      recent_users:        recentUsersResult.data    || [],
      daily_revenue:       dailyRevenue,
      ai_usage_30d: {
        questions:     aiQuestions,
        total_tokens:  aiTotalTokens,
        cost_usd:      Math.round(aiCostUsd      * 10000) / 10000,
        credits_spent: aiCreditsSpent,
      },
      estimated_profit_usd: Math.round(estimatedProfit * 100) / 100,
    });
  } catch (err) {
    console.error("[admin/stats]", err?.message ?? err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
