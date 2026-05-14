/**
 * GET /api/monitoring/test?type=<type>&key=<CRON_SECRET>
 *
 * Fires a real (non-destructive) alert to verify Telegram and Discord
 * are both receiving alerts correctly. Use after each deployment.
 *
 * Types:
 *   error     — ⛔ regular error alert (default)
 *   critical  — 🚨 direct critical alert
 *   threshold — fires 6 errors rapidly to trip the 5-in-10-min CRITICAL threshold
 *   auth      — simulates a Google OAuth failure (critical route)
 *   payment   — simulates a Razorpay signature failure (critical route)
 *
 * Auth: ?key=<CRON_SECRET>  OR  Authorization: Bearer <CRON_SECRET>
 */

import { NextResponse }  from "next/server";
import { logger, reqCtx } from "@/lib/logger/log-system-error";
import { getAdminClient }  from "@/lib/admin-client";

type TestType = "error" | "critical" | "threshold" | "auth" | "payment";

function authOk(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  const param  = new URL(request.url).searchParams.get("key");
  return header === `Bearer ${secret}` || param === secret;
}

export async function GET(request: Request): Promise<Response> {
  if (!authOk(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ctx  = reqCtx(request);
  const type = (new URL(request.url).searchParams.get("type") ?? "error") as TestType;

  let adminClient;
  try { adminClient = getAdminClient(); } catch { /* missing service key */ }

  const base = {
    ...ctx,
    ip:          ctx.ip        ?? undefined,
    userAgent:   ctx.userAgent ?? undefined,
    userId:      "test-user-id",
    email:       "test@intellixy.com",
    provider:    "test",
    metadata:    { simulated: true, type } as Record<string, unknown>,
    adminClient,
  };

  // ── threshold ─────────────────────────────────────────────────────────────

  if (type === "threshold") {
    const traceIds: string[] = [];
    for (let i = 1; i <= 6; i++) {
      const id = await logger.error({
        ...base,
        route:   "api/monitoring/test",
        message: `[TEST] Threshold trigger #${i} — simulated error`,
        traceId: undefined, // let logger generate unique IDs per event
      });
      traceIds.push(id);
    }
    return NextResponse.json({
      ok:       true,
      type:     "threshold",
      fired:    6,
      message:  "6 errors fired. Expect 🔥 CRITICAL ALERT in Telegram + Discord.",
      traceIds,
    });
  }

  // ── direct critical ───────────────────────────────────────────────────────

  if (type === "critical") {
    const traceId = await logger.critical({
      ...base,
      route:    "api/monitoring/test",
      message:  "[TEST] Simulated CRITICAL — verify Telegram + Discord both received this",
      stack:    "Error: simulated critical\n    at api/monitoring/test/route.ts:1:1",
    });
    return NextResponse.json({
      ok: true, type: "critical", traceId,
      message: "🚨 Critical alert sent to Telegram + Discord.",
    });
  }

  // ── auth failure sim ──────────────────────────────────────────────────────

  if (type === "auth") {
    const traceId = await logger.critical({
      ...base,
      route:    "auth/callback",
      provider: "google",
      message:  "[TEST] Simulated OAuth failure — Google returned raw auth code instead of exchange token",
      stack:    "Error: OAuth session exchange failed\n    at auth/callback/route.js:45:12",
      metadata: { simulated: true, type: "auth", hint: "Check GOOGLE_CLIENT_SECRET and redirect URI" },
    });
    return NextResponse.json({
      ok: true, type: "auth", traceId,
      message: "🔐 Auth failure alert sent. Verify route shows 'auth/callback'.",
    });
  }

  // ── payment failure sim ───────────────────────────────────────────────────

  if (type === "payment") {
    const traceId = await logger.critical({
      ...base,
      route:    "api/razorpay/webhook",
      provider: "razorpay",
      message:  "[TEST] Simulated Razorpay webhook — invalid signature",
      stack:    "Error: Webhook signature verification failed\n    at api/razorpay/webhook/route.js:38:10",
      metadata: { simulated: true, type: "payment", hint: "Check RAZORPAY_WEBHOOK_SECRET" },
    });
    return NextResponse.json({
      ok: true, type: "payment", traceId,
      message: "💳 Payment failure alert sent. Verify route shows 'api/razorpay/webhook'.",
    });
  }

  // ── default: regular error ────────────────────────────────────────────────

  const traceId = await logger.error({
    ...base,
    route:   "api/monitoring/test",
    message: "[TEST] Simulated production error — verify Telegram + Discord both received this",
    stack:   "Error: simulated\n    at api/monitoring/test/route.ts:1:1",
  });

  return NextResponse.json({
    ok:      true,
    type:    "error",
    traceId,
    message: "⛔ Error alert sent. Check Telegram + Discord within 5 seconds.",
  });
}
