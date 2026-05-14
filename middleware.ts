/**
 * middleware.ts — Edge middleware for Intellixy.
 *
 * Responsibilities:
 *   1. Auth guard  — protect dashboard routes; redirect unauthenticated users to /login
 *   2. Auth redirect — send already-logged-in users away from /login
 *   3. Bot protection — block obvious crawlers/scanners on API routes
 *   4. Abuse guard — hard-block IPs that exceed 200 req/min (in-memory, per-instance)
 *   5. Supabase session refresh — keep access tokens fresh on every request
 *
 * Runs on the Edge runtime (fast, no cold-start penalty).
 */

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient }             from "@supabase/ssr";

// ── Route matchers ────────────────────────────────────────────────────────────

// Routes that require an authenticated session
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/chat",
  "/upload",
  "/settings",
  "/billing",
  "/workspace",
  "/agents",
  "/workflows",
];

// API routes where we block obvious bot scanners
const API_PREFIXES = ["/api/chat", "/api/upload", "/api/agents", "/api/workflows"];

// Paths the middleware should never touch
const BYPASS_PREFIXES = [
  "/_next",
  "/favicon",
  "/api/health",
  "/api/auth",           // Supabase auth callbacks must be passthrough
  "/api/monitoring",
];

// ── In-memory abuse guard (per Edge instance, resets on cold start) ───────────

const _abuseCounts = new Map<string, { count: number; resetAt: number }>();
const ABUSE_WINDOW   = 60_000; // 1 min
const ABUSE_MAX      = 200;    // requests per window per IP

function isAbusive(ip: string): boolean {
  const now   = Date.now();
  let   entry = _abuseCounts.get(ip);

  if (!entry || entry.resetAt <= now) {
    _abuseCounts.set(ip, { count: 1, resetAt: now + ABUSE_WINDOW });
    return false;
  }

  entry.count++;
  return entry.count > ABUSE_MAX;
}

// ── Bot blocker (API routes only) ─────────────────────────────────────────────

const BOT_UA_PATTERNS = [
  /sqlmap/i,
  /nikto/i,
  /masscan/i,
  /nmap/i,
  /zgrab/i,
  /python-requests\/[01]\./i,  // very old Python requests (common in scanners)
  /go-http-client\/1\./i,
  /nuclei/i,
  /dirbuster/i,
  /hydra/i,
];

function isBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return BOT_UA_PATTERNS.some((p) => p.test(userAgent));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function shouldBypass(pathname: string): boolean {
  return BYPASS_PREFIXES.some((p) => pathname.startsWith(p));
}

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

function isApiRoute(pathname: string): boolean {
  return API_PREFIXES.some((p) => pathname.startsWith(p));
}

// ── Middleware ────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Skip entirely for static assets and bypass paths
  if (shouldBypass(pathname)) return NextResponse.next();

  const ip        = getIp(request);
  const userAgent = request.headers.get("user-agent");

  // 1. Abuse guard
  if (isAbusive(ip)) {
    return new NextResponse("Too many requests", {
      status: 429,
      headers: { "Retry-After": "60", "Content-Type": "text/plain" },
    });
  }

  // 2. Bot block on API routes
  if (isApiRoute(pathname) && isBot(userAgent)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // 3. Supabase session refresh + auth gate
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — this extends the access token if it's close to expiry
  const { data: { user } } = await supabase.auth.getUser();

  // 4. Redirect unauthenticated users away from protected routes
  if (isProtected(pathname) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname); // preserve destination
    return NextResponse.redirect(loginUrl);
  }

  // 5. Redirect authenticated users away from login/signup
  if ((pathname === "/login" || pathname === "/signup") && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static  (built assets)
     * - _next/image   (image optimization)
     * - favicon.ico
     * - public folder files with extensions
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
