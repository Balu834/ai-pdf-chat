import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  console.log("[middleware] pathname:", pathname);

  // Hard-coded public routes — return immediately, no Supabase call
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    console.log("[middleware] public route — skipping auth check");
    return NextResponse.next();
  }

  // Everything below only runs for /dashboard (enforced by matcher too)
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
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

  const { data: { user } } = await supabase.auth.getUser();
  console.log("[middleware] /dashboard — user:", user?.email ?? "NOT LOGGED IN");

  if (!user) {
    console.log("[middleware] redirecting to /login");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return supabaseResponse;
}

// matcher = ONLY /dashboard routes. "/" is NEVER matched.
export const config = {
  matcher: ["/dashboard/:path*"],
};
