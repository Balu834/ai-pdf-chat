/**
 * GET /api/cron/check-meta-ads
 *
 * Runs every 6 hours (see vercel.json). Pulls Meta Ads campaign insights
 * for all connected ad accounts, evaluates alert thresholds, and fires
 * Telegram + Discord alerts when anomalies are detected.
 *
 * Alert types:
 *   - audience_fatigue   — frequency > 3.5 (warning) / > 5 (critical)
 *   - low_ctr            — CTR < 0.6% (warning) / < 0.3% (critical)
 *   - high_cpc           — CPC > ₹60 (warning) / > ₹120 (critical)
 *   - conversion_drought — spent ₹500+ with 0 signups
 *   - high_cpl           — cost per signup > ₹400 (warning) / > ₹800 (critical)
 *   - spend_spike        — today > 2.2× 7-day average
 *
 * Auth: Vercel sends Authorization: Bearer <CRON_SECRET> automatically.
 */

export const dynamic = "force-dynamic";

import { NextResponse }         from "next/server";
import { getAdminClient }       from "@/lib/admin-client";
import {
  fetchAccountInsights,
  evaluateAlerts,
  formatInsightsSummary,
  type MetaAlert,
} from "@/lib/meta-ads/insights";
import { sendTelegramAlert } from "@/lib/alerts/send-telegram-alert";
import { sendDiscordAlert }  from "@/lib/alerts/send-discord-alert";

// ── Auth ──────────────────────────────────────────────────────────────────────

function isAuthed(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth  = request.headers.get("authorization");
  const param = new URL(request.url).searchParams.get("key");
  return auth === `Bearer ${secret}` || param === secret;
}

// ── Discord embed builder for Meta Ads alerts ─────────────────────────────────

function severityToDiscordColor(severity: MetaAlert["severity"]): number {
  return severity === "critical" ? 0x8B0000 : 0xFFD700; // dark red / yellow
}

async function sendMetaAlert(alert: MetaAlert, summary: string): Promise<void> {
  const icon    = alert.severity === "critical" ? "🚨" : "⚠️";
  const message = `${icon} Meta Ads: ${alert.type.replace(/_/g, " ").toUpperCase()}\n${alert.message}\n\n${summary}`;

  await Promise.allSettled([
    sendTelegramAlert({
      severity:  alert.severity === "critical" ? "critical" : "warning",
      message:   `${icon} <b>Meta Ads Alert — ${alert.type.replace(/_/g, " ")}</b>\n\n<b>Campaign:</b> ${alert.campaignName}\n${alert.message}\n\n<b>Value:</b> ${alert.value}\n<b>Threshold:</b> ${alert.threshold}\n\n${summary}`,
      route:     "cron/check-meta-ads",
      provider:  "meta_ads",
    }),
    sendDiscordAlert({
      severity: alert.severity === "critical" ? "critical" : "warning",
      message:  `${message}\n\nCampaign: ${alert.campaignName}\nValue: ${alert.value} | Threshold: ${alert.threshold}`,
      route:    "cron/check-meta-ads",
      provider: "meta_ads",
    }),
  ]);
}

// ── Cron handler ──────────────────────────────────────────────────────────────

export async function GET(request: Request): Promise<Response> {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runAt = new Date().toISOString();
  const stats = {
    accountsChecked: 0,
    alertsFired:     0,
    errors:          [] as string[],
  };

  // Load all Meta Ads integrations across all users
  const { data: integrations, error: intErr } = await getAdminClient()
    .from("integrations")
    .select("user_id, access_token, meta")
    .eq("provider", "meta_ads");

  if (intErr) {
    return NextResponse.json({ error: intErr.message }, { status: 500 });
  }

  if (!integrations?.length) {
    return NextResponse.json({
      ok:      true,
      ran_at:  runAt,
      message: "No Meta Ads accounts connected",
      ...stats,
    });
  }

  for (const integration of integrations) {
    const token      = integration.access_token as string;
    const meta       = integration.meta as { ad_accounts?: { id: string; name: string }[] } | null;
    const adAccounts = meta?.ad_accounts ?? [];

    for (const account of adAccounts) {
      stats.accountsChecked++;
      try {
        // Fetch 7-day window (for averages) and today's window in parallel
        const [sevenDay, today] = await Promise.all([
          fetchAccountInsights(account.id, token, { dateRange: "last_7d" }),
          fetchAccountInsights(account.id, token, { dateRange: "today" }),
        ]);

        const todaySpend = today.totals.spend;
        const alerts     = evaluateAlerts(sevenDay, todaySpend);
        const summary    = formatInsightsSummary(sevenDay);

        // Only fire alerts for critical issues (suppress warnings at night)
        const hour = new Date().getUTCHours();
        const isBusinessHours = hour >= 4 && hour <= 17; // 9:30 AM–11 PM IST

        const toFire = isBusinessHours
          ? alerts
          : alerts.filter((a) => a.severity === "critical");

        for (const alert of toFire) {
          stats.alertsFired++;
          await sendMetaAlert(alert, summary).catch(() => {});
        }

        console.log(JSON.stringify({
          event:   "meta_ads_check",
          account: account.name,
          spend7d: sevenDay.totals.spend,
          spendToday: todaySpend,
          alerts:  alerts.length,
          fired:   toFire.length,
          summary,
        }));

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        stats.errors.push(`${account.name} (${account.id}): ${msg}`);
        console.error("[check-meta-ads] Error for account", account.name, ":", msg);
      }
    }
  }

  // Send a daily health-check summary at 8 AM UTC (3:30 PM IST)
  const utcHour = new Date().getUTCHours();
  if (utcHour === 8) {
    await sendDiscordAlert({
      severity: "info",
      message:  `📊 Meta Ads daily check-in: ${stats.accountsChecked} accounts checked, ${stats.alertsFired} alerts fired.`,
      route:    "cron/check-meta-ads",
      provider: "meta_ads",
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, ran_at: runAt, ...stats });
}
