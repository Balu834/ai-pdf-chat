import { getUserPlan } from "@/lib/user-plan";

export const FREE_PLAN = {
  maxPdfs: 5,
  maxQuestionsPerDay: 20,
};

export async function checkPdfLimit(supabase, userId) {
  try {
    const { plan } = await getUserPlan(userId);
    if (plan === "pro") return { count: 0, exceeded: false, remaining: Infinity, plan };

    const { count, error } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) {
      console.warn("[limits] checkPdfLimit count error:", error.message);
      return { count: 0, exceeded: false, remaining: FREE_PLAN.maxPdfs, plan };
    }

    const safeCount = count ?? 0;
    const exceeded = safeCount >= FREE_PLAN.maxPdfs;
    return { count: safeCount, exceeded, remaining: Math.max(0, FREE_PLAN.maxPdfs - safeCount), plan };
  } catch (err) {
    console.warn("[limits] checkPdfLimit threw:", err.message);
    return { count: 0, exceeded: false, remaining: FREE_PLAN.maxPdfs, plan: "free" };
  }
}

export async function checkQuestionLimit(supabase, userId) {
  try {
    const { plan } = await getUserPlan(userId);
    if (plan === "pro") return { count: 0, exceeded: false, remaining: Infinity, plan };

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from("question_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfDay.toISOString());

    if (error) {
      console.warn("[limits] checkQuestionLimit count error:", error.message);
      return { count: 0, exceeded: false, remaining: FREE_PLAN.maxQuestionsPerDay, plan };
    }

    const safeCount = count ?? 0;
    const exceeded = safeCount >= FREE_PLAN.maxQuestionsPerDay;
    return { count: safeCount, exceeded, remaining: Math.max(0, FREE_PLAN.maxQuestionsPerDay - safeCount), plan };
  } catch (err) {
    console.warn("[limits] checkQuestionLimit threw:", err.message);
    return { count: 0, exceeded: false, remaining: FREE_PLAN.maxQuestionsPerDay, plan: "free" };
  }
}

export async function recordQuestion(supabase, userId) {
  try {
    const { error } = await supabase.from("question_usage").insert([{ user_id: userId }]);
    if (error) console.warn("[limits] recordQuestion error:", error.message);
  } catch (err) {
    console.warn("[limits] recordQuestion threw:", err.message);
  }
}
