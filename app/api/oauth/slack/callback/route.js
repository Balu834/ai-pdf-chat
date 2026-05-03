import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseState } from "@/lib/oauth-state";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const dashUrl = `${appUrl}/dashboard?view=agents`;
  if (error || !code || !state) return NextResponse.redirect(`${dashUrl}&oauth_error=${error ?? "missing_params"}`);

  const userId = parseState(state);
  if (!userId) return NextResponse.redirect(`${dashUrl}&oauth_error=invalid_state`);

  const redirect = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/slack/callback`;

  const tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code, redirect_uri: redirect,
      client_id: process.env.SLACK_CLIENT_ID, client_secret: process.env.SLACK_CLIENT_SECRET,
    }),
  });
  const tok = await tokenRes.json();
  if (!tok.ok) return NextResponse.redirect(`${dashUrl}&oauth_error=${encodeURIComponent(tok.error)}`);

  await admin.from("integrations").upsert({
    user_id:       userId,
    provider:      "slack",
    access_token:  tok.access_token,
    scopes:        tok.scope,
    account_name:  tok.team?.name,
    provider_uid:  tok.team?.id,
    meta:          { team_id: tok.team?.id, team_name: tok.team?.name, bot_user_id: tok.bot_user_id },
    updated_at:    new Date().toISOString(),
  }, { onConflict: "user_id,provider" });

  return NextResponse.redirect(`${dashUrl}&oauth_success=slack`);
}
