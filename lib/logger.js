/**
 * lib/logger.js — Central production error logger for Intellixy.
 *
 * Outputs (in order, never throws):
 *   1. Structured JSON → stdout  (Vercel Logs / Datadog ingest)
 *   2. Telegram instant alert    (TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID)
 *   3. Discord webhook fallback  (DISCORD_WEBHOOK_URL — used when Telegram fails)
 *   4. Supabase system_error_logs (queryable history, pass adminClient in ctx)
 *
 * Critical threshold: 5+ error/critical events in 10 min → 🔥 CRITICAL alert.
 * Alert rate limit:   1 alert per unique (severity, route) per 60 s — prevents spam.
 *
 * Usage:
 *   import { logger, reqCtx } from "@/lib/logger";
 *
 *   // In a server-side route:
 *   const ctx = reqCtx(request);
 *   logger.error({ ...ctx, route: "api/upload", message: err.message, stack: err.stack, adminClient });
 *
 *   // Plain log (no alert):
 *   logger.info({ route: "api/upload", message: "started", userId });
 */

import { randomUUID } from "crypto";

// ── Config ────────────────────────────────────────────────────────────────────

const ENV  = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
const APP  = "Intellixy";

const TELEGRAM_TOKEN   = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const DISCORD_URL      = process.env.DISCORD_WEBHOOK_URL;

const CRITICAL_THRESHOLD = 5;
const CRITICAL_WINDOW_MS = 10 * 60 * 1000; // 10 min
const ALERT_COOLDOWN_MS  = 60_000;          // max 1 alert per route per 60 s

// ── In-memory state (resets on cold start — acceptable for edge/serverless) ───

const _ring      = [];   // { ts, route } — sliding window for threshold detection
const _lastAlert = new Map();  // key → last alert timestamp

// ── Helpers ───────────────────────────────────────────────────────────────────

function _trackThreshold(route) {
  const now = Date.now();
  _ring.push({ ts: now, route });
  while (_ring.length && now - _ring[0].ts > CRITICAL_WINDOW_MS) _ring.shift();
  return _ring.length;
}

function _shouldAlert(key) {
  const now  = Date.now();
  const last = _lastAlert.get(key) ?? 0;
  if (now - last < ALERT_COOLDOWN_MS) return false;
  _lastAlert.set(key, now);
  return true;
}

function _mask(email) {
  if (!email) return "—";
  const at = email.indexOf("@");
  if (at < 1) return "***";
  return email.slice(0, Math.min(2, at)) + "***@" + email.slice(at + 1);
}

function _stripHtml(s) {
  return s.replace(/<[^>]+>/g, "");
}

// ── Telegram ──────────────────────────────────────────────────────────────────

async function _telegram(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return false;
  try {
    const r = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id:                  TELEGRAM_CHAT_ID,
          text,
          parse_mode:               "HTML",
          disable_web_page_preview: true,
        }),
      }
    );
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      console.warn("[logger] Telegram rejected:", r.status, t.slice(0, 200));
    }
    return r.ok;
  } catch (e) {
    console.warn("[logger] Telegram fetch failed:", e?.message);
    return false;
  }
}

// ── Discord ───────────────────────────────────────────────────────────────────

async function _discord(content) {
  if (!DISCORD_URL) return false;
  try {
    const r = await fetch(DISCORD_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.slice(0, 2000) }),
    });
    return r.ok;
  } catch (e) {
    console.warn("[logger] Discord fetch failed:", e?.message);
    return false;
  }
}

// ── Alert message builder ─────────────────────────────────────────────────────

function _buildAlert(entry, isCritical) {
  const icons = { critical: "🚨", error: "⛔", warning: "⚠️", info: "ℹ️" };
  const icon  = isCritical ? "🔥" : (icons[entry.severity] ?? "⛔");
  const title = isCritical ? "CRITICAL ALERT" : "PRODUCTION ERROR";

  const lines = [
    `${icon} <b>${title}</b> — ${APP} [${ENV}]`,
    "",
    `<b>Route:</b>     ${entry.route ?? "—"}`,
    `<b>Error:</b>     ${(entry.message ?? "—").slice(0, 400)}`,
    `<b>Severity:</b>  ${entry.severity ?? "error"}`,
    `<b>User:</b>      ${entry.userId ?? "anonymous"}`,
    `<b>Email:</b>     ${_mask(entry.email)}`,
    `<b>IP:</b>        ${entry.ip ?? "—"}`,
    `<b>Device:</b>    ${(entry.userAgent ?? "—").slice(0, 90)}`,
    `<b>Provider:</b>  ${entry.provider ?? "—"}`,
    `<b>TraceID:</b>   <code>${entry.traceId ?? "—"}</code>`,
    `<b>Time:</b>      ${entry.ts}`,
  ];

  if (entry.stack) {
    lines.push("", "<b>Stack (top):</b>");
    lines.push(`<code>${entry.stack.slice(0, 700)}</code>`);
  }

  if (isCritical) {
    lines.push("", `⚡ <b>${_ring.length} errors in last 10 minutes</b>`);
  }

  return lines.join("\n");
}

// ── DB write ──────────────────────────────────────────────────────────────────

function _writeDb(adminClient, entry, isCritical) {
  if (!adminClient) return;
  adminClient
    .from("system_error_logs")
    .insert({
      severity:    entry.severity,
      route:       entry.route   ?? null,
      user_id:     entry.userId  ?? null,
      email:       entry.email   ?? null,
      message:     (entry.message ?? "").slice(0, 2000),
      stack:       entry.stack   ? entry.stack.slice(0, 4000) : null,
      metadata:    entry.metadata ?? null,
      is_critical: isCritical,
      trace_id:    entry.traceId ?? null,
      resolved:    false,
    })
    .then(({ error: dbErr }) => {
      if (dbErr) console.warn("[logger] DB insert failed:", dbErr.message);
    })
    .catch((e) => console.warn("[logger] DB insert threw:", e?.message));
}

// ── Core ──────────────────────────────────────────────────────────────────────

async function _log(severity, ctx) {
  const traceId = ctx.traceId ?? randomUUID().slice(0, 8);
  const ts      = new Date().toISOString();

  const entry = {
    app:       APP,
    env:       ENV,
    severity,
    traceId,
    ts,
    route:     ctx.route     ?? null,
    message:   (ctx.message  ?? ctx.error ?? "unknown").slice?.(0, 2000) ?? "unknown",
    stack:     ctx.stack     ?? null,
    userId:    ctx.userId    ?? null,
    email:     ctx.email     ?? null,
    ip:        ctx.ip        ?? null,
    userAgent: ctx.userAgent ?? null,
    provider:  ctx.provider  ?? null,
    metadata:  ctx.metadata  ?? null,
  };

  // 1. Structured stdout (Vercel Logs ingests JSON lines automatically)
  const logFn = severity === "info" ? console.log : severity === "warning" ? console.warn : console.error;
  logFn(JSON.stringify(entry));

  // 2. DB (non-blocking, best-effort)
  const isCritical = false; // determined below for error/critical
  if (severity === "info" || severity === "warning") {
    _writeDb(ctx.adminClient, entry, false);
    return traceId;
  }

  // 3. Threshold tracking (error/critical only)
  const count        = _trackThreshold(entry.route ?? "unknown");
  const isThreshold  = count >= CRITICAL_THRESHOLD;

  _writeDb(ctx.adminClient, entry, isThreshold);

  // 4. Alerts
  const alertKey    = `${severity}:${entry.route ?? "unknown"}`;
  const critKey     = "critical:threshold";

  if (isThreshold && _shouldAlert(critKey)) {
    const msg = _buildAlert(entry, true);
    const ok  = await _telegram(msg);
    if (!ok) await _discord(_stripHtml(msg));
  } else if (_shouldAlert(alertKey)) {
    const msg = _buildAlert(entry, false);
    const ok  = await _telegram(msg);
    if (!ok) await _discord(_stripHtml(msg));
  }

  return traceId;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * @typedef {object} LogCtx
 * @property {string}  [route]       - API route or page, e.g. "api/upload"
 * @property {string}  [message]     - Human-readable error description
 * @property {string}  [error]       - Alias for message
 * @property {string}  [stack]       - Stack trace string
 * @property {string}  [userId]      - Supabase user UUID
 * @property {string}  [email]       - User email (masked in alerts)
 * @property {string}  [ip]          - Client IP
 * @property {string}  [userAgent]   - User-Agent header
 * @property {string}  [provider]    - OAuth/payment provider
 * @property {string}  [traceId]     - Request trace ID (auto-generated if omitted)
 * @property {object}  [metadata]    - Any extra key/value pairs (stored as JSONB)
 * @property {import("@supabase/supabase-js").SupabaseClient} [adminClient]
 */

export const logger = {
  /** Info — stdout only, no alert. */
  info:     (/** @type {LogCtx} */ ctx) => _log("info",     ctx),
  /** Warning — stdout + DB, no alert. */
  warning:  (/** @type {LogCtx} */ ctx) => _log("warning",  ctx),
  /** Error — stdout + DB + Telegram/Discord alert. */
  error:    (/** @type {LogCtx} */ ctx) => _log("error",    ctx),
  /** Critical — stdout + DB + Telegram/Discord alert (🚨). */
  critical: (/** @type {LogCtx} */ ctx) => _log("critical", ctx),
};

/**
 * Extract standard request context from a Next.js Request object.
 * Spread the result into any logger call:
 *   logger.error({ ...reqCtx(request), route: "api/foo", message: "..." })
 *
 * @param {Request} request
 * @returns {{ ip: string|null, userAgent: string|null, traceId: string }}
 */
export function reqCtx(request) {
  const vercelId = request.headers.get("x-vercel-id");
  return {
    ip:        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
                 ?? request.headers.get("x-real-ip")
                 ?? null,
    userAgent: request.headers.get("user-agent") ?? null,
    traceId:   vercelId ? vercelId.slice(0, 16) : randomUUID().slice(0, 8),
  };
}
