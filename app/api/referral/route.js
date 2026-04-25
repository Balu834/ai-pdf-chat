import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { getReferralStats, getOrCreateCode } from "@/lib/referral";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Ensure code exists (backfill for users who pre-date the trigger)
    await getOrCreateCode(user.id);

    const stats = await getReferralStats(user.id);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://intellixy.in";
    const link = `${appUrl}/login?ref=${stats.code}`;

    return NextResponse.json({ ...stats, link });
  } catch (err) {
    console.error("[/api/referral]", err);
    return NextResponse.json({ error: "Failed to load referral data" }, { status: 500 });
  }
}
