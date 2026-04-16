import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { startTrial } from "@/lib/trial";
import { sendWelcomeEmail } from "@/lib/email";
import { createClient as createAdmin } from "@supabase/supabase-js";

const adminDb = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const { searchParams, origin, pathname } = new URL(request.url);
  const code             = searchParams.get("code");
  const error            = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://intellixy.vercel.app";

  // ── Debug: log every hit so you can trace in Vercel → Functions logs ────
  console.log("[auth/callback] hit", {
    origin,
    pathname,
    hasCode:  !!code,
    hasError: !!error,
    // List cookie names present — verifier should appear here if PKCE works
    cookieNames: request.cookies.getAll().map((c) => c.name),
  });

  // ── OAuth error returned by Supabase / Google ────────────────────────────
  if (error) {
    console.error("[auth/callback] OAuth error:", error, errorDescription);
    const msg = encodeURIComponent(errorDescription || error);
    return NextResponse.redirect(`${siteUrl}/login?error=${msg}`);
  }

  // ── No code — shouldn't happen in normal flow, send to dashboard ─────────
  if (!code) {
    console.warn("[auth/callback] no code param — redirecting to dashboard");
    return NextResponse.redirect(`${siteUrl}/dashboard`);
  }

  // ── Build the redirect response FIRST so we can write session cookies to it
  const response = NextResponse.redirect(`${siteUrl}/dashboard`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        // Read verifier from the *incoming* request cookies
        getAll() {
          return request.cookies.getAll();
        },
        // Write session tokens onto the *outgoing* response cookies
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error: sessionError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (sessionError) {
    // ── This is where "PKCE code verifier not found" surfaces ─────────────
    // Causes:
    //  1. redirectTo in signInWithOAuth pointed to a DIFFERENT origin than
    //     the one that made the request (e.g. hardcoded production URL while
    //     running on localhost) → verifier cookie domain mismatch.
    //  2. http://localhost:3000/auth/callback not added to Supabase Dashboard
    //     → Supabase rewrites the redirect to Site URL, crossing origins.
    //  3. Same ?code= used twice — codes are single-use.
    console.error("[auth/callback] exchangeCodeForSession FAILED:", {
      message:     sessionError.message,
      status:      sessionError.status,
      // Show which verifier-related cookies were present (or absent)
      verifierCookies: request.cookies
        .getAll()
        .filter((c) => c.name.includes("verifier") || c.name.includes("code"))
        .map((c) => c.name),
    });
    const msg = encodeURIComponent(sessionError.message);
    return NextResponse.redirect(`${siteUrl}/login?error=${msg}`);
  }

  console.log("[auth/callback] session exchanged OK for user:", data.user?.id);

  // Start 7-day free trial for brand new users (no-op for returning users)
  if (data.user?.id) {
    await startTrial(data.user.id);

    // Detect brand-new users by checking whether their user_plans row was just
    // auto-provisioned (created_at within the last 30 seconds).
    // New users get a welcome email; returning users don't.
    try {
      const { data: planRow } = await adminDb
        .from("user_plans")
        .select("updated_at")
        .eq("user_id", data.user.id)
        .maybeSingle();

      const isNewUser =
        planRow?.updated_at &&
        Date.now() - new Date(planRow.updated_at).getTime() < 30_000;

      if (isNewUser && data.user.email) {
        sendWelcomeEmail(
          data.user.email,
          data.user.user_metadata?.full_name
        ).catch((e) =>
          console.warn("[auth/callback] welcome email failed (non-fatal):", e.message)
        );
      }
    } catch (e) {
      console.warn("[auth/callback] new-user check threw (non-fatal):", e.message);
    }
  }

  return response;
}
