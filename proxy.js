// Next.js 16 proxy (replaces middleware.js)
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

export async function proxy(request) {
  const { pathname, searchParams } = request.nextUrl;

  // ── Supabase sometimes sends ?code= to / when Site URL is misconfigured.
  //    Redirect to the proper callback handler before anything else.
  //    If the code looks like a raw Google OAuth code (4/0...) it means the
  //    Supabase Site URL is wrong AND Google Cloud Console redirect URI is
  //    pointing to this app instead of https://[project].supabase.co/auth/v1/callback.
  if (pathname === "/" && searchParams.has("code")) {
    const rawCode = searchParams.get("code") ?? "";
    if (/^4\/0/.test(rawCode)) {
      console.error(
        "[proxy] Raw Google OAuth code at site root — Supabase Site URL or " +
        "Google Cloud Console redirect URI is misconfigured. " +
        "Google must redirect to https://[project-ref].supabase.co/auth/v1/callback"
      );
    }
    const callbackUrl = new URL("/auth/callback", request.url);
    callbackUrl.search = request.nextUrl.search;
    return NextResponse.redirect(callbackUrl);
  }

  // ── Public paths: still pass { request } so session cookies can refresh.
  if (isPublicPath(pathname)) {
    return NextResponse.next({ request });
  }

  // ── Guard: if env vars are absent, pass through rather than crashing.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error(
      "[proxy] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — skipping auth check"
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

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("[proxy] getUser error:", error.message);
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
    console.error("[proxy] unexpected error:", err?.message ?? String(err));
    return NextResponse.next({ request });
  }

  // Prevent browsers/CDNs from caching authenticated API responses.
  if (request.nextUrl.pathname.startsWith("/api/")) {
    supabaseResponse.headers.set("Cache-Control", "no-store, private");
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mjs|woff|woff2|ttf)$).*)",
  ],
};
