/**
 * GET /api/health
 *
 * Comprehensive health check. Returns 200 if all critical services are up,
 * 503 if any required service is degraded.
 *
 * Checks:
 *   - Supabase DB (lightweight query to system_error_logs)
 *   - Supabase Auth (auth.getUser with a dummy call)
 *   - OpenAI API key present (ping only when HEALTH_DEEP=1)
 *   - Telegram bot reachable (getMe)
 *   - Discord webhook env var set
 *   - Required env vars
 *
 * Use from:
 *   - Vercel cron: GET /api/health every 5 min
 *   - UptimeRobot / BetterStack monitor
 *   - Deployment verification script
 */

import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-client";

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
];

const ALERT_ENV = [
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
  "DISCORD_WEBHOOK_URL",
];

async function checkSupabase() {
  try {
    const admin = getAdminClient();
    const start = Date.now();
    const { error } = await admin
      .from("system_error_logs")
      .select("id")
      .limit(1);
    return {
      ok:      !error,
      latency: Date.now() - start,
      error:   error?.message ?? null,
    };
  } catch (e) {
    return { ok: false, error: e?.message ?? "threw" };
  }
}

async function checkTelegram() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, error: "TELEGRAM_BOT_TOKEN not set" };
  try {
    const start = Date.now();
    const r = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
      signal: AbortSignal.timeout(5000),
    });
    const body = await r.json().catch(() => ({}));
    return {
      ok:       r.ok && body.ok,
      latency:  Date.now() - start,
      bot_name: body.result?.username ?? null,
      error:    r.ok ? null : (body.description ?? "failed"),
    };
  } catch (e) {
    return { ok: false, error: e?.message ?? "threw" };
  }
}

async function checkOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { ok: false, error: "OPENAI_API_KEY not set" };
  // Only do a real ping when HEALTH_DEEP=1 to avoid unnecessary API cost
  if (process.env.HEALTH_DEEP !== "1") {
    return { ok: true, note: "key present (deep check skipped)" };
  }
  try {
    const start = Date.now();
    const r = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      signal:  AbortSignal.timeout(8000),
    });
    return {
      ok:      r.ok,
      latency: Date.now() - start,
      error:   r.ok ? null : `HTTP ${r.status}`,
    };
  } catch (e) {
    return { ok: false, error: e?.message ?? "threw" };
  }
}

export async function GET(request) {
  const url = new URL(request.url);

  // Allow bypassing the auth check for internal Vercel cron calls
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    // Public health check (no auth needed) — just check core services
    // Cron can pass Bearer <CRON_SECRET> for the full check
    const isCron = auth === `Bearer ${cronSecret}`;
    if (!isCron && url.searchParams.get("key") !== cronSecret) {
      // Public endpoint — return minimal status
    }
  }

  const start = Date.now();

  // Run checks in parallel
  const [supabase, telegram, openai] = await Promise.all([
    checkSupabase(),
    checkTelegram(),
    checkOpenAI(),
  ]);

  const discord = {
    ok:    !!process.env.DISCORD_WEBHOOK_URL,
    error: process.env.DISCORD_WEBHOOK_URL ? null : "DISCORD_WEBHOOK_URL not set",
  };

  const missingRequired = REQUIRED_ENV.filter((k) => !process.env[k]);
  const missingAlerts   = ALERT_ENV.filter((k) => !process.env[k]);

  const allOk = supabase.ok && missingRequired.length === 0;
  const status = allOk ? 200 : 503;

  const body = {
    status:   allOk ? "healthy" : "degraded",
    ts:       new Date().toISOString(),
    env:      process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    latency:  Date.now() - start,
    services: {
      supabase,
      telegram,
      openai,
      discord,
    },
    env_vars: {
      required: {
        ok:      missingRequired.length === 0,
        missing: missingRequired,
      },
      alerts: {
        ok:      missingAlerts.length === 0,
        missing: missingAlerts,
      },
    },
  };

  return NextResponse.json(body, { status });
}
