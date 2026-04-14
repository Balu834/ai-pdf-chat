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
    // Always use the canonical production domain — prevents preview-URL mismatches
    const siteUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://intellixy.vercel.app";

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
