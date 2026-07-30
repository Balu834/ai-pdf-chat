/**
 * POST /api/log-error
 *
 * General-purpose client-side error reporting endpoint.
 * Called from:
 *   - ErrorBoundary (React render crashes)
 *   - app/login/page.js (auth failures)
 *   - Any client component that catches an unhandled error
 *
 * Accepts JSON body:
 *   { route, message, error, stack, provider, email, userId, severity, metadata }
 *
 * severity defaults to "error". Allowed: info | warning | error | critical
 */

import { NextResponse } from "next/server";
import { logger, reqCtx } from "@/lib/logger";
import { getAdminClient } from "@/lib/admin-client";

const ALLOWED = new Set(["info", "warning", "error", "critical"]);

// Simple in-memory IP rate limit: max 20 reports per IP per minute
const _ipCounts = new Map();
setInterval(() => _ipCounts.clear(), 60_000);

export async function POST(req) {
  // Rate limit — prefer x-real-ip (Vercel infra, unspooofable) over x-forwarded-for
  const ip = req.headers.get("x-real-ip")
           ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
           ?? "unknown";

  const count = (_ipCounts.get(ip) ?? 0) + 1;
  _ipCounts.set(ip, count);
  if (count > 20) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const {
    route,
    message,
    error,
    stack,
    provider,
    email,
    userId,
    severity = "error",
    metadata,
  } = body ?? {};

  const msg = message ?? error;
  if (!msg) return NextResponse.json({ error: "missing_message" }, { status: 400 });

  const sev = ALLOWED.has(severity) ? severity : "error";
  const ctx = reqCtx(req);

  let adminClient;
  try { adminClient = getAdminClient(); } catch { /* no service key in env */ }

  // Fire-and-forget — never block the response on logger
  logger[sev]({
    ...ctx,
    route:    route    ?? "client",
    message:  msg,
    stack:    stack    ?? null,
    provider: provider ?? null,
    email:    email    ?? null,
    userId:   userId   ?? null,
    metadata: metadata ?? null,
    adminClient,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
