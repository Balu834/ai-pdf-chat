import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { checkPdfLimit, checkQuestionLimit, FREE_PLAN } from "@/lib/limits";
import { getUserPlan, isProActive } from "@/lib/user-plan";
import { getCredits } from "@/lib/credits";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [pdfs, questions, planData, proActive, credits] = await Promise.all([
      checkPdfLimit(supabase, user.id),
      checkQuestionLimit(supabase, user.id),
      getUserPlan(user.id),
      isProActive(user.id),
      getCredits(user.id),
    ]);

    return NextResponse.json({
      email: user.email,
      plan: planData.plan,
      is_pro_active: proActive,
      pro_expires_at: planData.pro_expires_at ?? null,
      subscription_status: planData.subscription_status ?? "inactive",
      pdfs: {
        used: proActive ? 0 : pdfs.count,
        max: proActive ? null : FREE_PLAN.maxPdfs,
        remaining: proActive ? null : pdfs.remaining,
      },
      questions: {
        used: proActive ? 0 : questions.count,
        max: proActive ? null : FREE_PLAN.maxQuestions,
        remaining: proActive ? null : questions.remaining,
      },
      credits: {
        balance:         credits.balance,
        lifetime_earned: credits.lifetime_earned,
        lifetime_spent:  credits.lifetime_spent,
      },
    });
  } catch (err) {
    console.error("[/api/usage] Unhandled error:", err);
    return NextResponse.json({ error: "Failed to load usage" }, { status: 500 });
  }
}
