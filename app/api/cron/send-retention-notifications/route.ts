import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPushToUser, RETENTION_NOTIFICATIONS } from "@/lib/push";

/**
 * GET /api/cron/send-retention-notifications
 *
 * Runs daily at 10 AM IST (04:30 UTC) via Vercel Cron.
 * Add to vercel.json:
 *   { "path": "/api/cron/send-retention-notifications", "schedule": "30 4 * * *" }
 *
 * Three retention signals:
 *   1. Inactive ≥ 24h and has documents     → inactiveReminder
 *   2. Has documents but 0 questions asked  → uploadNoChatReminder
 *   3. Free user who has hit PDF or Q limit → limitReached
 */

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const LIMITS = { pdfs: 3, questions: 5 };

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const stats = { inactive: 0, uploadNoChat: 0, limitReached: 0, errors: [] as string[] };

  // ── 1. Users who subscribed to push but haven't visited in 24h ──────────
  const { data: inactiveUsers } = await admin
    .from("push_subscriptions")
    .select("user_id")
    .lt("last_used_at", cutoff24h);

  for (const row of inactiveUsers ?? []) {
    // Only send if they have at least one document (meaningful content waiting)
    const { count } = await admin
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", row.user_id);

    if ((count ?? 0) > 0) {
      await sendPushToUser(row.user_id, RETENTION_NOTIFICATIONS.inactiveReminder());
      stats.inactive++;
    }
  }

  // ── 2. Free users with docs but 0 questions ──────────────────────────────
  const { data: uploadNoChat } = await admin
    .from("user_stats")
    .select("user_id, total_questions")
    .eq("total_questions", 0);

  for (const row of uploadNoChat ?? []) {
    const { count } = await admin
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", row.user_id);

    if ((count ?? 0) > 0) {
      await sendPushToUser(row.user_id, RETENTION_NOTIFICATIONS.uploadNoChatReminder());
      stats.uploadNoChat++;
    }
  }

  // ── 3. Free users who hit their limit ────────────────────────────────────
  const { data: freeUsers } = await admin
    .from("user_plans")
    .select("user_id")
    .eq("plan", "free");

  for (const row of freeUsers ?? []) {
    const [{ count: pdfCount }, { data: statsRow }] = await Promise.all([
      admin.from("documents").select("id", { count: "exact", head: true }).eq("user_id", row.user_id),
      admin.from("user_stats").select("total_questions").eq("user_id", row.user_id).maybeSingle(),
    ]);

    const atLimit =
      (pdfCount ?? 0) >= LIMITS.pdfs ||
      (statsRow?.total_questions ?? 0) >= LIMITS.questions;

    if (atLimit) {
      await sendPushToUser(row.user_id, RETENTION_NOTIFICATIONS.limitReached());
      stats.limitReached++;
    }
  }

  console.log("[cron/retention] ✅", JSON.stringify(stats));
  return NextResponse.json({ ok: true, ran_at: now.toISOString(), ...stats });
}
