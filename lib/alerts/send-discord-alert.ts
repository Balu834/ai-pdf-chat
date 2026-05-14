/**
 * lib/alerts/send-discord-alert.ts
 *
 * Sends a rich embed alert to a Discord webhook.
 *
 * Design:
 *   - Never throws — all failures are swallowed and warn-logged.
 *   - One retry after 1000ms on transient failure (mirrors Telegram parity).
 *   - 5-second timeout per attempt (AbortController for Node 16 compat).
 *   - Skips silently if DISCORD_WEBHOOK_URL is unset or still a placeholder.
 *   - Secrets are never embedded in messages.
 */

const TIMEOUT_MS  = 5_000;
const RETRY_DELAY = 1_000;

// ── Severity colors (Discord decimal integers) ────────────────────────────────

const COLORS: Record<string, number> = {
  info:     0x3498DB, // blue
  warning:  0xFFD700, // yellow
  error:    0xFF0000, // red
  critical: 0x8B0000, // dark red
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DiscordAlertPayload {
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

interface EmbedField {
  name:    string;
  value:   string;
  inline?: boolean;
}

function buildEmbed(p: DiscordAlertPayload): Record<string, unknown> {
  const icon  = p.isCritical ? "🔥" : p.severity === "critical" ? "🚨" : p.severity === "error" ? "⛔" : p.severity === "warning" ? "⚠️" : "ℹ️";
  const title = `${icon} ${p.isCritical ? "CRITICAL ALERT" : "Production Alert"} — Intellixy`;
  const env   = p.env ?? (process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown");
  const color = p.isCritical ? COLORS.critical : (COLORS[p.severity] ?? COLORS.error);
  const ts    = p.ts ?? new Date().toISOString();

  const fields: EmbedField[] = [
    { name: "Environment", value: `\`${env}\``,              inline: true },
    { name: "Severity",    value: `\`${p.severity}\``,       inline: true },
    { name: "Route",       value: p.route    ?? "—",          inline: true },
    { name: "Error",       value: p.message.slice(0, 1_024) },
    { name: "User",        value: p.userId   ?? "anonymous",  inline: true },
    { name: "Email",       value: maskEmail(p.email),         inline: true },
    { name: "IP",          value: p.ip       ?? "—",          inline: true },
    { name: "Provider",    value: p.provider ?? "—",          inline: true },
    { name: "TraceID",     value: `\`${p.traceId ?? "—"}\``, inline: true },
  ];

  if (p.userAgent) {
    fields.push({ name: "Device", value: p.userAgent.slice(0, 80), inline: false });
  }

  if (p.stack) {
    fields.push({
      name:  "Stack Trace",
      value: `\`\`\`${p.stack.slice(0, 900)}\`\`\``,
    });
  }

  if (p.isCritical && p.errorCount) {
    const escalationLines = [`**${p.errorCount} errors in the last 10 minutes**`];
    if (p.affectedRoutes?.length) {
      escalationLines.push(`Routes: ${p.affectedRoutes.slice(0, 5).join(", ")}`);
    }
    fields.push({
      name:  "⚡ Escalation",
      value: escalationLines.join("\n"),
    });
  }

  return {
    title,
    color,
    fields,
    timestamp: ts,
    footer: {
      text: `Intellixy Monitoring • ${env}`,
    },
  };
}

// ── Send (single attempt) ─────────────────────────────────────────────────────

async function attemptSend(url: string, embed: Record<string, unknown>): Promise<boolean> {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const r = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ embeds: [embed] }),
      signal:  controller.signal,
    });

    clearTimeout(timer);

    if (!r.ok) {
      const body = await r.text().catch(() => "");
      console.warn(`[discord] HTTP ${r.status}: ${body.slice(0, 200)}`);
    }

    return r.ok;
  } catch (err: unknown) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("abort")) {
      console.warn("[discord] Request failed:", msg);
    }
    return false;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send a Discord embed alert.
 * Returns true if delivered, false on all failures.
 * Never throws.
 */
export async function sendDiscordAlert(
  payload: DiscordAlertPayload
): Promise<boolean> {
  const url = process.env.DISCORD_WEBHOOK_URL;

  if (
    !url ||
    url === "ADD_MY_WEBHOOK_URL" ||
    !url.startsWith("https://discord.com/api/webhooks/")
  ) {
    console.warn("[discord] DISCORD_WEBHOOK_URL not configured — alert skipped");
    return false;
  }

  const embed = buildEmbed(payload);

  // First attempt
  if (await attemptSend(url, embed)) return true;

  // One retry after delay
  await new Promise<void>((r) => setTimeout(r, RETRY_DELAY));
  return attemptSend(url, embed);
}
