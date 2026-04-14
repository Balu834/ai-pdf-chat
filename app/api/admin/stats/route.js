import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { createClient as createAdmin } from "@supabase/supabase-js";

const adminDb = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

    // Run all queries in parallel
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
    ] = await Promise.all([
      // Total user count
      adminDb.auth.admin.listUsers({ perPage: 1 }),

      // Active Pro (non-trial) subscriptions
      adminDb
        .from("user_plans")
        .select("user_id", { count: "exact", head: true })
        .eq("plan", "pro")
        .eq("is_trial", false)
        .eq("subscription_status", "active"),

      // Users currently in trial
      adminDb
        .from("user_plans")
        .select("user_id", { count: "exact", head: true })
        .eq("is_trial", true)
        .eq("subscription_status", "trial"),

      // MRR — this month's payment sum
      adminDb
        .from("payments")
        .select("amount")
        .gte("created_at", monthStart)
        .eq("status", "captured"),

      // Last month's revenue (for % change)
      adminDb
        .from("payments")
        .select("amount")
        .gte("created_at", lastMonthStart)
        .lt("created_at", monthStart)
        .eq("status", "captured"),

      // All-time total revenue
      adminDb
        .from("payments")
        .select("amount")
        .eq("status", "captured"),

      // 20 most recent payments with user email
      adminDb
        .from("payments")
        .select("id, user_id, payment_id, amount, original_amount, discount_amount, coupon_code, status, created_at")
        .eq("status", "captured")
        .order("created_at", { ascending: false })
        .limit(20),

      // 20 most recent signups (via user_plans as proxy — newest trial starters)
      adminDb
        .from("user_plans")
        .select("user_id, plan, subscription_status, is_trial, trial_end, pro_expires_at, updated_at")
        .order("updated_at", { ascending: false })
        .limit(20),

      // Daily revenue for last 30 days (for chart)
      adminDb
        .from("payments")
        .select("amount, created_at")
        .eq("status", "captured")
        .gte("created_at", new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: true }),
    ]);

    // Process MRR
    const mrr = (mrrResult.data || []).reduce((s, p) => s + p.amount, 0);
    const lastMrr = (lastMrrResult.data || []).reduce((s, p) => s + p.amount, 0);
    const mrrChange = lastMrr > 0 ? Math.round(((mrr - lastMrr) / lastMrr) * 100) : null;
    const totalRevenue = (totalRevenueResult.data || []).reduce((s, p) => s + p.amount, 0);

    // Bucket daily revenue
    const dailyBuckets = {};
    for (const p of dailyRevenueResult.data || []) {
      const day = p.created_at.slice(0, 10);
      dailyBuckets[day] = (dailyBuckets[day] || 0) + p.amount;
    }
    const dailyRevenue = Object.entries(dailyBuckets).map(([date, amount]) => ({ date, amount }));

    return NextResponse.json({
      total_users:         usersResult.data?.total ?? 0,
      active_subs:         activeSubsResult.count ?? 0,
      trial_users:         trialUsersResult.count ?? 0,
      mrr_paise:           mrr,
      mrr_change_pct:      mrrChange,
      total_revenue_paise: totalRevenue,
      recent_payments:     recentPaymentsResult.data || [],
      recent_users:        recentUsersResult.data || [],
      daily_revenue:       dailyRevenue,
    });
  } catch (err) {
    console.error("[admin/stats]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
