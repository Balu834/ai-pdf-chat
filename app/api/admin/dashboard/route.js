import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-client";
import { createClient } from "@/lib/supabase-server-client";


// ── In-memory cache (per range) ───────────────────────────────────────────────
const CACHE     = new Map();
const CACHE_TTL = 60_000; // 60 s

function cached(key) {
  const entry = CACHE.get(key);
  return entry && Date.now() - entry.ts < CACHE_TTL ? entry.data : null;
}
function setCache(key, data) {
  CACHE.set(key, { ts: Date.now(), data });
}

// ── Auth guard ────────────────────────────────────────────────────────────────
function isAdmin(email) {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .includes(email?.toLowerCase());
}

// ── Date helpers ──────────────────────────────────────────────────────────────
function startOf(range) {
  const now = new Date();
  switch (range) {
    case "today": { const d = new Date(now); d.setHours(0, 0, 0, 0); return d.toISOString(); }
    case "7d":    return new Date(now - 7  * 86_400_000).toISOString();
    case "30d":   return new Date(now - 30 * 86_400_000).toISOString();
    case "90d":   return new Date(now - 90 * 86_400_000).toISOString();
    default:      return null; // all time
  }
}

function dayOf(iso) { return iso.slice(0, 10); }

function bucketDays(rows, valueKey = "amount", dateKey = "created_at") {
  const b = {};
  for (const r of rows) {
    const d = dayOf(r[dateKey]);
    b[d] = (b[d] || 0) + (r[valueKey] ?? 1);
  }
  return b;
}

function fillDays(bucketMap, days) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    out.push({ date: k, value: bucketMap[k] ?? 0 });
  }
  return out;
}

// ── GET /api/admin/dashboard?range=30d ────────────────────────────────────────
export async function GET(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const range    = new URL(req.url).searchParams.get("range") ?? "30d";
    const cacheKey = `dashboard:${range}`;
    const hit      = cached(cacheKey);
    if (hit) return NextResponse.json({ ...hit, _cached: true });

    // ── Time boundaries ───────────────────────────────────────────────────────
    const now            = new Date();
    const rangeStart     = startOf(range);
    const dayStart       = (() => { const d = new Date(now); d.setHours(0, 0, 0, 0); return d.toISOString(); })();
    const weekStart      = new Date(now - 7  * 86_400_000).toISOString();
    const monthStart     = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const thirtyDaysAgo  = new Date(now - 30 * 86_400_000).toISOString();
    const chartDays      = range === "today" ? 1 : range === "7d" ? 7 : range === "90d" ? 90 : 30;

    // ── Parallel queries ──────────────────────────────────────────────────────
    const [
      totalUsersRes,
      newTodayRes,
      newWeekRes,
      newMonthRes,
      planBreakdownRes,
      cancelledMonthRes,
      signupTrendRes,
      dauRes,
      wauRes,
      mauRes,
      revTodayRes,
      revWeekRes,
      revMonthRes,
      revLastMonthRes,
      revTotalRes,
      revChartRes,
      revRangeRes,
      pdfCountRes,
      chatCountRes,
      aiUsageRes,
      couponTotalRes,
      topCouponsRes,
      recentPaymentsRes,
      recentUsersRes,
      creditsRes,
    ] = await Promise.all([
      // ── USERS ──────────────────────────────────────────────────────────────
      getAdminClient().auth.admin.listUsers({ perPage: 1 }),

      getAdminClient().from("user_plans").select("user_id", { count: "exact", head: true })
        .gte("created_at", dayStart),
      getAdminClient().from("user_plans").select("user_id", { count: "exact", head: true })
        .gte("created_at", weekStart),
      getAdminClient().from("user_plans").select("user_id", { count: "exact", head: true })
        .gte("created_at", monthStart),

      // plan breakdown (free / pro / premium)
      getAdminClient().from("user_plans").select("plan, subscription_status, is_trial"),

      // churned this month
      getAdminClient().from("user_plans").select("user_id", { count: "exact", head: true })
        .eq("subscription_status", "cancelled")
        .gte("updated_at", monthStart),

      // signup trend for chart (created_at only, last 30d)
      getAdminClient().from("user_plans").select("created_at").gte("created_at", thirtyDaysAgo),

      // ── ACTIVE USERS (via usage_logs activity) ─────────────────────────────
      getAdminClient().from("usage_logs").select("user_id").gte("created_at", dayStart).limit(5000),
      getAdminClient().from("usage_logs").select("user_id").gte("created_at", weekStart).limit(20000),
      getAdminClient().from("usage_logs").select("user_id").gte("created_at", monthStart).limit(50000),

      // ── REVENUE ────────────────────────────────────────────────────────────
      getAdminClient().from("payments").select("amount").eq("status", "captured").gte("created_at", dayStart),
      getAdminClient().from("payments").select("amount").eq("status", "captured").gte("created_at", weekStart),
      getAdminClient().from("payments").select("amount").eq("status", "captured").gte("created_at", monthStart),
      getAdminClient().from("payments").select("amount").eq("status", "captured")
        .gte("created_at", lastMonthStart).lt("created_at", monthStart),
      getAdminClient().from("payments").select("amount").eq("status", "captured"),
      getAdminClient().from("payments").select("amount, created_at").eq("status", "captured")
        .gte("created_at", thirtyDaysAgo).order("created_at"),
      rangeStart
        ? getAdminClient().from("payments").select("amount").eq("status", "captured").gte("created_at", rangeStart)
        : getAdminClient().from("payments").select("amount").eq("status", "captured"),

      // ── USAGE ──────────────────────────────────────────────────────────────
      getAdminClient().from("documents").select("id", { count: "exact", head: true }),
      getAdminClient().from("messages").select("id", { count: "exact", head: true }),

      getAdminClient().from("usage_logs").select("total_tokens, cost_usd, credits_used")
        .gte("created_at", thirtyDaysAgo),

      // ── COUPONS ────────────────────────────────────────────────────────────
      getAdminClient().from("coupon_uses").select("id", { count: "exact", head: true }),
      getAdminClient().from("coupon_uses").select("coupon_id, coupons(code, discount_type, discount_value)").limit(500),

      // ── RECENT ACTIVITY TABLES ─────────────────────────────────────────────
      getAdminClient().from("payments")
        .select("id, amount, original_amount, discount_amount, coupon_code, created_at")
        .eq("status", "captured")
        .order("created_at", { ascending: false })
        .limit(15),

      getAdminClient().from("user_plans")
        .select("user_id, plan, subscription_status, is_trial, pro_expires_at, updated_at")
        .order("updated_at", { ascending: false })
        .limit(15),

      // Credit usage
      getAdminClient().from("credit_transactions").select("amount").limit(10000),
    ]);

    // ── Process: Users ────────────────────────────────────────────────────────
    const totalUsers = totalUsersRes.data?.total ?? 0;
    const newToday   = newTodayRes.count  ?? 0;
    const newWeek    = newWeekRes.count   ?? 0;
    const newMonth   = newMonthRes.count  ?? 0;
    const churned    = cancelledMonthRes.count ?? 0;

    const plans = planBreakdownRes.data ?? [];
    const freePlan    = plans.filter((p) => p.plan === "free"  || !p.plan).length;
    const proPlan     = plans.filter((p) => p.plan === "pro"   && !p.is_trial && p.subscription_status === "active").length;
    const premiumPlan = plans.filter((p) => p.plan === "premium").length;
    const trialPlan   = plans.filter((p) => p.is_trial === true).length;

    const churnRate = proPlan + churned > 0
      ? Math.round((churned / (proPlan + churned)) * 100)
      : 0;

    // Signup trend (last 30 days filled)
    const signupBuckets = bucketDays(signupTrendRes.data ?? [], undefined, "created_at");
    const signupTrend   = fillDays(signupBuckets, 30);

    // ── Process: Active users ─────────────────────────────────────────────────
    const dau = new Set((dauRes.data ?? []).map((r) => r.user_id)).size;
    const wau = new Set((wauRes.data ?? []).map((r) => r.user_id)).size;
    const mau = new Set((mauRes.data ?? []).map((r) => r.user_id)).size;

    // ── Process: Revenue ──────────────────────────────────────────────────────
    const sum    = (rows) => (rows ?? []).reduce((s, r) => s + (r.amount ?? 0), 0);
    const revToday     = sum(revTodayRes.data);
    const revWeek      = sum(revWeekRes.data);
    const revMonth     = sum(revMonthRes.data);
    const revLastMonth = sum(revLastMonthRes.data);
    const revTotal     = sum(revTotalRes.data);
    const revRange     = sum(revRangeRes.data);

    const mrrChange = revLastMonth > 0
      ? Math.round(((revMonth - revLastMonth) / revLastMonth) * 100)
      : null;

    const arpu = totalUsers > 0
      ? Math.round(revTotal / totalUsers)
      : 0;

    const convRate = totalUsers > 0
      ? Math.round(((proPlan + premiumPlan) / totalUsers) * 100 * 10) / 10
      : 0;

    // Revenue trend (30d)
    const revBuckets = bucketDays(revChartRes.data ?? []);
    const revTrend   = fillDays(revBuckets, 30);

    // ── Process: AI usage ─────────────────────────────────────────────────────
    const aiRows      = aiUsageRes.data ?? [];
    const aiQuestions = aiRows.length;
    const aiTokens    = aiRows.reduce((s, r) => s + (r.total_tokens   ?? 0), 0);
    const aiCostUsd   = aiRows.reduce((s, r) => s + Number(r.cost_usd ?? 0), 0);
    const aiCredits   = aiRows.reduce((s, r) => s + (r.credits_used   ?? 0), 0);

    const estimatedProfitUsd = (revTotal / 100 / 83) - aiCostUsd;

    // ── Process: Coupons ──────────────────────────────────────────────────────
    const totalRedemptions = couponTotalRes.count ?? 0;

    const couponMap = {};
    for (const row of topCouponsRes.data ?? []) {
      const code = row.coupons?.code ?? row.coupon_id;
      if (!couponMap[code]) {
        couponMap[code] = {
          code,
          discount_type:  row.coupons?.discount_type,
          discount_value: row.coupons?.discount_value,
          uses: 0,
        };
      }
      couponMap[code].uses++;
    }
    const topCoupons = Object.values(couponMap)
      .sort((a, b) => b.uses - a.uses)
      .slice(0, 8);

    // ── Process: Credits ──────────────────────────────────────────────────────
    const creditsIssued = (creditsRes.data ?? [])
      .filter((r) => r.amount > 0)
      .reduce((s, r) => s + r.amount, 0);

    // ── Assemble response ─────────────────────────────────────────────────────
    const payload = {
      // Meta
      generated_at: new Date().toISOString(),
      range,

      // Users
      total_users:   totalUsers,
      new_today:     newToday,
      new_week:      newWeek,
      new_month:     newMonth,
      dau,
      wau,
      mau,
      free_plan:     freePlan,
      pro_plan:      proPlan,
      premium_plan:  premiumPlan,
      trial_plan:    trialPlan,
      churned_month: churned,
      churn_rate:    churnRate,

      // Revenue (all in paise)
      rev_today:      revToday,
      rev_week:       revWeek,
      rev_month:      revMonth,
      rev_last_month: revLastMonth,
      rev_total:      revTotal,
      rev_range:      revRange,
      mrr_change_pct: mrrChange,
      arpu_paise:     arpu,
      conv_rate:      convRate,

      // Trends
      signup_trend: signupTrend,
      rev_trend:    revTrend,

      // Usage
      total_pdfs:     pdfCountRes.count  ?? 0,
      total_messages: chatCountRes.count ?? 0,

      // AI
      ai: {
        questions:    aiQuestions,
        tokens:       aiTokens,
        cost_usd:     Math.round(aiCostUsd   * 10000) / 10000,
        credits_used: aiCredits,
      },
      estimated_profit_usd: Math.round(estimatedProfitUsd * 100) / 100,

      // Coupons
      coupon_redemptions: totalRedemptions,
      top_coupons:        topCoupons,
      credits_issued:     creditsIssued,

      // Tables
      recent_payments: recentPaymentsRes.data ?? [],
      recent_users:    recentUsersRes.data    ?? [],
    };

    setCache(cacheKey, payload);
    return NextResponse.json(payload);
  } catch (err) {
    console.error("[admin/dashboard]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
