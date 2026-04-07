import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Always resolve to the production domain — never throw over missing env
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : null) ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : null) ||
      // Read from the incoming request host as last resort
      (() => {
        const host = req.headers.get("host") || "";
        const proto = host.startsWith("localhost") ? "http" : "https";
        return host ? `${proto}://${host}` : "https://intellixy.org";
      })();

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${siteUrl}/reset-password`,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 });
  }
}
