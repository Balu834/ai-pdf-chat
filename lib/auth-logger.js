/**
 * lib/auth-logger.js — thin compatibility shim over lib/logger.js
 *
 * All new code should import { logger, reqCtx } from "@/lib/logger" directly.
 * This file exists so any import of auth-logger.js keeps working.
 */

import { logger, reqCtx } from "@/lib/logger";

/**
 * Log an auth failure from a server-side route.
 * @param {object} ctx - Same shape as LogCtx in lib/logger.js
 */
export async function logAuthError(ctx) {
  return logger.error({ ...ctx, provider: ctx.provider ?? "auth" });
}

/**
 * Report a client-side auth error via POST /api/log-error.
 * Fire-and-forget — never awaited in practice.
 */
export async function reportClientAuthError({ route, error, provider, email }) {
  try {
    await fetch("/api/log-error", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ route, message: error, provider, email, severity: "error" }),
    });
  } catch { /* silent */ }
}

export { reqCtx };
