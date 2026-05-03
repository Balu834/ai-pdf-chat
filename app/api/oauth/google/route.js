import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { createState } from "@/lib/oauth-state";

const SCOPES = [
  "openid", "email", "profile",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

export async function GET() {
  const missing = ["NEXT_PUBLIC_APP_URL", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "OAUTH_STATE_SECRET"]
    .filter((k) => !process.env[k]);
  if (missing.length)
    return NextResponse.json({ error: `Missing env vars: ${missing.join(", ")}` }, { status: 500 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const state    = createState(user.id);
  const redirect = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/google/callback`;

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id",     process.env.GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri",  redirect);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope",         SCOPES);
  url.searchParams.set("access_type",   "offline");
  url.searchParams.set("prompt",        "consent");
  url.searchParams.set("state",         state);

  return NextResponse.redirect(url.toString());
}
