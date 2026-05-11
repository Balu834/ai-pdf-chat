/**
 * lib/logger.js — Central production error logger for Intellixy.
 *
 * Outputs (in order, never throws):
 *   1. Structured JSON → stdout  (Vercel Logs / Datadog ingest)
 *   2. Telegram instant alert    (TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID)
 *   3. Discord embed fallback    (DISCORD_WEBHOOK_URL — used when Telegram fails)
 *   4. Supabase system_error_logs (queryable history — pass adminClient in ctx)
 *
 * Critical threshold: 5+ error/critical events in 10 min → 🔥 CRITICAL alert.
 * Alert rate limit:   1 alert per unique (severity:route) per 60 s.
 * Dedup:              Identical messages within 30 s are suppressed (no DB spam).
 * Secret redaction:   Bearer tokens, JWTs, API keys stripped before logging.
 *
 * Usage:
 *   import { logger, reqCtx } from "@/lib/logger";
 *
 *   const ctx = reqCtx(request);  // extracts IP, UA, traceId
 *   logger.error({ ...ctx, route: "api/upload", message: err.message, stack: err.stack, adminClient });
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
const ALERT_COOLDOWN_MS  = 60_000;          // 1 alert per route per 60 s
const DEDUP_WINDOW_MS    = 30_000;          // identical message suppression window

// ── In-memory state (resets on cold start — acceptable for serverless) ────────

const _ring      = [];          // sliding window for threshold detection
const _lastAlert = new Map();   // `severity:route` → last alert ts
const _dedup     = new Map();   // `message_hash` → last seen ts

// ── Secret redaction ─────────────────────────────────────────────────────────

const REDACT_PATTERNS = [
  [/Bearer\s+[A-Za-z0-9\-._~+/]+=*/g,                    "Bearer [REDACTED]"],
  [/eyJ[A-Za-z0-9\-_]+\.eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_.+/=]*/g, "[JWT_REDACTED]"],
  [/(sk_live|sk_test|rk_live|rk_test)_[A-Za-z0-9]+/g,    "[KEY_REDACTED]"],
  [/(password|passwd|secret|token)["']?\s*[:=]\s*["']?[^\s"',}{]+/gi, "$1=[REDACTED]"],
  [/\bsb-[a-zA-Z0-9]{24,}\b/g,                            "[SB_KEY_REDACTED]"],
];

function _redact(str) {
  if (!str || typeof str !== "string") return str;
  let out = str;
  for (const [pattern, replacement] of REDACT_PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

function _redactObj(obj) {
  if (!obj) return obj;
  try {
    return JSON.parse(_redact(JSON.stringify(obj)));
  } catch {
    return obj;
  }
}

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

function _isDuplicate(message) {
  // Hash by first 120 chars of the message (cheap, no crypto dependency)
  const hash = (message ?? "").slice(0, 120).replace(/\s+/g, " ").trim();
  const now  = Date.now();
  const last = _dedup.get(hash) ?? 0;
  if (now - last < DEDUP_WINDOW_MS) return true;
  _dedup.set(hash, now);
  // Evict old entries to prevent unbounded growth
  if (_dedup.size > 500) {
    const cutoff = now - DEDUP_WINDOW_MS;
    for (const [k, v] of _dedup) if (v < cutoff) _dedup.delete(k);
  }
  return false;
}

function _mask(email) {
  if (!email) return "—";
  const at = email.indexOf("@");
  if (at < 1) return "***";
  return email.slice(0, Math.min(2, at)) + "***@" + email.slice(at + 1);
}

function _stripHtml(s) {
  return (s ?? "").replace(/<[^>]+>/g, "");
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
          text:                     text.slice(0, 4096),
          parse_mode:               "HTML",
          disable_web_page_preview: true,
        }),
      }
    );
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      console.warn("[logger] Telegram error:", r.status, t.slice(0, 200));
    }
    return r.ok;
  } catch (e) {
    console.warn("[logger] Telegram failed:", e?.message);
    return false;
  }
}

// ── Discord (embeds) ──────────────────────────────────────────────────────────

function _discordColor(severity, isCritical) {
  if (isCritical)            return 0xFF4500; // orange-red
  if (severity === "critical") return 0xFF0000; // red
  if (severity === "error")    return 0xFF4500; // orange-red
  return 0xFFA500;                              // orange (warning)
}

async function _discord(entry, isCritical) {
  if (!DISCORD_URL) return false;
  try {
    const icon  = isCritical ? "🔥" : entry.severity === "critical" ? "🚨" : "⛔";
    const title = `${icon} ${isCritical ? "CRITICAL ALERT" : "Production Error"} — ${APP} [${ENV}]`;

    const fields = [
      { name: "Route",    value: entry.route    ?? "—", inline: true },
      { name: "Severity", value: entry.severity ?? "—", inline: true },
      { name: "Error",    value: (entry.message ?? "—").slice(0, 1024) },
      { name: "User",     value: entry.userId   ?? "anonymous",  inline: true },
      { name: "Email",    value: _mask(entry.email),             inline: true },
      { name: "IP",       value: entry.ip       ?? "—",          inline: true },
      { name: "TraceID",  value: entry.traceId  ?? "—",          inline: true },
      { name: "Time",     value: entry.ts,                       inline: true },
    ];

    if (entry.stack) {
      fields.push({ name: "Stack", value: `\`\`\`${entry.stack.slice(0, 900)}\`\`\`` });
    }

    if (isCritical) {
      fields.push({ name: "⚡ Threshold", value: `${_ring.length} errors in last 10 minutes`, inline: false });
    }

    const r = await fetch(DISCORD_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title,
          color:  _discordColor(entry.severity, isCritical),
          fields,
          footer: { text: `${APP} Monitoring • ${ENV}` },
          timestamp: entry.ts,
        }],
      }),
    });
    return r.ok;
  } catch (e) {
    console.warn("[logger] Discord failed:", e?.message);
    return false;
  }
}

// ── Telegram message builder ──────────────────────────────────────────────────

function _buildTelegramMessage(entry, isCritical) {
  const icons = { critical: "🚨", error: "⛔", warning: "⚠️", info: "ℹ️" };
  const icon  = isCritical ? "🔥" : (icons[entry.severity] ?? "⛔");
  const title = isCritical ? "CRITICAL ALERT" : "PRODUCTION ERROR";

  const lines = [
    `${icon} <b>${title}</b> — ${APP} [${ENV}]`,
    "",
    `<b>Route:</b>     ${entry.route    ?? "—"}`,
    `<b>Error:</b>     ${(entry.message ?? "—").slice(0, 400)}`,
    `<b>Severity:</b>  ${entry.severity ?? "error"}`,
    `<b>User:</b>      ${entry.userId   ?? "anonymous"}`,
    `<b>Email:</b>     ${_mask(entry.email)}`,
    `<b>IP:</b>        ${entry.ip       ?? "—"}`,
    `<b>Device:</b>    ${(entry.userAgent ?? "—").slice(0, 80)}`,
    `<b>Provider:</b>  ${entry.provider ?? "—"}`,
    `<b>TraceID:</b>   <code>${entry.traceId ?? "—"}</code>`,
    `<b>Time:</b>      ${entry.ts}`,
  ];

  if (entry.stack) {
    lines.push("", "<b>Stack (top):</b>");
    lines.push(`<code>${_redact(entry.stack).slice(0, 700)}</code>`);
  }

  if (isCritical) {
    lines.push("", `⚡ <b>${_ring.length} errors in last 10 minutes</b>`);
    const routes = [...new Set(_ring.slice(-20).map((r) => r.route))];
    lines.push(`<b>Affected routes:</b> ${routes.join(", ")}`);
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
      route:       entry.route    ?? null,
      user_id:     entry.userId   ?? null,
      email:       entry.email    ?? null,
      message:     (entry.message ?? "").slice(0, 2000),
      stack:       entry.stack    ? _redact(entry.stack).slice(0, 4000) : null,
      metadata:    _redactObj(entry.metadata) ?? null,
      is_critical: isCritical,
      trace_id:    entry.traceId  ?? null,
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
  const rawMsg  = ctx.message ?? ctx.error ?? "unknown error";
  const message = _redact(typeof rawMsg === "string" ? rawMsg : String(rawMsg)).slice(0, 2000);

  const entry = {
    app:       APP,
    env:       ENV,
    severity,
    traceId,
    ts,
    route:     ctx.route     ?? null,
    message,
    stack:     ctx.stack     ? _redact(ctx.stack.slice(0, 4000)) : null,
    userId:    ctx.userId    ?? null,
    email:     ctx.email     ?? null,
    ip:        ctx.ip        ?? null,
    userAgent: ctx.userAgent ?? null,
    provider:  ctx.provider  ?? null,
    metadata:  _redactObj(ctx.metadata) ?? null,
  };

  // 1. Structured stdout (Vercel ingests JSON lines automatically)
  const logFn = severity === "info" ? console.log : severity === "warning" ? console.warn : console.error;
  logFn(JSON.stringify(entry));

  // info / warning: DB write only, no alert
  if (severity === "info" || severity === "warning") {
    _writeDb(ctx.adminClient, entry, false);
    return traceId;
  }

  // 2. Threshold tracking (error/critical only)
  const count       = _trackThreshold(entry.route ?? "unknown");
  const isCritical  = count >= CRITICAL_THRESHOLD;

  // 3. DB write (non-blocking)
  _writeDb(ctx.adminClient, entry, isCritical);

  // 4. Dedup check — suppress identical messages within 30 s
  if (_isDuplicate(message)) {
    console.warn("[logger] Suppressed duplicate alert:", message.slice(0, 80));
    return traceId;
  }

  // 5. Alerts (rate-limited per route)
  const alertKey = `${severity}:${entry.route ?? "unknown"}`;
  const critKey  = "critical:threshold";

  if (isCritical && _shouldAlert(critKey)) {
    const msg = _buildTelegramMessage(entry, true);
    const ok  = await _telegram(msg);
    if (!ok) await _discord(entry, true);
  } else if (_shouldAlert(alertKey)) {
    const msg = _buildTelegramMessage(entry, false);
    const ok  = await _telegram(msg);
    if (!ok) await _discord(entry, false);
  }

  return traceId;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * @typedef {object} LogCtx
 * @property {string}  [route]       - e.g. "api/upload"
 * @property {string}  [message]     - Human-readable description
 * @property {string}  [error]       - Alias for message
 * @property {string}  [stack]       - Stack trace (auto-redacted)
 * @property {string}  [userId]      - Supabase user UUID
 * @property {string}  [email]       - User email (masked in alerts)
 * @property {string}  [ip]          - Client IP
 * @property {string}  [userAgent]
 * @property {string}  [provider]    - OAuth/payment provider name
 * @property {string}  [traceId]     - Auto-generated if omitted
 * @property {object}  [metadata]    - Extra JSONB data (auto-redacted)
 * @property {import("@supabase/supabase-js").SupabaseClient} [adminClient]
 */

export const logger = {
  /** Stdout only — no alert, minimal DB write. */
  info:     (/** @type {LogCtx} */ ctx) => _log("info",     ctx),
  /** Stdout + DB — no alert. */
  warning:  (/** @type {LogCtx} */ ctx) => _log("warning",  ctx),
  /** Stdout + DB + Telegram/Discord alert. */
  error:    (/** @type {LogCtx} */ ctx) => _log("error",    ctx),
  /** Stdout + DB + 🚨 Telegram/Discord alert. */
  critical: (/** @type {LogCtx} */ ctx) => _log("critical", ctx),
};

/**
 * Extract IP, User-Agent, and trace ID from a Next.js Request.
 * Spread the result into any logger call:
 *   logger.error({ ...reqCtx(request), route: "api/foo", message: "..." })
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
