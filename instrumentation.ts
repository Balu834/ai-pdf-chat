/**
 * instrumentation.ts — Next.js server startup hook.
 *
 * Runs once per worker process on cold start (Node.js runtime only).
 * Responsibilities:
 *   1. Validate required + recommended env vars — log clearly if missing.
 *   2. Register process.on('unhandledRejection') + process.on('uncaughtException')
 *      so fatal async errors are captured before they crash the process.
 *
 * Requires: experimental.instrumentationHook = true in next.config.mjs
 */

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // ── Env var validation ──────────────────────────────────────────────────────

  const REQUIRED = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "OPENAI_API_KEY",
    "NEXT_PUBLIC_APP_URL",
  ] as const;

  const RECOMMENDED = [
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_CHAT_ID",
    "DISCORD_WEBHOOK_URL",
    "CRON_SECRET",
    "OAUTH_STATE_SECRET",
  ] as const;

  const missing    = REQUIRED.filter((k)     => !process.env[k]);
  const missingRec = RECOMMENDED.filter((k)  => !process.env[k]);

  const startup = {
    ts:                  new Date().toISOString(),
    env:                 process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    region:              process.env.VERCEL_REGION ?? "local",
    missing_required:    missing,
    missing_recommended: missingRec,
    ready:               missing.length === 0,
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

  // ── Global process error handlers ───────────────────────────────────────────
  // Guard against double-registration on hot reload (dev mode re-runs register())

  const MAX_LISTENERS = process.getMaxListeners();

  if (process.listenerCount("unhandledRejection") === 0) {
    process.setMaxListeners(MAX_LISTENERS + 1);
    process.on("unhandledRejection", (reason: unknown) => {
      const message =
        reason instanceof Error ? reason.message : String(reason);
      const stack =
        reason instanceof Error ? (reason.stack ?? null) : null;

      console.error(JSON.stringify({
        level:   "critical",
        event:   "unhandled_rejection",
        message: `UnhandledRejection: ${message}`,
        stack,
        ts:      new Date().toISOString(),
      }));

      // Dynamically import to avoid circular deps and cold-start cost
      import("@/lib/logger/log-system-error")
        .then(({ logSystemError }) =>
          logSystemError(
            { route: "process", message: `UnhandledRejection: ${message}`, stack: stack ?? undefined },
            "critical"
          )
        )
        .catch(() => {});
    });
  }

  if (process.listenerCount("uncaughtException") === 0) {
    process.setMaxListeners(MAX_LISTENERS + 1);
    process.on("uncaughtException", (err: Error) => {
      console.error(JSON.stringify({
        level:   "critical",
        event:   "uncaught_exception",
        message: `UncaughtException: ${err.message}`,
        stack:   err.stack ?? null,
        ts:      new Date().toISOString(),
      }));

      import("@/lib/logger/log-system-error")
        .then(({ logSystemError }) =>
          logSystemError(
            { route: "process", message: `UncaughtException: ${err.message}`, stack: err.stack },
            "critical"
          )
        )
        .catch(() => {});
    });
  }
}
