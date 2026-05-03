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

  const redirect = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/notion/callback`;
  const credentials = Buffer.from(`${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`).toString("base64");

  const tokenRes = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/json" },
    body: JSON.stringify({ grant_type: "authorization_code", code, redirect_uri: redirect }),
  });
  const tok = await tokenRes.json();
  if (!tokenRes.ok) return NextResponse.redirect(`${dashUrl}&oauth_error=${encodeURIComponent(tok.error ?? "token_failed")}`);

  await admin.from("integrations").upsert({
    user_id:       userId,
    provider:      "notion",
    access_token:  tok.access_token,
    account_name:  tok.workspace_name,
    provider_uid:  tok.workspace_id,
    meta:          { workspace_id: tok.workspace_id, workspace_name: tok.workspace_name, workspace_icon: tok.workspace_icon },
    updated_at:    new Date().toISOString(),
  }, { onConflict: "user_id,provider" });

  return NextResponse.redirect(`${dashUrl}&oauth_success=notion`);
}
