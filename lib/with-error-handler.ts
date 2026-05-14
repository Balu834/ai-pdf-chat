/**
 * lib/with-error-handler.ts
 *
 * Wraps any Next.js App Router route handler (GET, POST, etc.) so that
 * unhandled exceptions are logged and returned as a clean JSON 500.
 *
 * Usage:
 *   async function handlePOST(req: Request) { ... }
 *   export const POST = withErrorHandler(handlePOST, { route: "api/upload" });
 *
 * Payment/auth routes are auto-promoted to "critical" severity.
 */

import { NextResponse } from "next/server";
import { logger, reqCtx } from "@/lib/logger/log-system-error";
import { getAdminClient }  from "@/lib/admin-client";

// ── Types ─────────────────────────────────────────────────────────────────────

// Next.js 16+: params is a Promise<Record<string, string>>
type RouteContext = { params: Promise<Record<string, string>> };
type RouteHandler = (request: Request, context: RouteContext) => Promise<Response> | Response;

// ── Critical pattern detection ────────────────────────────────────────────────

const CRITICAL_PATTERNS = [
  "razorpay", "payment", "webhook", "auth", "oauth", "callback",
  "cron", "worker", "job",
];

// ── withErrorHandler ──────────────────────────────────────────────────────────

export function withErrorHandler(
  handler: RouteHandler,
  { route }: { route?: string } = {}
): RouteHandler {
  return async function wrappedHandler(
    request: Request,
    context: RouteContext
  ): Promise<Response> {
    const ctx       = reqCtx(request);
    const routeName = route
      ?? (request as unknown as { nextUrl?: { pathname?: string } }).nextUrl?.pathname
      ?? "unknown";

    let adminClient;
    try { adminClient = getAdminClient(); } catch { /* missing env vars */ }

    try {
      return await handler(request, context);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const stack   = err instanceof Error ? (err.stack ?? null) : null;
      const isCriticalRoute = CRITICAL_PATTERNS.some((p) => routeName.includes(p));
      const severity = isCriticalRoute ? "critical" : "error";

      logger[severity]({
        ip:          ctx.ip        ?? undefined,
        userAgent:   ctx.userAgent ?? undefined,
        traceId:     ctx.traceId,
        route:       routeName,
        message,
        stack:       stack ?? undefined,
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
