import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { sendWelcomeEmail } from "@/lib/email";
import { getAdminClient } from "@/lib/admin-client";
import { logger, reqCtx } from "@/lib/logger";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code             = searchParams.get("code");
  const error            = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://intellixy.vercel.app";
  const ctx     = reqCtx(request);

  let adminClient;
  try { adminClient = getAdminClient(); } catch { /* no service key */ }

  const isGoogleCode = typeof code === "string" && /^4\/0/.test(code);
  const hasVerifier  = request.cookies.getAll().some(
    (c) => c.name.includes("code-verifier") || c.name.includes("verifier")
  );

  console.log("[auth/callback] hit", {
    origin,
    hasCode:     !!code,
    isGoogleCode,
    hasVerifier,
    hasError:    !!error,
    allCookies:  request.cookies.getAll().map((c) => c.name),
  });

  // ── Raw Google code — OAuth misconfiguration ─────────────────────────────
  if (isGoogleCode) {
    const msg = "Raw Google OAuth code received — redirect URI misconfiguration in Google Cloud Console";
    logger.critical({
      ...ctx,
      route:    "auth/callback",
      message:  msg,
      provider: "google",
      adminClient,
    }).catch(() => {});
    return NextResponse.redirect(
      `${siteUrl}/login?error=${encodeURIComponent(
        "OAuth configuration error — please try again or contact support"
      )}`
    );
  }

  // ── OAuth provider returned an error ────────────────────────────────────
  if (error) {
    logger.error({
      ...ctx,
      route:    "auth/callback",
      message:  errorDescription ?? error,
      provider: "oauth",
      metadata: { rawError: error, description: errorDescription },
      adminClient,
    }).catch(() => {});
    return NextResponse.redirect(
      `${siteUrl}/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  // ── No code — likely direct navigation ──────────────────────────────────
  if (!code) {
    console.warn("[auth/callback] no code param — redirecting to dashboard");
    return NextResponse.redirect(`${siteUrl}/dashboard`);
  }

  // ── PKCE verifier missing warning ────────────────────────────────────────
  if (!hasVerifier) {
    logger.warning({
      ...ctx,
      route:    "auth/callback",
      message:  "PKCE code-verifier cookie missing — exchangeCodeForSession will likely fail",
      provider: "oauth",
      metadata: {
        cookies: request.cookies.getAll().map((c) => c.name),
        hasVerifier,
      },
      adminClient,
    }).catch(() => {});
  }

  // ── Exchange code for session ─────────────────────────────────────────────
  const response    = NextResponse.redirect(`${siteUrl}/dashboard`);
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll()              { return cookieStore.getAll(); },
        setAll(cookiesToSet)  {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

  if (sessionError) {
    logger.error({
      ...ctx,
      route:    "auth/callback",
      message:  `exchangeCodeForSession failed: ${sessionError.message}`,
      provider: "oauth",
      metadata: {
        status:      sessionError.status,
        hasVerifier,
        codeSnippet: code?.slice(0, 12),
      },
      adminClient,
    }).catch(() => {});
    return NextResponse.redirect(
      `${siteUrl}/login?error=${encodeURIComponent(sessionError.message)}`
    );
  }

  console.log("[auth/callback] session exchanged OK, user:", data.user?.id);

  if (data.user?.id) {
    await provisionUserRows(data.user, adminClient, ctx);
  }

  return response;
}

async function provisionUserRows(user, adminClient, ctx) {
  const uid  = user.id;
  const meta = user.user_metadata ?? {};

  if (!adminClient) {
    logger.warning({
      ...ctx,
      route:   "auth/callback",
      message: "SUPABASE_SERVICE_ROLE_KEY missing — backup provisioning skipped",
      userId:  uid,
    }).catch(() => {});
    return;
  }

  try {
    const results = await Promise.all([
      adminClient.from("profiles").upsert(
        {
          id:         uid,
          email:      user.email ?? meta.email ?? "",
          full_name:  meta.full_name ?? meta.name ?? (user.email ?? "").split("@")[0],
          avatar_url: meta.avatar_url ?? meta.picture ?? null,
        },
        { onConflict: "id", ignoreDuplicates: true }
      ),
      adminClient.from("user_plans").upsert(
        { user_id: uid, plan: "free", subscription_status: "inactive", is_trial: false, updated_at: new Date().toISOString() },
        { onConflict: "user_id", ignoreDuplicates: true }
      ),
      adminClient.from("user_credits").upsert(
        { user_id: uid, balance: 10, lifetime_earned: 10, lifetime_spent: 0, updated_at: new Date().toISOString() },
        { onConflict: "user_id", ignoreDuplicates: true }
      ),
      adminClient.from("user_stats").upsert(
        { user_id: uid, total_questions: 0, total_pdfs: 0, updated_at: new Date().toISOString() },
        { onConflict: "user_id", ignoreDuplicates: true }
      ),
    ]);

    const errors = results.map((r) => r.error).filter(Boolean);
    if (errors.length > 0) {
      logger.error({
        ...ctx,
        route:   "auth/callback",
        message: `Provision partial failure: ${errors.map((e) => e.message).join("; ")}`,
        userId:  uid,
        email:   user.email,
        adminClient,
      }).catch(() => {});
    } else {
      console.log("[auth/callback] provisioned rows OK for user:", uid);
    }
  } catch (e) {
    logger.error({
      ...ctx,
      route:   "auth/callback",
      message: `provisionUserRows threw: ${e.message}`,
      stack:   e.stack,
      userId:  uid,
      email:   user.email,
      adminClient,
    }).catch(() => {});
  }

  // ── Welcome email for new users ──────────────────────────────────────────
  try {
    const { data: profile } = await adminClient
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
