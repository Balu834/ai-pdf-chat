import webpush, { PushSubscription, SendResult } from "web-push";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

let vapidInitialized = false;
function ensureVapid() {
  if (vapidInitialized) return;
  const pub  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) throw new Error("Missing VAPID keys — set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY");
  webpush.setVapidDetails("mailto:support@intellixy.vercel.app", pub, priv);
  vapidInitialized = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;       // where clicking the notification goes
  icon?: string;
  badge?: string;
  tag?: string;       // deduplicates: same tag replaces the previous notification
}

/** Send a push notification to a single subscription endpoint. */
export async function sendPush(
  sub: PushSubscription,
  payload: PushPayload
): Promise<SendResult | null> {
  ensureVapid();
  try {
    return await webpush.sendNotification(sub, JSON.stringify(payload));
  } catch (err: any) {
    // 410 Gone = subscription expired/revoked — safe to delete from DB
    if (err.statusCode === 410) {
      await admin
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", sub.endpoint);
      console.log("[push] Removed expired subscription:", sub.endpoint.slice(-20));
    } else {
      console.warn("[push] sendNotification failed:", err.statusCode, err.message);
    }
    return null;
  }
}

/** Send a push notification to every device a user has subscribed from. */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<void> {
  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error || !subs?.length) return;

  await Promise.allSettled(
    subs.map((row) =>
      sendPush(
        { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
        payload
      )
    )
  );
}

/** Retention notification templates. */
export const RETENTION_NOTIFICATIONS = {
  inactiveReminder: (): PushPayload => ({
    title: "Your PDFs are waiting 📄",
    body: "You still have documents ready to chat with. Come back and get answers in seconds.",
    url: "/dashboard",
    tag: "inactive-reminder",
  }),

  uploadNoChatReminder: (): PushPayload => ({
    title: "Ask your PDF anything ✨",
    body: "You uploaded a PDF but haven't chatted yet. Get instant summaries and answers now.",
    url: "/dashboard",
    tag: "upload-no-chat",
  }),

  limitReached: (): PushPayload => ({
    title: "You've hit your free limit 🚀",
    body: "Upgrade to Pro for unlimited PDFs and questions — just ₹299/month.",
    url: "/dashboard",
    tag: "limit-reached",
  }),

  successReinforcement: (): PushPayload => ({
    title: "You're on fire 🔥",
    body: "You're saving hours with Intellixy. Keep going — your PDFs have more to share.",
    url: "/dashboard",
    tag: "success",
  }),
} as const;
