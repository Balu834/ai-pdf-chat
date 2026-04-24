/**
 * lib/email.ts
 *
 * Transactional email via Resend (https://resend.com).
 * Uses native fetch — no npm package required.
 *
 * Env vars required:
 *   RESEND_API_KEY   — from Resend dashboard → API Keys
 *   EMAIL_FROM       — e.g. "Intellixy <noreply@yourdomain.com>"
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

const APP = process.env.NEXT_PUBLIC_APP_URL || "https://intellixy.vercel.app";

// Shared header/footer blocks for consistent styling
function emailHeader() {
  return `<div style="text-align:center;margin-bottom:28px;">
    <div style="display:inline-block;width:48px;height:48px;border-radius:13px;background:linear-gradient(135deg,#7c3aed,#06b6d4);line-height:48px;font-size:26px;font-weight:900;color:white;text-align:center;">I</div>
    <p style="margin:8px 0 0;font-size:12px;font-weight:700;letter-spacing:0.12em;color:#555570;text-transform:uppercase;">Intellixy</p>
  </div>`;
}

function emailCTA(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;font-weight:700;font-size:14px;padding:13px 28px;border-radius:12px;text-decoration:none;">${label}</a>`;
}

function emailFooter() {
  return `<p style="margin-top:32px;font-size:11px;color:#3d3d55;border-top:1px solid rgba(255,255,255,0.05);padding-top:18px;">
    You're receiving this because you have an Intellixy account.
    <a href="${APP}/settings" style="color:#555570;">Manage preferences</a>
  </p>`;
}

function emailWrap(body: string) {
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#09090f;color:#f0f0f8;border-radius:16px;">
    ${emailHeader()}${body}${emailFooter()}
  </div>`;
}

// ─── Onboarding reminder (sent ~1h after signup if no PDF uploaded) ───────────

export async function sendOnboardingReminderEmail(
  to:   string,
  name?: string
): Promise<void> {
  const n = name || to.split("@")[0];
  await sendEmail({
    to,
    subject: `${n}, you haven't uploaded your first PDF yet`,
    html: emailWrap(`
      <h1 style="font-size:21px;font-weight:800;margin:0 0 12px;">One step away, ${n} 👋</h1>
      <p style="color:#a0a0b8;line-height:1.7;margin:0 0 20px;">
        You signed up but haven't uploaded a PDF yet. It takes under 10 seconds — just drop any document and start getting instant AI answers.
      </p>
      <div style="background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#c4b5fd;font-weight:600;">Works with any PDF:</p>
        <p style="margin:6px 0 0;font-size:13px;color:#a0a0b8;line-height:1.7;">Books · Research papers · Contracts · Study notes · Reports</p>
      </div>
      ${emailCTA(`${APP}/dashboard`, "Upload your first PDF →")}
    `),
  });
}

// ─── Activation nudge (uploaded PDF but sent 0 questions) ────────────────────

export async function sendActivationNudgeEmail(
  to:        string,
  name?:     string,
  pdfName?:  string
): Promise<void> {
  const n   = name    || to.split("@")[0];
  const doc = pdfName || "your PDF";
  await sendEmail({
    to,
    subject: "Ask anything from your PDF — it's ready",
    html: emailWrap(`
      <h1 style="font-size:21px;font-weight:800;margin:0 0 12px;">Your PDF is waiting, ${n} 📄</h1>
      <p style="color:#a0a0b8;line-height:1.7;margin:0 0 20px;">
        You uploaded <strong style="color:#f0f0f8;">${doc}</strong> but haven't asked it anything yet.
        Try asking for a summary, a key insight, or a specific question.
      </p>
      <div style="background:rgba(6,182,212,0.07);border:1px solid rgba(6,182,212,0.2);border-radius:12px;padding:14px 20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:12.5px;font-weight:700;color:#67e8f9;">Example questions to try:</p>
        <ul style="margin:0;padding:0 0 0 18px;color:#a0a0b8;font-size:13px;line-height:1.9;">
          <li>"Summarise this document in 3 bullet points"</li>
          <li>"What are the key takeaways?"</li>
          <li>"Explain section 2 in simple terms"</li>
        </ul>
      </div>
      ${emailCTA(`${APP}/dashboard`, "Start chatting now →")}
    `),
  });
}

// ─── Inactive reminder (no activity in 24h+) ─────────────────────────────────

export async function sendInactiveReminderEmail(
  to:       string,
  name?:    string,
  pdfCount?: number
): Promise<void> {
  const n    = name     || to.split("@")[0];
  const docs = pdfCount || 1;
  await sendEmail({
    to,
    subject: `You still have ${docs} PDF${docs > 1 ? "s" : ""} waiting`,
    html: emailWrap(`
      <h1 style="font-size:21px;font-weight:800;margin:0 0 12px;">Come back, ${n} 👀</h1>
      <p style="color:#a0a0b8;line-height:1.7;margin:0 0 20px;">
        You have <strong style="color:#f0f0f8;">${docs} PDF${docs > 1 ? "s" : ""}</strong> uploaded and ready to chat with.
        Stop reading and start asking — get the answers you need in seconds.
      </p>
      <div style="background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:12px;padding:14px 20px;margin-bottom:24px;text-align:center;">
        <p style="margin:0;font-size:32px;">📄</p>
        <p style="margin:8px 0 0;font-size:13px;color:#c4b5fd;font-weight:700;">Your documents are waiting for questions</p>
      </div>
      ${emailCTA(`${APP}/dashboard`, "Resume chatting →")}
    `),
  });
}

// ─── Limit reached — highest-conversion email ────────────────────────────────

export async function sendLimitReachedEmail(
  to:      string,
  name?:   string,
  type?:   "pdfs" | "questions"
): Promise<void> {
  const n       = name || to.split("@")[0];
  const isQs    = type === "questions";
  const subject = isQs
    ? "You've used all 5 free questions — upgrade to continue"
    : "You've uploaded all 3 free PDFs — upgrade to continue";

  await sendEmail({
    to,
    subject,
    html: emailWrap(`
      <div style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.2);border-radius:12px;padding:12px 18px;margin-bottom:20px;text-align:center;">
        <span style="font-size:13px;font-weight:700;color:#fbbf24;">⚡ You've hit your free ${isQs ? "question" : "PDF"} limit</span>
      </div>
      <h1 style="font-size:21px;font-weight:800;margin:0 0 12px;">${n}, don't stop here</h1>
      <p style="color:#a0a0b8;line-height:1.7;margin:0 0 20px;">
        You're clearly getting value from Intellixy — that's why you've hit the limit.
        Upgrade to Pro for <strong style="color:#f0f0f8;">unlimited PDFs and unlimited questions</strong>.
      </p>
      <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.25);border-radius:12px;padding:18px 20px;margin-bottom:24px;">
        <p style="margin:0 0 10px;font-weight:800;font-size:14px;color:#c4b5fd;">Pro — ₹299/month</p>
        <ul style="margin:0;padding:0 0 0 18px;color:#a0a0b8;font-size:13px;line-height:1.9;">
          <li>Unlimited PDF uploads</li>
          <li>Unlimited AI questions</li>
          <li>Cancel anytime</li>
          <li>7-day money-back guarantee</li>
        </ul>
      </div>
      ${emailCTA(`${APP}/dashboard?view=billing`, "Upgrade to Pro — ₹299/mo →")}
    `),
  });
}

// ─── Workspace invite ─────────────────────────────────────────────────────────

export async function sendWorkspaceInviteEmail(
  to:            string,
  workspaceName: string,
  inviteUrl:     string
): Promise<void> {
  await sendEmail({
    to,
    subject: `You've been invited to join ${workspaceName} on Intellixy`,
    html: emailWrap(`
      <h1 style="font-size:21px;font-weight:800;margin:0 0 12px;">You're invited! 🎉</h1>
      <p style="color:#a0a0b8;line-height:1.7;margin:0 0 20px;">
        Someone invited you to collaborate in <strong style="color:#f0f0f8;">${workspaceName}</strong> on Intellixy — the AI PDF chat platform.
      </p>
      <div style="background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#c4b5fd;font-weight:600;">What you can do in the workspace:</p>
        <ul style="margin:8px 0 0;padding:0 0 0 18px;color:#a0a0b8;font-size:13px;line-height:1.9;">
          <li>Chat with shared PDF documents</li>
          <li>Collaborate with teammates in real time</li>
          <li>Share AI insights across your team</li>
        </ul>
      </div>
      ${emailCTA(inviteUrl, "Accept invitation →")}
      <p style="margin-top:16px;font-size:12px;color:#3d3d55;">This invite link expires in 7 days. If you didn't expect this, you can ignore this email.</p>
    `),
  });
}

// ─── 48h follow-up for engaged free users ────────────────────────────────────

export async function sendFollowUpEmail(
  to:    string,
  name?: string
): Promise<void> {
  const n = name || to.split("@")[0];
  await sendEmail({
    to,
    subject: "How are you saving time with Intellixy?",
    html: emailWrap(`
      <h1 style="font-size:21px;font-weight:800;margin:0 0 12px;">Hey ${n}, how's it going? 🚀</h1>
      <p style="color:#a0a0b8;line-height:1.7;margin:0 0 20px;">
        It's been 48 hours since you joined. Thousands of students, researchers, and professionals
        use Intellixy to cut their reading time in half.
      </p>
      <div style="background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.15);border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#4ade80;">Common use cases:</p>
        <ul style="margin:0;padding:0 0 0 18px;color:#a0a0b8;font-size:13px;line-height:1.9;">
          <li>📚 Students summarising textbooks before exams</li>
          <li>⚖️ Lawyers reviewing contracts in minutes</li>
          <li>🔬 Researchers extracting insights from papers</li>
          <li>💼 Professionals digesting reports instantly</li>
        </ul>
      </div>
      <p style="color:#a0a0b8;line-height:1.7;margin:0 0 24px;">
        If you're getting value, <strong style="color:#f0f0f8;">Pro removes all limits</strong> for just ₹299/month.
      </p>
      ${emailCTA(`${APP}/dashboard`, "Open Intellixy →")}
    `),
  });
}
