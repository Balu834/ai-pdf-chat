import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code  = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://ai-pdf-chat-steel-kappa.vercel.app";

  // OAuth error from Supabase/Google
  if (error) {
    const msg = encodeURIComponent(errorDescription || error);
    return NextResponse.redirect(`${siteUrl}/login?error=${msg}`);
  }

  // No code → just send to dashboard (email/password login lands here too)
  if (!code) {
    return NextResponse.redirect(`${siteUrl}/dashboard`);
  }

  // Build the redirect response FIRST, then attach session cookies to it
  const response = NextResponse.redirect(`${siteUrl}/dashboard`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        // Read from the incoming request
        getAll() {
          return request.cookies.getAll();
        },
        // Write onto the outgoing response (this is what saves the session)
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

  if (sessionError) {
    console.error("[auth/callback] exchangeCodeForSession failed:", sessionError.message);
    const msg = encodeURIComponent(sessionError.message);
    return NextResponse.redirect(`${siteUrl}/login?error=${msg}`);
  }

  // Session cookies are now set on `response` — user is logged in
  return response;
}
