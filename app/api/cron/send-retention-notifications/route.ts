import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPushToUser, RETENTION_NOTIFICATIONS } from "@/lib/push";
import {
  sendOnboardingReminderEmail,
  sendActivationNudgeEmail,
  sendInactiveReminderEmail,
  sendLimitReachedEmail,
} from "@/lib/email";
import {
  sendWAOnboardingReminder,
  sendWAActivationNudge,
  sendWAInactiveReminder,
  sendWALimitReached,
} from "@/lib/whatsapp";
import { sendIfNotOnCooldown } from "@/lib/cooldown";

/**
 * GET /api/cron/send-retention-notifications
 *
 * Runs daily at 10 AM IST (04:30 UTC) via Vercel Cron.
 * Sends email + WhatsApp + push for four retention scenarios.
 * Cooldown enforced per user per event type via notification_log table.
 *
 * Requires in vercel.json:
 *   { "path": "/api/cron/send-retention-notifications", "schedule": "30 4 * * *" }
 */

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FREE_PDF_LIMIT = 3;
const FREE_Q_LIMIT   = 5;

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now       = new Date();
  const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const cutoff1h  = new Date(now.getTime() -  1 * 60 * 60 * 1000).toISOString();

  const stats = {
    onboarding:   0,
    activation:   0,
    inactive:     0,
    limitReached: 0,
    errors:       [] as string[],
  };

  // ── Fetch all users with their plan row ──────────────────────────────────
  const { data: allUsers } = await admin
    .from("user_plans")
    .select("user_id, plan, phone, email_opt_out")
    .eq("email_opt_out", false);  // respect opt-out

  if (!allUsers?.length) {
    return NextResponse.json({ ok: true, ran_at: now.toISOString(), ...stats });
  }

  // Look up emails in batch
  const { data: authUsers } = await admin.auth.admin.listUsers();
  const emailMap = new Map(
    (authUsers?.users ?? []).map((u) => [u.id, { email: u.email, name: u.user_metadata?.full_name }])
  );

  for (const row of allUsers) {
    const { user_id, plan, phone } = row;
    const auth  = emailMap.get(user_id);
    const email = auth?.email;
    const name  = auth?.name;

    if (!email) continue;

    try {
      // ── 1. Onboarding: signed up > 1h ago, 0 documents uploaded ──────────
      const { count: docCount } = await admin
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user_id);

      const { data: planRow } = await admin
        .from("user_plans")
        .select("updated_at")
        .eq("user_id", user_id)
        .maybeSingle();

      const signedUpOver1hAgo =
        planRow?.updated_at && new Date(planRow.updated_at) < new Date(cutoff1h);

      if ((docCount ?? 0) === 0 && signedUpOver1hAgo) {
        const sent = await sendIfNotOnCooldown(user_id, "email", "onboarding_reminder", () =>
          sendOnboardingReminderEmail(email, name)
        );
        if (sent) stats.onboarding++;

        if (phone) {
          await sendIfNotOnCooldown(user_id, "whatsapp", "onboarding_reminder", () =>
            sendWAOnboardingReminder(phone, name)
          );
        }
        continue; // don't send other messages to this user today
      }

      // ── 2. Activation: has docs but 0 questions ───────────────────────────
      const { data: statsRow } = await admin
        .from("user_stats")
        .select("total_questions")
        .eq("user_id", user_id)
        .maybeSingle();

      if ((docCount ?? 0) > 0 && (statsRow?.total_questions ?? 0) === 0) {
        const { data: firstDoc } = await admin
          .from("documents")
          .select("file_name")
          .eq("user_id", user_id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        const sent = await sendIfNotOnCooldown(user_id, "email", "activation_nudge", () =>
          sendActivationNudgeEmail(email, name, firstDoc?.file_name)
        );
        if (sent) stats.activation++;

        if (phone) {
          await sendIfNotOnCooldown(user_id, "whatsapp", "activation_nudge", () =>
            sendWAActivationNudge(phone, name)
          );
        }

        await sendIfNotOnCooldown(user_id, "push", "activation_nudge", () =>
          sendPushToUser(user_id, RETENTION_NOTIFICATIONS.uploadNoChatReminder())
        );
        continue;
      }

      // ── 3. Inactive 24h: has docs, had activity, but not in 24h ──────────
      const { data: latestSub } = await admin
        .from("push_subscriptions")
        .select("last_used_at")
        .eq("user_id", user_id)
        .order("last_used_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (
        (docCount ?? 0) > 0 &&
        latestSub?.last_used_at &&
        new Date(latestSub.last_used_at) < new Date(cutoff24h)
      ) {
        const sent = await sendIfNotOnCooldown(user_id, "email", "inactive_reminder", () =>
          sendInactiveReminderEmail(email, name, docCount ?? 1)
        );
        if (sent) stats.inactive++;

        if (phone) {
          await sendIfNotOnCooldown(user_id, "whatsapp", "inactive_reminder", () =>
            sendWAInactiveReminder(phone, name)
          );
        }

        await sendIfNotOnCooldown(user_id, "push", "inactive_reminder", () =>
          sendPushToUser(user_id, RETENTION_NOTIFICATIONS.inactiveReminder())
        );
        continue;
      }

      // ── 4. Limit reached: free user at PDF or question cap ────────────────
      if (plan === "free") {
        const atPdfLimit  = (docCount ?? 0) >= FREE_PDF_LIMIT;
        const atQLimit    = (statsRow?.total_questions ?? 0) >= FREE_Q_LIMIT;

        if (atPdfLimit || atQLimit) {
          const limitType = atPdfLimit ? "pdfs" : "questions";
          const sent = await sendIfNotOnCooldown(user_id, "email", "limit_reached", () =>
            sendLimitReachedEmail(email, name, limitType)
          );
          if (sent) stats.limitReached++;

          if (phone) {
            await sendIfNotOnCooldown(user_id, "whatsapp", "limit_reached", () =>
              sendWALimitReached(phone, name)
            );
          }

          await sendIfNotOnCooldown(user_id, "push", "limit_reached", () =>
            sendPushToUser(user_id, RETENTION_NOTIFICATIONS.limitReached())
          );
        }
      }
    } catch (err: any) {
      console.error(`[retention-cron] Error for user ${user_id}:`, err.message);
      stats.errors.push(`${user_id}: ${err.message}`);
    }
  }

  console.log("[retention-cron] ✅", JSON.stringify(stats));
  return NextResponse.json({ ok: true, ran_at: now.toISOString(), ...stats });
}
