import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { createState } from "@/lib/oauth-state";

const SCOPES = "chat:write,channels:read,im:write,users:read.email,im:history";

export async function GET() {
  const missing = ["NEXT_PUBLIC_APP_URL", "SLACK_CLIENT_ID", "SLACK_CLIENT_SECRET", "OAUTH_STATE_SECRET"]
    .filter((k) => !process.env[k]);
  if (missing.length)
    return NextResponse.json({ error: `Missing env vars: ${missing.join(", ")}` }, { status: 500 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const state    = createState(user.id);
  const redirect = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/slack/callback`;

  const url = new URL("https://slack.com/oauth/v2/authorize");
  url.searchParams.set("client_id",    process.env.SLACK_CLIENT_ID);
  url.searchParams.set("scope",        SCOPES);
  url.searchParams.set("redirect_uri", redirect);
  url.searchParams.set("state",        state);

  return NextResponse.redirect(url.toString());
}
