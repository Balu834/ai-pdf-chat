import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { sendWelcomeEmail } from "@/lib/email";
import { getAdminClient } from "@/lib/admin-client";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code             = searchParams.get("code");
  const error            = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://intellixy.vercel.app";

  // Detect what kind of code we received for diagnostics
  const isGoogleCode  = typeof code === "string" && /^4\/0/.test(code);
  const hasVerifier   = request.cookies.getAll().some(
    (c) => c.name.includes("code-verifier") || c.name.includes("verifier")
  );

  console.log("[auth/callback] hit", {
    origin,
    hasCode:      !!code,
    isGoogleCode,        // true → Google is redirecting here directly (config error)
    hasVerifier,         // false → PKCE verifier cookie missing
    hasError:     !!error,
    allCookies:   request.cookies.getAll().map((c) => c.name),
  });

  // ── Raw Google code detected ─────────────────────────────────────────────
  // Google OAuth codes start with "4/0...". Receiving one here means Google
  // is redirecting directly to this URL instead of going through Supabase's
  // callback first.
  //
  // ROOT CAUSE: In Google Cloud Console → Credentials → OAuth 2.0 Client,
  //   the Authorized Redirect URI is set to this app's URL instead of the
  //   Supabase callback URL.
  //
  // FIX (Google Cloud Console):
  //   Remove:  https://intellixy.vercel.app/auth/callback
  //   Add:     https://udgcixztydnkhvfurgdj.supabase.co/auth/v1/callback
  //   (replace udgcixztydnkhvfurgdj with your Supabase project ref)
  //
  // FIX (Supabase Dashboard → Auth → URL Configuration):
  //   Site URL:      https://intellixy.vercel.app
  //   Redirect URLs: https://intellixy.vercel.app/auth/callback
  if (isGoogleCode) {
    console.error(
      "[auth/callback] MISCONFIGURATION: received raw Google OAuth code. " +
      "Google must redirect to Supabase's callback URL, not this app. " +
      "Google Cloud Console → Authorized Redirect URI should be: " +
      "https://udgcixztydnkhvfurgdj.supabase.co/auth/v1/callback"
    );
    return NextResponse.redirect(
      `${siteUrl}/login?error=${encodeURIComponent(
        "OAuth configuration error — please try again or contact support"
      )}`
    );
  }

  // ── OAuth error returned by Supabase / Google ────────────────────────────
  if (error) {
    console.error("[auth/callback] OAuth provider error:", error, errorDescription);
    return NextResponse.redirect(
      `${siteUrl}/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  // ── No code ──────────────────────────────────────────────────────────────
  if (!code) {
    console.warn("[auth/callback] no code param — redirecting to dashboard");
    return NextResponse.redirect(`${siteUrl}/dashboard`);
  }

  // ── PKCE verifier missing — log a specific warning ───────────────────────
  // Without the verifier cookie, exchangeCodeForSession will always fail.
  // Causes: incognito mode with strict tracking protection, cross-origin
  // redirect stripping cookies, or cookie domain mismatch.
  if (!hasVerifier) {
    console.warn(
      "[auth/callback] PKCE code-verifier cookie is MISSING. " +
      "exchangeCodeForSession will likely fail. " +
      "Cookies present: " + request.cookies.getAll().map((c) => c.name).join(", ")
    );
  }

  // ── Build redirect response so session cookies attach to it ──────────────
  const response    = NextResponse.redirect(`${siteUrl}/dashboard`);
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

  if (sessionError) {
    console.error("[auth/callback] exchangeCodeForSession FAILED:", {
      message:      sessionError.message,
      status:       sessionError.status,
      hasVerifier,
      codeSnippet:  code?.slice(0, 12),  // first 12 chars for diagnostics
    });
    return NextResponse.redirect(
      `${siteUrl}/login?error=${encodeURIComponent(sessionError.message)}`
    );
  }

  console.log("[auth/callback] session exchanged OK, user:", data.user?.id);

  if (data.user?.id) {
    await provisionUserRows(data.user);
  }

  return response;
}

/**
 * Ensure all required profile rows exist for this user.
 * Uses the service-role admin client to bypass RLS.
 * Errors here are logged but never block the redirect.
 */
async function provisionUserRows(user) {
  const uid  = user.id;
  const meta = user.user_metadata ?? {};

  let admin;
  try {
    admin = getAdminClient();
  } catch (err) {
    console.error(
      "[auth/callback] MISSING SUPABASE_SERVICE_ROLE_KEY — backup provisioning skipped.",
      err.message
    );
    return;
  }

  try {
    const results = await Promise.all([
      admin.from("profiles").upsert(
        {
          id:         uid,
          email:      user.email ?? meta.email ?? "",
          full_name:  meta.full_name ?? meta.name ?? (user.email ?? "").split("@")[0],
          avatar_url: meta.avatar_url ?? meta.picture ?? null,
        },
        { onConflict: "id", ignoreDuplicates: true }
      ),
      admin.from("user_plans").upsert(
        {
          user_id:             uid,
          plan:                "free",
          subscription_status: "inactive",
          is_trial:            false,
          updated_at:          new Date().toISOString(),
        },
        { onConflict: "user_id", ignoreDuplicates: true }
      ),
      admin.from("user_credits").upsert(
        {
          user_id:         uid,
          balance:         10,
          lifetime_earned: 10,
          lifetime_spent:  0,
          updated_at:      new Date().toISOString(),
        },
        { onConflict: "user_id", ignoreDuplicates: true }
      ),
      admin.from("user_stats").upsert(
        {
          user_id:         uid,
          total_questions: 0,
          total_pdfs:      0,
          updated_at:      new Date().toISOString(),
        },
        { onConflict: "user_id", ignoreDuplicates: true }
      ),
    ]);

    const errors = results.map((r) => r.error).filter(Boolean);
    if (errors.length > 0) {
      console.error(
        "[auth/callback] provision partial failure for user:", uid,
        errors.map((e) => e.message)
      );
    } else {
      console.log("[auth/callback] provisioned rows OK for user:", uid);
    }
  } catch (e) {
    console.error("[auth/callback] provision threw for user:", uid, e.message);
  }

  // ── Welcome email for new users ──────────────────────────────────────────
  try {
    const { data: profile } = await admin
      .from("profiles")
      .select("created_at")
      .eq("id", uid)
      .maybeSingle();

    const isNewUser =
      profile?.created_at &&
      Date.now() - new Date(profile.created_at).getTime() < 60_000;

    if (isNewUser && user.email) {
      sendWelcomeEmail(user.email, meta.full_name ?? meta.name).catch((e) =>
        console.warn("[auth/callback] welcome email failed (non-fatal):", e.message)
      );
    }
  } catch (e) {
    console.warn("[auth/callback] new-user check threw (non-fatal):", e.message);
  }
}
