import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

const CANONICAL = "ai-pdf-chat-steel-kappa.vercel.app";

export async function middleware(request) {
  // Redirect any old/preview deployment URL to the canonical production domain
  const host = request.headers.get("host") || "";
  if (
    host.endsWith(".vercel.app") &&
    host !== CANONICAL &&
    !host.startsWith("localhost")
  ) {
    const url = request.nextUrl.clone();
    url.host = CANONICAL;
    url.port = "";
    return NextResponse.redirect(url, { status: 308 });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
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
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Protect /dashboard — redirect to /login if not authenticated
  if (pathname.startsWith("/dashboard") && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect logged-in users away from /login
  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
