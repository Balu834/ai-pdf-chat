import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;

  // ── Safety net: Supabase sometimes redirects ?code= to / when Site URL is
  //    misconfigured. Catch it at the edge before any client JS runs.
  if (pathname === "/" && searchParams.has("code")) {
    const callbackUrl = new URL("/auth/callback", request.url);
    callbackUrl.search = request.nextUrl.search;
    return NextResponse.redirect(callbackUrl);
  }

  // ── Create a mutable response so Supabase can write refreshed session
  //    cookies on EVERY request (this keeps the JWT from going stale).
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        // Read from the incoming request
        getAll() {
          return request.cookies.getAll();
        },
        // Write refreshed tokens onto BOTH the request (for downstream
        // server code) and the response (so the browser keeps them).
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
    }
  );

  // IMPORTANT: use getUser(), not getSession().
  // getSession() trusts the local JWT without revalidating with Supabase —
  // it can return a stale/spoofed session. getUser() always hits the server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Auth guard: redirect unauthenticated users away from protected routes
  if (!user && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── Return the supabaseResponse (not a plain NextResponse.next()) so the
  //    refreshed session cookies are always forwarded to the browser.
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Run on all routes EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - image/font files
     *
     * This broad matcher ensures session cookies are refreshed on every
     * navigation, including /login and /auth/callback — which is the
     * official Supabase SSR recommendation.
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
