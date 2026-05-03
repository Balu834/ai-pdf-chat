import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { createState } from "@/lib/oauth-state";

export async function GET() {
  const missing = ["NEXT_PUBLIC_APP_URL", "NOTION_CLIENT_ID", "NOTION_CLIENT_SECRET", "OAUTH_STATE_SECRET"]
    .filter((k) => !process.env[k]);
  if (missing.length)
    return NextResponse.json({ error: `Missing env vars: ${missing.join(", ")}` }, { status: 500 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const state    = createState(user.id);
  const redirect = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/notion/callback`;

  const url = new URL("https://api.notion.com/v1/oauth/authorize");
  url.searchParams.set("client_id",     process.env.NOTION_CLIENT_ID);
  url.searchParams.set("redirect_uri",  redirect);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("owner",         "user");
  url.searchParams.set("state",         state);

  return NextResponse.redirect(url.toString());
}
