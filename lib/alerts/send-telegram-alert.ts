/**
 * lib/alerts/send-telegram-alert.ts
 *
 * Sends a formatted HTML alert to a Telegram chat/channel.
 *
 * Design decisions:
 *   - Never throws — all failures are swallowed and warn-logged.
 *   - One retry after 800ms on transient failure.
 *   - 5-second timeout per attempt (AbortController + setTimeout for Node 16 compat).
 *   - Secrets are never embedded in messages (redaction is in log-system-error.ts).
 *   - Telegram's hard message limit is 4096 chars — content is sliced before sending.
 */

const TIMEOUT_MS  = 5_000;
const RETRY_DELAY = 800;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TelegramAlertPayload {
  route?:          string;
  message:         string;
  severity:        "info" | "warning" | "error" | "critical";
  userId?:         string;
  email?:          string;
  ip?:             string;
  userAgent?:      string;
  provider?:       string;
  traceId?:        string;
  stack?:          string;
  isCritical?:     boolean;
  errorCount?:     number;
  affectedRoutes?: string[];
  ts?:             string;
  env?:            string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function maskEmail(email?: string): string {
  if (!email) return "—";
  const at = email.indexOf("@");
  if (at < 1) return "***";
  return email.slice(0, Math.min(2, at)) + "***@" + email.slice(at + 1);
}

function buildHtml(p: TelegramAlertPayload): string {
  const icons: Record<string, string> = {
    critical: "🚨",
    error:    "⛔",
    warning:  "⚠️",
    info:     "ℹ️",
  };
  const icon  = p.isCritical ? "🔥" : (icons[p.severity] ?? "⛔");
  const title = p.isCritical ? "CRITICAL ALERT" : "PRODUCTION ERROR";
  const env   = p.env ?? (process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown");

  const lines: string[] = [
    `${icon} <b>${title}</b> — Intellixy [${env}]`,
    "",
    `<b>Route:</b>     ${p.route    ?? "—"}`,
    `<b>Error:</b>     ${p.message.slice(0, 400)}`,
    `<b>Severity:</b>  ${p.severity}`,
    `<b>User:</b>      ${p.userId   ?? "anonymous"}`,
    `<b>Email:</b>     ${maskEmail(p.email)}`,
    `<b>IP:</b>        ${p.ip       ?? "—"}`,
    `<b>Device:</b>    ${(p.userAgent ?? "—").slice(0, 80)}`,
    `<b>Provider:</b>  ${p.provider ?? "—"}`,
    `<b>TraceID:</b>   <code>${p.traceId ?? "—"}</code>`,
    `<b>Time:</b>      ${p.ts ?? new Date().toISOString()}`,
  ];

  if (p.stack) {
    lines.push("", "<b>Stack:</b>");
    lines.push(`<code>${p.stack.slice(0, 600)}</code>`);
  }

  if (p.isCritical && p.errorCount) {
    lines.push("");
    lines.push(`⚡ <b>${p.errorCount} errors in the last 10 minutes</b>`);
    if (p.affectedRoutes?.length) {
      lines.push(`<b>Routes:</b> ${p.affectedRoutes.slice(0, 5).join(", ")}`);
    }
  }

  return lines.join("\n");
}

// ── Send (single attempt) ─────────────────────────────────────────────────────

async function attemptSend(
  token:  string,
  chatId: string,
  text:   string
): Promise<boolean> {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id:                  chatId,
        text:                     text.slice(0, 4_096),
        parse_mode:               "HTML",
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!r.ok) {
      const body = await r.text().catch(() => "");
      console.warn(`[telegram] HTTP ${r.status}: ${body.slice(0, 200)}`);
    }

    return r.ok;
  } catch (err: unknown) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("abort")) {
      console.warn("[telegram] Request failed:", msg);
    }
    return false;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send a Telegram alert.
 * Returns true if delivered, false on all failures.
 * Never throws.
 */
export async function sendTelegramAlert(
  payload: TelegramAlertPayload
): Promise<boolean> {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set — skipped");
    return false;
  }

  const text = buildHtml(payload);

  // First attempt
  if (await attemptSend(token, chatId, text)) return true;

  // One retry
  await new Promise<void>((r) => setTimeout(r, RETRY_DELAY));
  return attemptSend(token, chatId, text);
}
