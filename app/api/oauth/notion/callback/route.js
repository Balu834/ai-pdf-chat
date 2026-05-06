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

    const redirect     = `${appUrl}/api/oauth/notion/callback`;
    const credentials  = Buffer.from(
      `${process.env.NOTION_CLIENT_ID ?? ""}:${process.env.NOTION_CLIENT_SECRET ?? ""}`
    ).toString("base64");

    let tokenRes;
    try {
      tokenRes = await fetch("https://api.notion.com/v1/oauth/token", {
        method:  "POST",
        headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/json" },
        body:    JSON.stringify({ grant_type: "authorization_code", code, redirect_uri: redirect }),
      });
    } catch {
      return NextResponse.redirect(`${dashUrl}&oauth_error=network_error`);
    }

    const tok = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok) {
      return NextResponse.redirect(`${dashUrl}&oauth_error=${encodeURIComponent(tok.error ?? "token_failed")}`);
    }

    await getAdminClient().from("integrations").upsert({
      user_id:      userId,
      provider:     "notion",
      access_token: tok.access_token,
      account_name: tok.workspace_name ?? null,
      provider_uid: tok.workspace_id   ?? null,
      meta:         { workspace_id: tok.workspace_id, workspace_name: tok.workspace_name, workspace_icon: tok.workspace_icon },
      updated_at:   new Date().toISOString(),
    }, { onConflict: "user_id,provider" });

    return NextResponse.redirect(`${dashUrl}&oauth_success=notion`);
  } catch (err) {
    console.error("[oauth/notion/callback]", err?.message ?? err);
    return NextResponse.redirect(`${dashUrl}&oauth_error=${encodeURIComponent(err?.message ?? "unknown_error")}`);
  }
}
