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

  try {
    if (error || !code || !state) {
      return NextResponse.redirect(`${dashUrl}&oauth_error=${encodeURIComponent(error ?? "missing_params")}`);
    }

    const userId = parseState(state);
    if (!userId) return NextResponse.redirect(`${dashUrl}&oauth_error=invalid_state`);

    const redirect = `${appUrl}/api/oauth/slack/callback`;

    let tokenRes;
    try {
      tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          redirect_uri:  redirect,
          client_id:     process.env.SLACK_CLIENT_ID     ?? "",
          client_secret: process.env.SLACK_CLIENT_SECRET ?? "",
        }),
      });
    } catch {
      return NextResponse.redirect(`${dashUrl}&oauth_error=network_error`);
    }

    const tok = await tokenRes.json().catch(() => ({}));
    if (!tok.ok) {
      return NextResponse.redirect(`${dashUrl}&oauth_error=${encodeURIComponent(tok.error ?? "token_failed")}`);
    }

    await getAdminClient().from("integrations").upsert({
      user_id:      userId,
      provider:     "slack",
      access_token: tok.access_token,
      scopes:       tok.scope,
      account_name: tok.team?.name  ?? null,
      provider_uid: tok.team?.id    ?? null,
      meta:         { team_id: tok.team?.id, team_name: tok.team?.name, bot_user_id: tok.bot_user_id },
      updated_at:   new Date().toISOString(),
    }, { onConflict: "user_id,provider" });

    return NextResponse.redirect(`${dashUrl}&oauth_success=slack`);
  } catch (err) {
    console.error("[oauth/slack/callback]", err?.message ?? err);
    return NextResponse.redirect(`${dashUrl}&oauth_error=${encodeURIComponent(err?.message ?? "unknown_error")}`);
  }
}
