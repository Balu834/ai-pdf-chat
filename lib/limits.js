import { isProActive } from "@/lib/user-plan";
import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS, safe for server-only use
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const FREE_PLAN = {
  maxPdfs: 5,       // lifetime total
  maxQuestions: 10, // lifetime total
};

// ── Read lifetime PDF count from user_stats ───────────────────────────────
export async function checkPdfLimit(supabase, userId) {
  try {
    const proActive = await isProActive(userId);
    if (proActive) return { count: 0, exceeded: false, remaining: Infinity, plan: "pro" };

    const { data, error } = await admin
      .from("user_stats")
      .select("total_pdfs")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.warn("[limits] checkPdfLimit error:", error.message);
      return { count: 0, exceeded: false, remaining: FREE_PLAN.maxPdfs, plan: "free" };
    }

    const count = data?.total_pdfs ?? 0;
    const exceeded = count >= FREE_PLAN.maxPdfs;
    return { count, exceeded, remaining: Math.max(0, FREE_PLAN.maxPdfs - count), plan: "free" };
  } catch (err) {
    console.warn("[limits] checkPdfLimit threw:", err.message);
    return { count: 0, exceeded: false, remaining: FREE_PLAN.maxPdfs, plan: "free" };
  }
}

// ── Read lifetime question count from user_stats ──────────────────────────
export async function checkQuestionLimit(supabase, userId) {
  try {
    const proActive = await isProActive(userId);
    if (proActive) return { count: 0, exceeded: false, remaining: Infinity, plan: "pro" };

    const { data, error } = await admin
      .from("user_stats")
      .select("total_questions")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.warn("[limits] checkQuestionLimit error:", error.message);
      return { count: 0, exceeded: false, remaining: FREE_PLAN.maxQuestions, plan: "free" };
    }

    const count = data?.total_questions ?? 0;
    const exceeded = count >= FREE_PLAN.maxQuestions;
    return { count, exceeded, remaining: Math.max(0, FREE_PLAN.maxQuestions - count), plan: "free" };
  } catch (err) {
    console.warn("[limits] checkQuestionLimit threw:", err.message);
    return { count: 0, exceeded: false, remaining: FREE_PLAN.maxQuestions, plan: "free" };
  }
}

// ── Atomically increment total_questions via RPC ──────────────────────────
export async function recordQuestion(supabase, userId) {
  try {
    const { error } = await admin.rpc("increment_total_questions", { p_user_id: userId });
    if (error) console.warn("[limits] recordQuestion error:", error.message);
  } catch (err) {
    console.warn("[limits] recordQuestion threw:", err.message);
  }
}

// ── Atomically increment total_pdfs via RPC ───────────────────────────────
export async function recordPdfUpload(userId) {
  try {
    const { error } = await admin.rpc("increment_total_pdfs", { p_user_id: userId });
    if (error) console.warn("[limits] recordPdfUpload error:", error.message);
  } catch (err) {
    console.warn("[limits] recordPdfUpload threw:", err.message);
  }
}

// ── Pro-only gate for PDF deletion ───────────────────────────────────────
export async function canDeletePdf(userId) {
  try {
    return await isProActive(userId);
  } catch {
    return false;
  }
}
