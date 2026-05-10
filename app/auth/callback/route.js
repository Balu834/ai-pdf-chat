import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { sendWelcomeEmail } from "@/lib/email";
import { getAdminClient } from "@/lib/admin-client";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code             = searchParams.get("code");
  const error            = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://intellixy.vercel.app";

  console.log("[auth/callback] hit", {
    origin,
    hasCode:  !!code,
    hasError: !!error,
    cookieNames: request.cookies.getAll().map((c) => c.name),
  });

  // ── OAuth error returned by Supabase / Google ────────────────────────────
  if (error) {
    console.error("[auth/callback] OAuth provider error:", error, errorDescription);
    return NextResponse.redirect(
      `${siteUrl}/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  // ── No code — send to dashboard (already authenticated, or lost code) ────
  if (!code) {
    console.warn("[auth/callback] no code param");
    return NextResponse.redirect(`${siteUrl}/dashboard`);
  }

  // ── Build redirect response first so we can attach session cookies ────────
  const response = NextResponse.redirect(`${siteUrl}/dashboard`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
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
      message: sessionError.message,
      status:  sessionError.status,
      verifierCookies: request.cookies
        .getAll()
        .filter((c) => c.name.includes("verifier") || c.name.includes("code"))
        .map((c) => c.name),
    });
    // "Database error saving new user" means the DB trigger failed.
    // The SQL fix in FIX-THIS-IN-SUPABASE.sql must be run in Supabase.
    return NextResponse.redirect(
      `${siteUrl}/login?error=${encodeURIComponent(sessionError.message)}`
    );
  }

  console.log("[auth/callback] session OK, user:", data.user?.id);

  if (data.user?.id) {
    await provisionUserRows(data.user);
  }

  return response;
}

/**
 * Ensure all required profile rows exist for this user.
 * Uses the service-role admin client to bypass RLS.
 * Errors here are logged but NEVER block the redirect.
 */
async function provisionUserRows(user) {
  const uid  = user.id;
  const meta = user.user_metadata ?? {};

  let admin;
  try {
    admin = getAdminClient();
  } catch (err) {
    console.error(
      "[auth/callback] MISSING SUPABASE_SERVICE_ROLE_KEY — backup provisioning disabled.",
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
      console.error("[auth/callback] provision partial failure:", errors.map((e) => e.message));
    } else {
      console.log("[auth/callback] provisioned rows for user:", uid);
    }
  } catch (e) {
    console.error("[auth/callback] provision threw:", e.message);
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
