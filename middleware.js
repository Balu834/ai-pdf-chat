import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Routes that never require authentication — always pass through.
function isPublicPath(pathname) {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/")
  );
}

export async function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;

  // ── Supabase sometimes sends ?code= to / when Site URL is misconfigured.
  //    Redirect to the proper callback handler before anything else.
  if (pathname === "/" && searchParams.has("code")) {
    const callbackUrl = new URL("/auth/callback", request.url);
    callbackUrl.search = request.nextUrl.search;
    return NextResponse.redirect(callbackUrl);
  }

  // ── Public paths: skip all auth logic entirely.
  //    This prevents a Supabase outage / missing env var from ever returning
  //    403 on /, /login, /api/*, or /auth/*.
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // ── Guard: if env vars are absent (e.g. not set in Vercel dashboard),
  //    pass the request through rather than crashing the Edge runtime.
  //    The page itself will handle the unauthenticated state.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error(
      "[middleware] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — skipping auth check"
    );
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        // Write refreshed tokens onto both request and response so the
        // browser always receives an up-to-date JWT.
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // getUser() revalidates the JWT server-side on every request.
    // Never use getSession() here — it trusts a local cookie without
    // confirming with Supabase, which is a security hole.
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      // Log but do NOT block — a Supabase error (e.g. project paused,
      // network timeout) must never turn into a 403 for the visitor.
      console.error("[middleware] getUser error:", error.message);
    }

    // ── Dashboard guard
    if (!user && pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // ── Admin guard
    if (pathname.startsWith("/admin")) {
      if (!user) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      const adminEmails = (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      if (!adminEmails.includes(user.email?.toLowerCase())) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  } catch (err) {
    // Any unhandled Edge-runtime exception would become a 403/500 on Vercel.
    // Catch everything and allow the request through — the page handles auth.
    console.error("[middleware] unexpected error:", err?.message ?? String(err));
    return NextResponse.next({ request });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Run on every path except Next.js internals and static assets.
    // This keeps session cookies fresh on every page navigation.
    "/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mjs|woff|woff2|ttf)$).*)",
  ],
};
