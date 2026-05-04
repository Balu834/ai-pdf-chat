import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-client";
import { parseState } from "@/lib/oauth-state";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const dashUrl = `${appUrl}/dashboard?view=agents`;

  if (error) return NextResponse.redirect(`${dashUrl}&oauth_error=${encodeURIComponent(error)}`);
  if (!code || !state) return NextResponse.redirect(`${dashUrl}&oauth_error=missing_params`);

  const userId = parseState(state);
  if (!userId) return NextResponse.redirect(`${dashUrl}&oauth_error=invalid_state`);

  const redirect = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/google/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri:  redirect,
      grant_type:    "authorization_code",
    }),
  });
  const tok = await tokenRes.json();
  if (!tokenRes.ok) return NextResponse.redirect(`${dashUrl}&oauth_error=${encodeURIComponent(tok.error)}`);

  // Fetch user profile
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tok.access_token}` },
  });
  const profile = await profileRes.json();

  const expiresAt = new Date(Date.now() + (tok.expires_in ?? 3600) * 1000).toISOString();

  await getAdminClient().from("integrations").upsert({
    user_id:         userId,
    provider:        "google",
    access_token:    tok.access_token,
    refresh_token:   tok.refresh_token ?? null,
    token_expires_at: expiresAt,
    scopes:          tok.scope,
    account_email:   profile.email,
    account_name:    profile.name,
    provider_uid:    profile.id,
    updated_at:      new Date().toISOString(),
  }, { onConflict: "user_id,provider" });

  return NextResponse.redirect(`${dashUrl}&oauth_success=google`);
}
