import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { createState } from "@/lib/oauth-state";

const SCOPES = "ads_read,email,public_profile";

export async function GET() {
  const missing = ["NEXT_PUBLIC_APP_URL", "META_APP_ID", "META_APP_SECRET", "OAUTH_STATE_SECRET"]
    .filter((k) => !process.env[k]);
  if (missing.length)
    return NextResponse.json({ error: `Missing env vars: ${missing.join(", ")}` }, { status: 500 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const state    = createState(user.id);
  const redirect = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/meta/callback`;

  const url = new URL("https://www.facebook.com/v19.0/dialog/oauth");
  url.searchParams.set("client_id",    process.env.META_APP_ID);
  url.searchParams.set("redirect_uri", redirect);
  url.searchParams.set("scope",        SCOPES);
  url.searchParams.set("state",        state);
  url.searchParams.set("response_type", "code");

  return NextResponse.redirect(url.toString());
}
