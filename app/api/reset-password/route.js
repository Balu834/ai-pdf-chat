import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { paymentLimiter } from "@/lib/rate-limit";

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Public endpoint, so throttle per IP (paymentLimiter is the shared
    // auth/payment limiter: 5 per 10 minutes). Without it anyone can send
    // unlimited reset emails to any address and burn the Supabase auth quota.
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const rl = paymentLimiter.check(`reset:${ip}`);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many reset requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
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
