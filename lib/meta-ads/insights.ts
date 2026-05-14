/**
 * lib/meta-ads/insights.ts
 *
 * Meta Marketing API v19.0 client.
 *
 * Pulls campaign-level insights (spend, CTR, CPC, frequency, conversions) and
 * evaluates them against Intellixy-specific alert thresholds.
 *
 * The access token comes from the `integrations` table (stored by oauth/meta/callback).
 * Short-lived tokens are automatically exchanged for long-lived ones on first use.
 *
 * Usage:
 *   import { fetchAccountInsights, evaluateAlerts } from "@/lib/meta-ads/insights";
 */

const META_API = "https://graph.facebook.com/v19.0";
const TIMEOUT  = 12_000;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MetaAction {
  action_type: string;
  value:       string;
}

export interface MetaCampaignInsight {
  campaign_id:           string;
  campaign_name:         string;
  spend:                 string;  // total spend, campaign currency
  impressions:           string;
  clicks:                string;
  ctr:                   string;  // link click-through rate %
  cpc:                   string;  // cost per link click
  cpm:                   string;  // cost per 1000 impressions
  reach:                 string;
  frequency:             string;  // avg impressions per unique person
  actions:               MetaAction[] | null;
  cost_per_action_type:  MetaAction[] | null;
  date_start:            string;
  date_stop:             string;
}

export interface AccountInsightsResult {
  adAccountId: string;
  currency:    string;
  campaigns:   MetaCampaignInsight[];
  totals: {
    spend:         number;
    impressions:   number;
    clicks:        number;
    ctr:           number;
    cpc:           number;
    cpm:           number;
    reach:         number;
    conversions:   number;  // CompleteRegistration events
    costPerLead:   number;  // spend / conversions
  };
  dateRange: { start: string; stop: string };
}

export type AlertSeverity = "warning" | "critical";

export interface MetaAlert {
  severity:     AlertSeverity;
  type:         string;
  campaignName: string;
  campaignId:   string;
  message:      string;
  value:        string;
  threshold:    string;
}

// ── Thresholds (tuned for Indian SaaS / PDF-chat product) ────────────────────

const THRESHOLDS = {
  frequencyWarning:       3.5,  // audience fatigue starts
  frequencyCritical:      5.0,  // severe fatigue — pause or refresh creative
  ctrWarning:             0.6,  // % — below this creative is weak
  ctrCritical:            0.3,  // % — creative is failing, pause immediately
  cpcWarning:             60,   // INR — high for Indian SaaS
  cpcCritical:            120,  // INR — unscalable
  dailySpendSpikeRatio:   2.2,  // today / 7d avg > 2.2x → spike alert
  zeroCvWindowSpend:      500,  // INR — if spent this with 0 conversions, alert
  costPerLeadWarning:     400,  // INR per signup — approaching unviable
  costPerLeadCritical:    800,  // INR per signup — stop campaign
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function n(s: string | undefined | null): number {
  return parseFloat(s ?? "0") || 0;
}

function getConversions(actions: MetaAction[] | null): number {
  if (!actions) return 0;
  return actions
    .filter((a) =>
      a.action_type === "offsite_conversion.fb_pixel_complete_registration" ||
      a.action_type === "complete_registration"
    )
    .reduce((sum, a) => sum + n(a.value), 0);
}

async function apiFetch<T>(
  path: string,
  params: Record<string, string>,
  token: string
): Promise<T> {
  const url = new URL(`${META_API}/${path}`);
  url.searchParams.set("access_token", token);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);

  try {
    const r = await fetch(url.toString(), { signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      throw new Error(`Meta API ${r.status}: ${body.slice(0, 300)}`);
    }
    return r.json() as Promise<T>;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ── Token exchange: short-lived → long-lived (60-day) ────────────────────────

export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<string | null> {
  const appId     = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) return null;

  try {
    const url = new URL(`${META_API}/oauth/access_token`);
    url.searchParams.set("grant_type",        "fb_exchange_token");
    url.searchParams.set("client_id",         appId);
    url.searchParams.set("client_secret",     appSecret);
    url.searchParams.set("fb_exchange_token", shortLivedToken);

    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
    const r = await fetch(url.toString(), { signal: ctrl.signal });
    clearTimeout(timer);

    const data = await r.json() as { access_token?: string };
    return data.access_token ?? null;
  } catch {
    return null;
  }
}

// ── Core: fetch account-level campaign insights ───────────────────────────────

export async function fetchAccountInsights(
  adAccountId: string,  // e.g. "act_1234567890"
  accessToken: string,
  options: {
    dateRange?: "today" | "yesterday" | "last_7d" | "last_30d";
    level?:     "campaign" | "adset" | "ad";
  } = {}
): Promise<AccountInsightsResult> {
  const { dateRange = "last_7d", level = "campaign" } = options;

  const datePreset: Record<string, string> = {
    today:    "today",
    yesterday:"yesterday",
    last_7d:  "last_7d",
    last_30d: "last_30d",
  };

  const fields = [
    "campaign_id",
    "campaign_name",
    "spend",
    "impressions",
    "clicks",
    "ctr",
    "cpc",
    "cpm",
    "reach",
    "frequency",
    "actions",
    "cost_per_action_type",
    "date_start",
    "date_stop",
  ].join(",");

  type InsightsResponse = { data: MetaCampaignInsight[]; paging?: unknown };

  // Paginate all results (Meta returns max 25 per page)
  const campaigns: MetaCampaignInsight[] = [];
  let after: string | undefined;

  do {
    const params: Record<string, string> = {
      fields,
      level,
      date_preset: datePreset[dateRange],
      limit:       "100",
    };
    if (after) params.after = after;

    const res = await apiFetch<InsightsResponse>(
      `${adAccountId}/insights`,
      params,
      accessToken
    );

    campaigns.push(...(res.data ?? []));
    after = (res.paging as { cursors?: { after?: string } } | undefined)
      ?.cursors?.after;
  } while (after && campaigns.length < 500);

  // Aggregate totals
  let totalSpend = 0, totalImpressions = 0, totalClicks = 0;
  let totalReach = 0, totalConversions = 0;

  for (const c of campaigns) {
    totalSpend       += n(c.spend);
    totalImpressions += n(c.impressions);
    totalClicks      += n(c.clicks);
    totalReach       += n(c.reach);
    totalConversions += getConversions(c.actions);
  }

  const ctr           = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const cpc           = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const cpm           = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
  const costPerLead   = totalConversions > 0 ? totalSpend / totalConversions : 0;
  const dateStart     = campaigns[0]?.date_start ?? "";
  const dateStop      = campaigns[0]?.date_stop  ?? "";

  return {
    adAccountId,
    currency: "INR",
    campaigns,
    totals: {
      spend: totalSpend,
      impressions: totalImpressions,
      clicks: totalClicks,
      ctr:    Math.round(ctr * 1000) / 1000,
      cpc:    Math.round(cpc * 100)  / 100,
      cpm:    Math.round(cpm * 100)  / 100,
      reach:  totalReach,
      conversions:  totalConversions,
      costPerLead:  Math.round(costPerLead * 100) / 100,
    },
    dateRange: { start: dateStart, stop: dateStop },
  };
}

// ── Alert engine ──────────────────────────────────────────────────────────────

export function evaluateAlerts(
  result: AccountInsightsResult,
  todaySpend?: number     // pass today's spend to check spike vs 7d avg
): MetaAlert[] {
  const alerts: MetaAlert[] = [];
  const { campaigns, totals } = result;

  for (const c of campaigns) {
    const freq  = n(c.frequency);
    const ctr   = n(c.ctr);
    const cpc   = n(c.cpc);
    const spend = n(c.spend);
    const cvs   = getConversions(c.actions);
    const cpl   = cvs > 0 ? spend / cvs : 0;

    // ── Audience fatigue ─────────────────────────────────────────────────
    if (freq >= THRESHOLDS.frequencyCritical) {
      alerts.push({
        severity:     "critical",
        type:         "audience_fatigue",
        campaignName: c.campaign_name,
        campaignId:   c.campaign_id,
        message:      `Severe audience fatigue — same people seeing your ad ${freq.toFixed(1)}× on average. Pause or refresh creative immediately.`,
        value:        `Frequency ${freq.toFixed(1)}`,
        threshold:    `Threshold: ${THRESHOLDS.frequencyCritical}`,
      });
    } else if (freq >= THRESHOLDS.frequencyWarning) {
      alerts.push({
        severity:     "warning",
        type:         "audience_fatigue",
        campaignName: c.campaign_name,
        campaignId:   c.campaign_id,
        message:      `Audience fatigue building — frequency ${freq.toFixed(1)}. Expand audience or swap creative within 48h.`,
        value:        `Frequency ${freq.toFixed(1)}`,
        threshold:    `Threshold: ${THRESHOLDS.frequencyWarning}`,
      });
    }

    // ── Low CTR ──────────────────────────────────────────────────────────
    if (spend > 200 && ctr < THRESHOLDS.ctrCritical) {
      alerts.push({
        severity:     "critical",
        type:         "low_ctr",
        campaignName: c.campaign_name,
        campaignId:   c.campaign_id,
        message:      `CTR critically low at ${ctr.toFixed(2)}%. Creative is not stopping the scroll. Pause and test a new hook.`,
        value:        `CTR ${ctr.toFixed(2)}%`,
        threshold:    `Threshold: ${THRESHOLDS.ctrCritical}%`,
      });
    } else if (spend > 100 && ctr < THRESHOLDS.ctrWarning) {
      alerts.push({
        severity:     "warning",
        type:         "low_ctr",
        campaignName: c.campaign_name,
        campaignId:   c.campaign_id,
        message:      `CTR below target at ${ctr.toFixed(2)}%. Hook needs improvement — test a pain-first or curiosity-gap variant.`,
        value:        `CTR ${ctr.toFixed(2)}%`,
        threshold:    `Threshold: ${THRESHOLDS.ctrWarning}%`,
      });
    }

    // ── High CPC ─────────────────────────────────────────────────────────
    if (spend > 200 && cpc > THRESHOLDS.cpcCritical) {
      alerts.push({
        severity:     "critical",
        type:         "high_cpc",
        campaignName: c.campaign_name,
        campaignId:   c.campaign_id,
        message:      `CPC of ₹${cpc.toFixed(0)} is unsustainable. Check audience overlap, bid cap, and creative relevance score.`,
        value:        `CPC ₹${cpc.toFixed(0)}`,
        threshold:    `Threshold: ₹${THRESHOLDS.cpcCritical}`,
      });
    } else if (spend > 100 && cpc > THRESHOLDS.cpcWarning) {
      alerts.push({
        severity:     "warning",
        type:         "high_cpc",
        campaignName: c.campaign_name,
        campaignId:   c.campaign_id,
        message:      `CPC of ₹${cpc.toFixed(0)} is above target. Consider narrowing audience or testing lower bid.`,
        value:        `CPC ₹${cpc.toFixed(0)}`,
        threshold:    `Threshold: ₹${THRESHOLDS.cpcWarning}`,
      });
    }

    // ── Conversion drought (spent budget, zero signups) ───────────────
    if (spend > THRESHOLDS.zeroCvWindowSpend && cvs === 0) {
      alerts.push({
        severity:     "critical",
        type:         "conversion_drought",
        campaignName: c.campaign_name,
        campaignId:   c.campaign_id,
        message:      `₹${spend.toFixed(0)} spent with ZERO conversions. Check pixel firing (CompleteRegistration), landing page, and audience.`,
        value:        `₹${spend.toFixed(0)} spend, 0 signups`,
        threshold:    `Threshold: ₹${THRESHOLDS.zeroCvWindowSpend}`,
      });
    }

    // ── High cost per lead ────────────────────────────────────────────
    if (cvs > 0 && cpl > THRESHOLDS.costPerLeadCritical) {
      alerts.push({
        severity:     "critical",
        type:         "high_cpl",
        campaignName: c.campaign_name,
        campaignId:   c.campaign_id,
        message:      `Cost per signup ₹${cpl.toFixed(0)} is unsustainable (product price ₹299). Pause this campaign.`,
        value:        `CPL ₹${cpl.toFixed(0)}`,
        threshold:    `Threshold: ₹${THRESHOLDS.costPerLeadCritical}`,
      });
    } else if (cvs > 0 && cpl > THRESHOLDS.costPerLeadWarning) {
      alerts.push({
        severity:     "warning",
        type:         "high_cpl",
        campaignName: c.campaign_name,
        campaignId:   c.campaign_id,
        message:      `Cost per signup ₹${cpl.toFixed(0)} is approaching limit. Optimize landing page and audience.`,
        value:        `CPL ₹${cpl.toFixed(0)}`,
        threshold:    `Threshold: ₹${THRESHOLDS.costPerLeadWarning}`,
      });
    }
  }

  // ── Account-level: spend spike ────────────────────────────────────────────
  if (todaySpend !== undefined && result.totals.spend > 0) {
    const sevenDayAvg = totals.spend / 7;
    if (sevenDayAvg > 0 && todaySpend > sevenDayAvg * THRESHOLDS.dailySpendSpikeRatio) {
      alerts.push({
        severity:     "critical",
        type:         "spend_spike",
        campaignName: "ALL CAMPAIGNS",
        campaignId:   result.adAccountId,
        message:      `Daily spend ₹${todaySpend.toFixed(0)} is ${(todaySpend / sevenDayAvg).toFixed(1)}× the 7-day average (₹${sevenDayAvg.toFixed(0)}). Check for runaway campaigns.`,
        value:        `Today: ₹${todaySpend.toFixed(0)}`,
        threshold:    `7d avg: ₹${sevenDayAvg.toFixed(0)}`,
      });
    }
  }

  return alerts;
}

// ── Summary formatter ─────────────────────────────────────────────────────────

export function formatInsightsSummary(
  result: AccountInsightsResult
): string {
  const t = result.totals;
  return [
    `📊 Meta Ads — ${result.dateRange.start} to ${result.dateRange.stop}`,
    `Spend: ₹${t.spend.toFixed(2)} | Reach: ${t.reach.toLocaleString()}`,
    `CTR: ${t.ctr.toFixed(2)}% | CPC: ₹${t.cpc.toFixed(2)} | CPM: ₹${t.cpm.toFixed(2)}`,
    `Conversions: ${t.conversions} | CPL: ${t.conversions > 0 ? `₹${t.costPerLead.toFixed(0)}` : "N/A"}`,
    `Active campaigns: ${result.campaigns.length}`,
  ].join("\n");
}
