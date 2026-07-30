/**
 * POST /api/auth/log-error — backwards-compat shim.
 * Delegates to the general log-error handler in lib/logger.js.
 */
import { NextResponse } from "next/server";
import { logger, reqCtx } from "@/lib/logger";
import { getAdminClient } from "@/lib/admin-client";
import { logErrorLimiter } from "@/lib/rate-limit";

export async function POST(req) {
  const ip = req.headers.get("x-real-ip")
           ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
           ?? "unknown";
  const rl = logErrorLimiter.check(ip);
  if (!rl.ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { route, error, provider, email } = body ?? {};
  if (!error) return NextResponse.json({ error: "missing_error" }, { status: 400 });

  const ctx = reqCtx(req);
  let adminClient;
  try { adminClient = getAdminClient(); } catch { /* no key */ }

  logger.error({
    ...ctx,
    route:    route    ?? "client/auth",
    message:  error,
    provider: provider ?? "auth",
    email:    email    ?? null,
    adminClient,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
