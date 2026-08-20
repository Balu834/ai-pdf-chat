/**
 * GET /api/health
 *
 * Tiered health check:
 *   - Public  (no auth): { status, ts } — 200 or 503, nothing sensitive
 *   - Private (Bearer CRON_SECRET): full service status, env-var audit, latencies
 *
 * Checks (private only):
 *   - Supabase DB connection + latency
 *   - Telegram bot reachability
 *   - Discord webhook env var
 *   - OpenAI key present (API ping only when HEALTH_DEEP=1)
 *   - Required env vars
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
    // Connectivity is measured against a core table. The monitoring schema is
    // reported separately so a missing migration stays visible without
    // making a healthy database look unreachable.
    const { error } = await admin
      .from("profiles")
      .select("id")
      .limit(1);
    const { error: monitoringError } = await admin
      .from("production_error_logs")
      .select("id")
      .limit(1);
    return {
      ok:      !error,
      latency: Date.now() - start,
      error:   error?.message ?? null,
      monitoring_schema: {
        ok:    !monitoringError,
        error: monitoringError?.message ?? null,
      },
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
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5_000);
    const r = await fetch(
      `https://api.telegram.org/bot${token}/getMe`,
      { signal: ctrl.signal }
    );
    clearTimeout(timer);
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
  if (process.env.HEALTH_DEEP !== "1") {
    return { ok: true, note: "key present (deep check skipped)" };
  }
  try {
    const start = Date.now();
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8_000);
    const r = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      signal:  ctrl.signal,
    });
    clearTimeout(timer);
    return {
      ok:      r.ok,
      latency: Date.now() - start,
      error:   r.ok ? null : `HTTP ${r.status}`,
    };
  } catch (e) {
    return { ok: false, error: e?.message ?? "threw" };
  }
}

function isAuthed(request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  // Header only — a ?key= query param leaks the secret into access logs,
  // browser history and outbound Referer headers.
  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export async function GET(request) {
  const start = Date.now();

  // ── Public response — safe minimal status ────────────────────────────────
  if (!isAuthed(request)) {
    // Lightweight DB connectivity ping — don't reveal service details.
    // Uses a core table so a missing optional schema (e.g. the monitoring
    // tables) can't make a healthy app report itself as down.
    let dbOk = false;
    try {
      const { error } = await getAdminClient()
        .from("profiles")
        .select("id")
        .limit(1);
      dbOk = !error;
    } catch { /* */ }

    const ok = dbOk;
    return NextResponse.json(
      { status: ok ? "ok" : "degraded", ts: new Date().toISOString() },
      { status: ok ? 200 : 503 }
    );
  }

  // ── Private (authenticated) — full diagnostics ───────────────────────────
  const [supabase, telegram, openai] = await Promise.all([
    checkSupabase(),
    checkTelegram(),
    checkOpenAI(),
  ]);

  const discord = {
    ok:    !!(process.env.DISCORD_WEBHOOK_URL &&
              process.env.DISCORD_WEBHOOK_URL !== "ADD_MY_WEBHOOK_URL"),
    error: process.env.DISCORD_WEBHOOK_URL ? null : "DISCORD_WEBHOOK_URL not set",
  };

  const missingRequired = REQUIRED_ENV.filter((k) => !process.env[k]);
  const missingAlerts   = ALERT_ENV.filter((k) => !process.env[k]);

  const allOk  = supabase.ok && missingRequired.length === 0;

  return NextResponse.json(
    {
      status:   allOk ? "healthy" : "degraded",
      ts:       new Date().toISOString(),
      env:      process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      latency:  Date.now() - start,
      services: { supabase, telegram, openai, discord },
      env_vars: {
        required: { ok: missingRequired.length === 0, missing: missingRequired },
        alerts:   { ok: missingAlerts.length   === 0, missing: missingAlerts   },
      },
    },
    { status: allOk ? 200 : 503 }
  );
}
