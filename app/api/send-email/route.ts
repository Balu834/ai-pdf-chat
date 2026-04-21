import { NextResponse } from "next/server";
import {
  sendWelcomeEmail,
  sendOnboardingReminderEmail,
  sendActivationNudgeEmail,
  sendInactiveReminderEmail,
  sendLimitReachedEmail,
  sendFollowUpEmail,
  sendPaymentSuccessEmail,
  sendExpiryWarningEmail,
} from "@/lib/email";

/**
 * POST /api/send-email
 *
 * Internal endpoint — protected by CRON_SECRET.
 * Accepts a template name + required variables instead of raw HTML,
 * so callers never need to construct email content themselves.
 *
 * Body:
 *   to         string  — recipient email
 *   template   string  — one of the template keys below
 *   name?      string  — display name
 *   ...vars    any     — template-specific variables
 */

const TEMPLATES = {
  welcome:              (to: string, v: any) => sendWelcomeEmail(to, v.name),
  onboarding_reminder:  (to: string, v: any) => sendOnboardingReminderEmail(to, v.name),
  activation_nudge:     (to: string, v: any) => sendActivationNudgeEmail(to, v.name, v.pdfName),
  inactive_reminder:    (to: string, v: any) => sendInactiveReminderEmail(to, v.name, v.pdfCount),
  limit_reached:        (to: string, v: any) => sendLimitReachedEmail(to, v.name, v.type),
  followup_48h:         (to: string, v: any) => sendFollowUpEmail(to, v.name),
  payment_success:      (to: string, v: any) => sendPaymentSuccessEmail(to, v.amountPaise ?? 29900, v.expiresAt),
  expiry_warning:       (to: string, v: any) => sendExpiryWarningEmail(to, v.expiresAt),
} as const;

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { to, template, ...vars } = body;

    if (!to || !template) {
      return NextResponse.json({ error: "to and template are required" }, { status: 400 });
    }

    if (!(template in TEMPLATES)) {
      return NextResponse.json(
        { error: `Unknown template "${template}". Valid: ${Object.keys(TEMPLATES).join(", ")}` },
        { status: 400 }
      );
    }

    await TEMPLATES[template as keyof typeof TEMPLATES](to, vars);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[send-email]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
