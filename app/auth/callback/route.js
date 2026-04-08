import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Always use the production site URL, never localhost in production
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (origin.includes("localhost") ? origin : origin);

  if (error) {
    const msg = encodeURIComponent(errorDescription || error);
    return NextResponse.redirect(`${siteUrl}/login?error=${msg}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    if (sessionError) {
      const msg = encodeURIComponent(sessionError.message);
      return NextResponse.redirect(`${siteUrl}/login?error=${msg}`);
    }
  }

  return NextResponse.redirect(`${siteUrl}/dashboard`);
}
