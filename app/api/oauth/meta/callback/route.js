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
      return NextResponse.redirect(
        `${dashUrl}&oauth_error=${encodeURIComponent(error ?? "missing_params")}`
      );
    }

    const userId = parseState(state);
    if (!userId) return NextResponse.redirect(`${dashUrl}&oauth_error=invalid_state`);

    const redirect = `${appUrl}/api/oauth/meta/callback`;

    // Exchange code for access token
    const tokenUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id",     process.env.META_APP_ID     ?? "");
    tokenUrl.searchParams.set("client_secret", process.env.META_APP_SECRET ?? "");
    tokenUrl.searchParams.set("redirect_uri",  redirect);
    tokenUrl.searchParams.set("code",          code);

    let tokenRes;
    try {
      tokenRes = await fetch(tokenUrl.toString());
    } catch {
      return NextResponse.redirect(`${dashUrl}&oauth_error=network_error`);
    }

    const tok = await tokenRes.json().catch(() => ({}));
    if (!tok.access_token) {
      return NextResponse.redirect(
        `${dashUrl}&oauth_error=${encodeURIComponent(tok.error?.message ?? "token_failed")}`
      );
    }

    // Fetch user profile and ad accounts
    const [profileRes, adAccountsRes] = await Promise.all([
      fetch(`https://graph.facebook.com/v19.0/me?fields=id,name,email&access_token=${tok.access_token}`),
      fetch(`https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_id,account_status,currency&access_token=${tok.access_token}`),
    ]);

    const profile    = await profileRes.json().catch(() => ({}));
    const adAccounts = await adAccountsRes.json().catch(() => ({}));

    await getAdminClient().from("integrations").upsert(
      {
        user_id:      userId,
        provider:     "meta_ads",
        access_token: tok.access_token,
        scopes:       "ads_read,email,public_profile",
        account_name: profile.name ?? null,
        provider_uid: profile.id   ?? null,
        meta: {
          facebook_user_id: profile.id,
          facebook_name:    profile.name,
          facebook_email:   profile.email,
          ad_accounts:      adAccounts.data ?? [],
          token_type:       tok.token_type,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" }
    );

    return NextResponse.redirect(`${dashUrl}&oauth_success=meta_ads`);
  } catch (err) {
    console.error("[oauth/meta/callback]", err?.message ?? err);
    return NextResponse.redirect(
      `${dashUrl}&oauth_error=${encodeURIComponent(err?.message ?? "unknown_error")}`
    );
  }
}
