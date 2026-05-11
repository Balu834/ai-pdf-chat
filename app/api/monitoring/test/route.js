/**
 * GET /api/monitoring/test?type=<type>&key=<CRON_SECRET>
 *
 * Triggers a real (non-destructive) alert to verify Telegram and Discord
 * are wired correctly. Use this after deployment to confirm the pipeline works.
 *
 * Types:
 *   error     — sends a regular ⛔ alert
 *   critical  — sends a 🚨 critical alert
 *   threshold — fires 6 error events rapidly to trigger the 5-in-10-min threshold
 *   health    — returns the same body as /api/health
 *
 * Authentication: requires ?key=<CRON_SECRET> or Authorization: Bearer <CRON_SECRET>
 * Never expose this endpoint without the secret check.
 */

import { NextResponse } from "next/server";
import { logger, reqCtx } from "@/lib/logger";
import { getAdminClient } from "@/lib/admin-client";

function authOk(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // if no CRON_SECRET set, block all test calls
  const header = request.headers.get("authorization");
  const param  = new URL(request.url).searchParams.get("key");
  return header === `Bearer ${secret}` || param === secret;
}

export async function GET(request) {
  if (!authOk(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ctx  = reqCtx(request);
  const type = new URL(request.url).searchParams.get("type") ?? "error";

  let adminClient;
  try { adminClient = getAdminClient(); } catch { /* */ }

  const base = {
    ...ctx,
    route:    "api/monitoring/test",
    userId:   "test-user-id",
    email:    "test@intellixy.com",
    provider: "test",
    metadata: { simulated: true, type },
    adminClient,
  };

  if (type === "threshold") {
    // Fire 6 errors rapidly to trip the 5-in-10-min critical threshold
    const results = [];
    for (let i = 1; i <= 6; i++) {
      const traceId = await logger.error({
        ...base,
        message: `[TEST] Simulated error #${i} — threshold trigger`,
        traceId: undefined, // let logger generate unique IDs
      });
      results.push(traceId);
    }
    return NextResponse.json({
      ok:      true,
      type:    "threshold",
      fired:   6,
      message: "Fired 6 errors. Check Telegram/Discord for 🔥 CRITICAL ALERT.",
      traceIds: results,
    });
  }

  if (type === "critical") {
    const traceId = await logger.critical({
      ...base,
      message: "[TEST] Simulated CRITICAL error — verify your Telegram bot received this",
      stack:   "Error: simulated\n    at monitoring/test/route.js:1:1",
    });
    return NextResponse.json({ ok: true, type: "critical", traceId });
  }

  // Default: regular error alert
  const traceId = await logger.error({
    ...base,
    message: "[TEST] Simulated production error — verify your Telegram bot received this",
    stack:   "Error: simulated\n    at monitoring/test/route.js:1:1",
  });

  return NextResponse.json({
    ok:      true,
    type:    "error",
    traceId,
    message: "Alert sent. Check Telegram and Discord within 5 seconds.",
  });
}
