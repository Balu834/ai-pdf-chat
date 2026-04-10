import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { checkPdfLimit, checkQuestionLimit, FREE_PLAN } from "@/lib/limits";
import { getUserPlan } from "@/lib/user-plan";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [pdfs, questions, planData] = await Promise.all([
      checkPdfLimit(supabase, user.id),
      checkQuestionLimit(supabase, user.id),
      getUserPlan(user.id),
    ]);

    const isPro = planData.plan === "pro";

    return NextResponse.json({
      email: user.email,
      plan: planData.plan,
      pdfs: {
        used: isPro ? 0 : pdfs.count,
        max: isPro ? null : FREE_PLAN.maxPdfs,
        remaining: isPro ? null : pdfs.remaining,
      },
      questions: {
        used: isPro ? 0 : questions.count,
        max: isPro ? null : FREE_PLAN.maxQuestions,
        remaining: isPro ? null : questions.remaining,
      },
    });
  } catch (err) {
    console.error("[/api/usage] Unhandled error:", err);
    return NextResponse.json({ error: "Failed to load usage" }, { status: 500 });
  }
}
