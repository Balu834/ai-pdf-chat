import { isProActive } from "@/lib/user-plan";
import { getAdminClient } from "@/lib/admin-client";

export const FREE_PLAN = {
  maxPdfs: 3,      // lifetime — enough to try the product, creates PDF-limit upsell
  maxQuestions: 5, // lifetime — 1 auto-summary + 4 questions → strong paywall trigger
  maxStudySets: 5, // lifetime — flashcard sets + quizzes combined
};

// ── Count PDFs directly from documents table (always accurate) ───────────
// Deliberately NOT using user_stats.total_pdfs — that counter can drift if
// the increment RPC fails or if documents are deleted.
export async function checkPdfLimit(supabase, userId) {
  try {
    const proActive = await isProActive(userId);
    if (proActive) return { count: 0, exceeded: false, remaining: Infinity, plan: "pro" };

    const { count, error } = await getAdminClient()
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) {
      console.warn("[limits] checkPdfLimit error:", error.message);
      // Fail open so a DB hiccup never locks out a legitimate user.
      return { count: 0, exceeded: false, remaining: FREE_PLAN.maxPdfs, plan: "free" };
    }

    const actual = count ?? 0;
    const exceeded = actual >= FREE_PLAN.maxPdfs;
    return {
      count:     actual,
      exceeded,
      remaining: Math.max(0, FREE_PLAN.maxPdfs - actual),
      plan:      "free",
    };
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

    const { data, error } = await getAdminClient()
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
    const { error } = await getAdminClient().rpc("increment_total_questions", { p_user_id: userId });
    if (error) console.warn("[limits] recordQuestion error:", error.message);
  } catch (err) {
    console.warn("[limits] recordQuestion threw:", err.message);
  }
}

// ── Study sets (flashcards + quizzes) ─────────────────────────────────────
// Counted in the auth user's app_metadata: only the service role can write it,
// so a client can't reset its own counter.
export const STUDY_LIMIT_MESSAGE =
  `Free plan includes ${FREE_PLAN.maxStudySets} flashcard sets and quizzes. Upgrade to Pro for unlimited.`;

export async function checkStudyLimit(userId) {
  try {
    const proActive = await isProActive(userId);
    if (proActive) return { count: 0, exceeded: false, remaining: Infinity, plan: "pro" };

    const { data, error } = await getAdminClient().auth.admin.getUserById(userId);
    if (error) {
      console.warn("[limits] checkStudyLimit error:", error.message);
      return { count: 0, exceeded: false, remaining: FREE_PLAN.maxStudySets, plan: "free" };
    }

    const count = Number(data?.user?.app_metadata?.study_sets) || 0;
    const exceeded = count >= FREE_PLAN.maxStudySets;
    return { count, exceeded, remaining: Math.max(0, FREE_PLAN.maxStudySets - count), plan: "free" };
  } catch (err) {
    console.warn("[limits] checkStudyLimit threw:", err.message);
    return { count: 0, exceeded: false, remaining: FREE_PLAN.maxStudySets, plan: "free" };
  }
}

// Call only after a set was generated successfully. `count` is the value
// checkStudyLimit returned for this request.
export async function recordStudySet(userId, count) {
  try {
    const { error } = await getAdminClient().auth.admin.updateUserById(userId, {
      app_metadata: { study_sets: count + 1 },
    });
    if (error) console.warn("[limits] recordStudySet error:", error.message);
  } catch (err) {
    console.warn("[limits] recordStudySet threw:", err.message);
  }
}

// ── Atomically increment total_pdfs via RPC ───────────────────────────────
export async function recordPdfUpload(userId) {
  try {
    const { error } = await getAdminClient().rpc("increment_total_pdfs", { p_user_id: userId });
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
