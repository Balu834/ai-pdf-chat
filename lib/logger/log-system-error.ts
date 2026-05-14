/**
 * lib/logger/log-system-error.ts
 *
 * Central production error logger for Intellixy.
 *
 * Pipeline (in order, never throws):
 *   1. Structured JSON → stdout  (Vercel Logs ingest)
 *   2. Telegram + Discord alerts fired simultaneously (Promise.allSettled)
 *   3. Supabase production_error_logs (queryable history)
 *   4. production_error_rate_limits RPC update (non-blocking)
 *
 * Rate limiting:  1 alert per unique (severity:route) per 60 s
 * Dedup:          Same message hash suppressed for 30 s
 * Threshold:      5+ events in 10 min → 🔥 CRITICAL escalation
 * Redaction:      Bearer tokens, JWTs, API keys, passwords, Telegram tokens stripped
 */

import { randomUUID } from "crypto";
import { sendTelegramAlert } from "@/lib/alerts/send-telegram-alert";
import { sendDiscordAlert }  from "@/lib/alerts/send-discord-alert";
import type { SupabaseClient } from "@supabase/supabase-js";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Severity = "info" | "warning" | "error" | "critical";

export interface ErrorLogContext {
  route?:       string;
  message?:     string;
  error?:       string;           // alias for message
  stack?:       string;
  userId?:      string;
  email?:       string;
  ip?:          string | null;
  userAgent?:   string | null;
  provider?:    string;
  traceId?:     string;
  metadata?:    Record<string, unknown> | null;
  adminClient?: SupabaseClient;
}

interface NormalizedEntry {
  app:       string;
  env:       string;
  severity:  Severity;
  traceId:   string;
  ts:        string;
  route:     string | null;
  message:   string;
  stack:     string | null;
  userId:    string | null;
  email:     string | null;
  ip:        string | null;
  userAgent: string | null;
  provider:  string | null;
  metadata:  Record<string, unknown> | null;
}

// ── Config ────────────────────────────────────────────────────────────────────

const ENV = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
const APP = "Intellixy";

const CRITICAL_THRESHOLD = 5;
const CRITICAL_WINDOW_MS = 10 * 60 * 1_000; // 10 min
const ALERT_COOLDOWN_MS  = 60_000;           // 1 alert per route per 60 s
const DEDUP_WINDOW_MS    = 30_000;           // identical message suppression

// ── In-memory state ───────────────────────────────────────────────────────────

interface RingEntry { ts: number; route: string; }

const _ring:       RingEntry[] = [];
const _alertTimes  = new Map<string, number>();
const _dedupTimes  = new Map<string, number>();
let   _alertInFlight = false; // prevents recursive alert loops

// ── Secret redaction ─────────────────────────────────────────────────────────

type RedactPair = [RegExp, string];

const REDACT_PAIRS: RedactPair[] = [
  [/Bearer\s+[A-Za-z0-9\-._~+/]+=*/g,                          "Bearer [REDACTED]"],
  [/eyJ[A-Za-z0-9\-_]+\.eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_.+/=]*/g, "[JWT_REDACTED]"],
  [/(sk_live|sk_test|rk_live|rk_test)_[A-Za-z0-9]+/g,          "[KEY_REDACTED]"],
  [/(password|passwd|secret|token)["']?\s*[:=]\s*["']?[^\s"',}{]+/gi, "$1=[REDACTED]"],
  [/\bsb-[a-zA-Z0-9]{24,}\b/g,                                 "[SB_KEY_REDACTED]"],
  // Telegram bot token shape: <digits>:<alphanumeric 35 chars>
  [/\b\d{8,12}:[A-Za-z0-9\-_]{35}\b/g,                        "[TG_TOKEN_REDACTED]"],
];

function redact(str: string | null | undefined): string {
  if (!str || typeof str !== "string") return str ?? "";
  let out = str;
  for (const [pattern, replacement] of REDACT_PAIRS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

function redactObj(
  obj: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!obj) return null;
  try {
    return JSON.parse(redact(JSON.stringify(obj))) as Record<string, unknown>;
  } catch {
    return obj;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function trackThreshold(route: string): number {
  const now = Date.now();
  _ring.push({ ts: now, route });
  while (_ring.length && now - _ring[0].ts > CRITICAL_WINDOW_MS) _ring.shift();
  return _ring.length;
}

function shouldAlert(key: string): boolean {
  const now  = Date.now();
  const last = _alertTimes.get(key) ?? 0;
  if (now - last < ALERT_COOLDOWN_MS) return false;
  _alertTimes.set(key, now);
  return true;
}

function isDuplicate(message: string): boolean {
  const hash = message.slice(0, 120).replace(/\s+/g, " ").trim();
  const now  = Date.now();
  const last = _dedupTimes.get(hash) ?? 0;
  if (now - last < DEDUP_WINDOW_MS) return true;
  _dedupTimes.set(hash, now);
  if (_dedupTimes.size > 500) {
    const cutoff = now - DEDUP_WINDOW_MS;
    for (const [k, v] of _dedupTimes) if (v < cutoff) _dedupTimes.delete(k);
  }
  return false;
}

function affectedRoutes(): string[] {
  return [...new Set(_ring.slice(-20).map((r) => r.route))];
}

// ── DB writes (non-blocking) ──────────────────────────────────────────────────

function writeToDb(
  adminClient: SupabaseClient | undefined,
  entry: NormalizedEntry,
  isEscalated: boolean
): void {
  if (!adminClient) return;

  adminClient
    .from("production_error_logs")
    .insert({
      severity:    entry.severity,
      trace_id:    entry.traceId,
      environment: entry.env,
      route:       entry.route,
      message:     entry.message.slice(0, 2_000),
      stack:       entry.stack ? redact(entry.stack).slice(0, 4_000) : null,
      user_id:     entry.userId    ?? null,
      email:       entry.email     ?? null,
      ip:          entry.ip        ?? null,
      user_agent:  entry.userAgent ?? null,
      provider:    entry.provider  ?? null,
      metadata:    entry.metadata  ?? null,
      is_escalated: isEscalated,
      resolved:    false,
    })
    .then(({ error: dbErr }) => {
      if (dbErr) console.warn("[logger] DB insert failed:", dbErr.message);
    }, (e: unknown) => {
      if (e instanceof Error) console.warn("[logger] DB insert threw:", e.message);
    });
}

function updateRateLimit(
  adminClient: SupabaseClient | undefined,
  entry: NormalizedEntry,
  isEscalated: boolean
): void {
  if (!adminClient) return;

  const errorKey = (
    (entry.route ?? "") + ":" + entry.message.slice(0, 80)
  ).toLowerCase().trim();

  adminClient
    .rpc("increment_error_rate_limit", {
      p_error_key:    errorKey,
      p_route:        entry.route,
      p_is_escalated: isEscalated,
    })
    .then(({ error: rpcErr }) => {
      if (rpcErr) console.warn("[logger] rate-limit RPC failed:", rpcErr.message);
    }, (e: unknown) => {
      if (e instanceof Error) console.warn("[logger] rate-limit RPC threw:", e.message);
    });
}

// ── Core ──────────────────────────────────────────────────────────────────────

export async function logSystemError(
  ctx: ErrorLogContext,
  severity: Severity
): Promise<string> {
  const traceId = ctx.traceId ?? randomUUID().slice(0, 8);
  const ts      = new Date().toISOString();
  const rawMsg  = ctx.message ?? ctx.error ?? "unknown error";
  const message = redact(
    typeof rawMsg === "string" ? rawMsg : String(rawMsg)
  ).slice(0, 2_000);

  const entry: NormalizedEntry = {
    app:       APP,
    env:       ENV,
    severity,
    traceId,
    ts,
    route:     ctx.route     ?? null,
    message,
    stack:     ctx.stack     ? redact(ctx.stack).slice(0, 4_000) : null,
    userId:    ctx.userId    ?? null,
    email:     ctx.email     ?? null,
    ip:        ctx.ip        ?? null,
    userAgent: ctx.userAgent ?? null,
    provider:  ctx.provider  ?? null,
    metadata:  redactObj(ctx.metadata),
  };

  // 1. Structured stdout (Vercel ingests JSON lines)
  const logFn = severity === "info"    ? console.log
              : severity === "warning" ? console.warn
              : console.error;
  logFn(JSON.stringify(entry));

  // info/warning: DB write only, no alert
  if (severity === "info" || severity === "warning") {
    writeToDb(ctx.adminClient, entry, false);
    return traceId;
  }

  // 2. Threshold tracking
  const count      = trackThreshold(entry.route ?? "unknown");
  const isCritical = count >= CRITICAL_THRESHOLD;

  // 3. DB writes (non-blocking)
  writeToDb(ctx.adminClient, entry, isCritical);
  updateRateLimit(ctx.adminClient, entry, isCritical);

  // 4. Dedup check
  if (isDuplicate(message)) {
    console.warn("[logger] Suppressed duplicate:", message.slice(0, 80));
    return traceId;
  }

  // 5. Alerts (guard against recursive alert loops)
  if (_alertInFlight) return traceId;
  _alertInFlight = true;

  try {
    const alertKey   = `${severity}:${entry.route ?? "unknown"}`;
    const critKey    = "critical:threshold";
    const routes     = affectedRoutes();
    const errorCount = _ring.length;

    // Alert payload — null fields must become undefined for the alert type contracts
    const alertBase = {
      severity:  entry.severity,
      message:   entry.message,
      route:     entry.route     ?? undefined,
      stack:     entry.stack     ?? undefined,
      userId:    entry.userId    ?? undefined,
      email:     entry.email     ?? undefined,
      ip:        entry.ip        ?? undefined,
      userAgent: entry.userAgent ?? undefined,
      provider:  entry.provider  ?? undefined,
      traceId:   entry.traceId,
      ts:        entry.ts,
      env:       entry.env,
    };

    if (isCritical && shouldAlert(critKey)) {
      // Fire Telegram + Discord simultaneously — both get the critical alert
      await Promise.allSettled([
        sendTelegramAlert({
          ...alertBase,
          isCritical:     true,
          errorCount,
          affectedRoutes: routes,
        }),
        sendDiscordAlert({
          ...alertBase,
          isCritical:     true,
          errorCount,
          affectedRoutes: routes,
        }),
      ]);
    } else if (shouldAlert(alertKey)) {
      // Fire both in parallel for every error/critical alert
      await Promise.allSettled([
        sendTelegramAlert(alertBase),
        sendDiscordAlert(alertBase),
      ]);
    }
  } finally {
    _alertInFlight = false;
  }

  return traceId;
}

// ── Backward-compat logger object ─────────────────────────────────────────────

export const logger = {
  info:     (ctx: ErrorLogContext) => logSystemError(ctx, "info"),
  warning:  (ctx: ErrorLogContext) => logSystemError(ctx, "warning"),
  error:    (ctx: ErrorLogContext) => logSystemError(ctx, "error"),
  critical: (ctx: ErrorLogContext) => logSystemError(ctx, "critical"),
};

// ── reqCtx ────────────────────────────────────────────────────────────────────

export interface RequestContext {
  ip:        string | null;
  userAgent: string | null;
  traceId:   string;
}

export function reqCtx(request: Request): RequestContext {
  const vercelId = request.headers.get("x-vercel-id");
  return {
    ip:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      null,
    userAgent: request.headers.get("user-agent") ?? null,
    traceId:   vercelId ? vercelId.slice(0, 16) : randomUUID().slice(0, 8),
  };
}
