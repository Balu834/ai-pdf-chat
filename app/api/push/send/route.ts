import { NextResponse } from "next/server";
import { sendPushToUser, RETENTION_NOTIFICATIONS, PushPayload } from "@/lib/push";

/**
 * POST /api/push/send
 *
 * Internal-only endpoint — protected by CRON_SECRET.
 * Used by admin tools and the retention cron to trigger push notifications.
 *
 * Body:
 *   userId    — target user UUID
 *   template  — key of RETENTION_NOTIFICATIONS (optional)
 *   title     — custom title  (used when template is absent)
 *   body      — custom body
 *   url       — click destination (default: /dashboard)
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, template, title, body, url } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    let payload: PushPayload;

    if (template && template in RETENTION_NOTIFICATIONS) {
      payload = RETENTION_NOTIFICATIONS[template as keyof typeof RETENTION_NOTIFICATIONS]();
    } else {
      if (!title || !body) {
        return NextResponse.json({ error: "title and body required when template is absent" }, { status: 400 });
      }
      payload = { title, body, url: url ?? "/dashboard" };
    }

    await sendPushToUser(userId, payload);
    console.log(`[push/send] ✅ Sent "${payload.title}" to user ${userId}`);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[push/send]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
