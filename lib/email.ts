/**
 * lib/email.ts
 *
 * Transactional email via Resend (https://resend.com).
 * Install: npm install resend
 *
 * Env vars required:
 *   RESEND_API_KEY   — from Resend dashboard → API Keys
 *   EMAIL_FROM       — e.g. "Intellixy <noreply@intellixy.vercel.app>"
 *                      Must be a verified domain/address in Resend.
 *
 * All functions are non-throwing — they log errors but never crash a request.
 * Email is always best-effort: a failed send must never block signup or payment.
 */

const FROM = process.env.EMAIL_FROM || "Intellixy <noreply@intellixy.vercel.app>";

async function sendEmail(payload: {
  to:      string;
  subject: string;
  html:    string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping email to", payload.to);
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, ...payload }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[email] Resend error:", res.status, err);
    } else {
      const data = await res.json();
      console.log("[email] Sent to", payload.to, "| id:", data.id);
    }
  } catch (e: any) {
    console.error("[email] fetch threw:", e.message);
  }
}

// ─── Welcome email on signup ──────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name?: string): Promise<void> {
  const displayName = name || to.split("@")[0];
  await sendEmail({
    to,
    subject: "Welcome to Intellixy 🎉",
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#09090f;color:#f0f0f8;border-radius:16px;">
        <div style="text-align:center;margin-bottom:28px;">
          <div style="display:inline-block;width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#7c3aed,#06b6d4);line-height:52px;font-size:28px;font-weight:900;color:white;text-align:center;">I</div>
        </div>
        <h1 style="font-size:22px;font-weight:800;margin:0 0 12px;color:#f0f0f8;">Welcome, ${displayName}!</h1>
        <p style="color:#a0a0b8;line-height:1.7;margin:0 0 20px;">You're in. Intellixy lets you chat with any PDF using AI — get instant answers, summaries, and key insights.</p>
        <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.25);border-radius:12px;padding:18px 20px;margin-bottom:24px;">
          <p style="margin:0 0 8px;font-weight:700;color:#c4b5fd;font-size:14px;">Your free plan includes:</p>
          <ul style="margin:0;padding:0 0 0 18px;color:#a0a0b8;font-size:13px;line-height:1.9;">
            <li>5 PDF uploads (lifetime)</li>
            <li>10 AI questions (lifetime)</li>
            <li>Smart Q&amp;A + summaries</li>
          </ul>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://intellixy.vercel.app"}/dashboard"
           style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;font-weight:700;font-size:14px;padding:13px 26px;border-radius:12px;text-decoration:none;">
          Open your dashboard →
        </a>
        <p style="margin-top:28px;font-size:11px;color:#555570;">You're receiving this because you signed up for Intellixy. Questions? Reply to this email.</p>
      </div>
    `,
  });
}

// ─── Payment success email ────────────────────────────────────────────────────

export async function sendPaymentSuccessEmail(
  to:          string,
  amountPaise: number,
  expiresAt:   string
): Promise<void> {
  const amount  = `₹${(amountPaise / 100).toFixed(0)}`;
  const expDate = new Date(expiresAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  await sendEmail({
    to,
    subject: "You're now Pro! ⚡ Intellixy",
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#09090f;color:#f0f0f8;border-radius:16px;">
        <div style="text-align:center;margin-bottom:28px;">
          <div style="display:inline-block;width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#7c3aed,#06b6d4);line-height:52px;font-size:28px;font-weight:900;color:white;text-align:center;">I</div>
        </div>
        <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:12px;padding:14px 18px;margin-bottom:24px;text-align:center;">
          <span style="font-size:13px;font-weight:700;color:#4ade80;">✓ Payment of ${amount} received</span>
        </div>
        <h1 style="font-size:22px;font-weight:800;margin:0 0 12px;color:#f0f0f8;">You're now on Pro 🎉</h1>
        <p style="color:#a0a0b8;line-height:1.7;margin:0 0 20px;">Unlimited PDF uploads, unlimited questions, and all Pro features are now unlocked on your account.</p>
        <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.25);border-radius:12px;padding:18px 20px;margin-bottom:24px;">
          <p style="margin:0 0 8px;font-weight:700;color:#c4b5fd;font-size:14px;">Your Pro plan:</p>
          <ul style="margin:0;padding:0 0 0 18px;color:#a0a0b8;font-size:13px;line-height:1.9;">
            <li>Unlimited PDF uploads</li>
            <li>Unlimited AI questions</li>
            <li>Priority access to new features</li>
            <li>Current period ends: <strong style="color:#f0f0f8;">${expDate}</strong></li>
          </ul>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://intellixy.vercel.app"}/dashboard"
           style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;font-weight:700;font-size:14px;padding:13px 26px;border-radius:12px;text-decoration:none;">
          Go to dashboard →
        </a>
        <p style="margin-top:28px;font-size:11px;color:#555570;">Keep this email as your receipt. Amount charged: ${amount}.</p>
      </div>
    `,
  });
}

// ─── Subscription expiry warning (7 days before) ─────────────────────────────

export async function sendExpiryWarningEmail(
  to:        string,
  expiresAt: string
): Promise<void> {
  const expDate = new Date(expiresAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  await sendEmail({
    to,
    subject: "Your Intellixy Pro plan expires soon",
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#09090f;color:#f0f0f8;border-radius:16px;">
        <h1 style="font-size:20px;font-weight:800;margin:0 0 12px;color:#f0f0f8;">Your Pro plan expires on ${expDate}</h1>
        <p style="color:#a0a0b8;line-height:1.7;margin:0 0 20px;">After that, your account will revert to the free plan (5 PDFs, 10 questions). Your existing uploads are safe.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://intellixy.vercel.app"}/dashboard?view=billing"
           style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;font-weight:700;font-size:14px;padding:13px 26px;border-radius:12px;text-decoration:none;">
          Renew Pro →
        </a>
        <p style="margin-top:28px;font-size:11px;color:#555570;">This is a courtesy reminder from Intellixy.</p>
      </div>
    `,
  });
}
