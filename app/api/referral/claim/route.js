import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { claimReferral, getClientIp, hashIp } from "@/lib/referral";

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { ref_code } = body;

    if (!ref_code?.trim()) return NextResponse.json({ error: "ref_code required" }, { status: 400 });

    const ipHash = hashIp(getClientIp(request));
    const result = await claimReferral(user.id, ref_code.trim(), ipHash);

    if (!result?.ok) {
      // Not an error — just silent for UX (user doesn't need to see "already_claimed")
      const silent = ["already_claimed", "self_referral"].includes(result?.reason);
      if (silent) return NextResponse.json({ ok: false, reason: result?.reason });
      return NextResponse.json({ ok: false, reason: result?.reason }, { status: 400 });
    }

    console.log(`[referral/claim] ✅ User ${user.id} claimed code ${ref_code} — +${result.referred_credits} credits`);
    return NextResponse.json({
      ok:               true,
      referred_credits: result.referred_credits,
      inviter_credits:  result.inviter_credits,
    });
  } catch (err) {
    console.error("[referral/claim]", err);
    return NextResponse.json({ error: "Claim failed" }, { status: 500 });
  }
}
