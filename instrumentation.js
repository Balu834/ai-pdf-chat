/**
 * instrumentation.js — Next.js server startup verification.
 *
 * Runs once when the server (or each Vercel Function worker) starts.
 * Verifies required env vars and logs the result.
 * Does NOT block startup — missing vars are warned, not thrown.
 *
 * Next.js 14+: must be in the project root, not inside /app.
 * Enable via: experimental.instrumentationHook = true in next.config.js
 */

export async function register() {
  // Only run on the Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === "edge") return;

  const REQUIRED = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "OPENAI_API_KEY",
    "NEXT_PUBLIC_APP_URL",
  ];

  const RECOMMENDED = [
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_CHAT_ID",
    "DISCORD_WEBHOOK_URL",
    "CRON_SECRET",
    "OAUTH_STATE_SECRET",
  ];

  const missing     = REQUIRED.filter((k) => !process.env[k]);
  const missingRec  = RECOMMENDED.filter((k) => !process.env[k]);

  const startup = {
    ts:           new Date().toISOString(),
    env:          process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    region:       process.env.VERCEL_REGION ?? "local",
    missing_required:    missing,
    missing_recommended: missingRec,
    ready:        missing.length === 0,
  };

  if (missing.length > 0) {
    console.error(JSON.stringify({
      level:   "critical",
      event:   "startup_missing_env",
      message: `Missing required env vars: ${missing.join(", ")}`,
      ...startup,
    }));
  } else {
    console.log(JSON.stringify({
      level:   "info",
      event:   "startup_ok",
      message: "All required env vars present",
      ...startup,
    }));
  }

  if (missingRec.length > 0) {
    console.warn(JSON.stringify({
      level:   "warning",
      event:   "startup_missing_recommended",
      message: `Missing recommended env vars (monitoring degraded): ${missingRec.join(", ")}`,
      ...startup,
    }));
  }
}
