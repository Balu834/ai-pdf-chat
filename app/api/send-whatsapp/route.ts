import { NextResponse } from "next/server";
import {
  sendWAOnboardingReminder,
  sendWAActivationNudge,
  sendWAInactiveReminder,
  sendWALimitReached,
  sendWAPaymentSuccess,
} from "@/lib/whatsapp";

/**
 * POST /api/send-whatsapp
 *
 * Internal endpoint — protected by CRON_SECRET.
 *
 * Body:
 *   phone      string  — E.164 format: +919876543210
 *   template   string  — one of the template keys below
 *   name?      string  — recipient display name
 */

const TEMPLATES = {
  onboarding_reminder: (phone: string, name?: string) => sendWAOnboardingReminder(phone, name),
  activation_nudge:    (phone: string, name?: string) => sendWAActivationNudge(phone, name),
  inactive_reminder:   (phone: string, name?: string) => sendWAInactiveReminder(phone, name),
  limit_reached:       (phone: string, name?: string) => sendWALimitReached(phone, name),
  payment_success:     (phone: string, name?: string) => sendWAPaymentSuccess(phone, name),
} as const;

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { phone, template, name } = await request.json();

    if (!phone || !template) {
      return NextResponse.json({ error: "phone and template are required" }, { status: 400 });
    }

    if (!(template in TEMPLATES)) {
      return NextResponse.json(
        { error: `Unknown template "${template}". Valid: ${Object.keys(TEMPLATES).join(", ")}` },
        { status: 400 }
      );
    }

    await TEMPLATES[template as keyof typeof TEMPLATES](phone, name);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[send-whatsapp]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
