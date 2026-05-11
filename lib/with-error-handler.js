/**
 * lib/with-error-handler.js
 *
 * Wraps any Next.js App Router route handler (GET, POST, etc.) so that
 * unhandled exceptions are:
 *   1. Logged + alerted via lib/logger.js
 *   2. Returned to the client as a clean JSON 500 (never a raw stack trace)
 *
 * Usage:
 *   import { withErrorHandler } from "@/lib/with-error-handler";
 *
 *   async function handlePOST(req) { ... }
 *   export const POST = withErrorHandler(handlePOST, { route: "api/upload" });
 *
 * For payment/auth routes the severity is automatically promoted to "critical".
 */

import { NextResponse } from "next/server";
import { logger, reqCtx } from "@/lib/logger";
import { getAdminClient } from "@/lib/admin-client";

const CRITICAL_PATTERNS = [
  "razorpay", "payment", "webhook", "auth", "oauth", "callback",
  "cron", "worker", "job",
];

/**
 * @param {Function} handler - Async route handler (req, ctx) => Response
 * @param {{ route?: string }} [options]
 */
export function withErrorHandler(handler, { route } = {}) {
  return async function wrappedHandler(request, context) {
    const ctx = reqCtx(request);
    const routeName = route ?? request.nextUrl?.pathname ?? "unknown";

    let adminClient;
    try { adminClient = getAdminClient(); } catch { /* no service key */ }

    try {
      return await handler(request, context);
    } catch (err) {
      const message  = err?.message  ?? String(err);
      const stack    = err?.stack    ?? null;
      const isPaymentOrAuth = CRITICAL_PATTERNS.some((p) => routeName.includes(p));
      const severity = isPaymentOrAuth ? "critical" : "error";

      logger[severity]({
        ...ctx,
        route:   routeName,
        message,
        stack,
        adminClient,
      }).catch(() => {});

      return NextResponse.json(
        {
          error:   "An unexpected error occurred. Our team has been alerted.",
          traceId: ctx.traceId,
        },
        { status: 500 }
      );
    }
  };
}
