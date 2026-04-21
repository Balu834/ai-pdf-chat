/**
 * lib/whatsapp.ts
 *
 * WhatsApp messages via Meta WhatsApp Business Cloud API.
 * Uses native fetch — no npm package required.
 *
 * Setup (one-time):
 *   1. Create a Meta Business account at business.facebook.com
 *   2. Add a WhatsApp Business app at developers.facebook.com
 *   3. Get a permanent access token (System User token — NOT a temporary one)
 *   4. Note your Phone Number ID from the WhatsApp dashboard
 *
 * Env vars required:
 *   WHATSAPP_ACCESS_TOKEN    — System User permanent access token
 *   WHATSAPP_PHONE_NUMBER_ID — Your sending phone number's ID (not the number itself)
 *
 * Phone number format for recipients: E.164 — e.g. "+919876543210"
 *
 * All functions are non-throwing — failed sends never crash a request.
 */

const API_VERSION = "v19.0";
const BASE_URL    = `https://graph.facebook.com/${API_VERSION}`;

interface WhatsAppTextPayload {
  phone:   string;   // E.164 format: +919876543210
  message: string;
}

async function sendWhatsApp({ phone, message }: WhatsAppTextPayload): Promise<void> {
  const token   = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    console.warn("[whatsapp] WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set — skipping to", phone);
    return;
  }

  // Normalize: strip spaces and ensure + prefix
  const to = phone.replace(/\s/g, "").replace(/^00/, "+");

  try {
    const res = await fetch(`${BASE_URL}/${phoneId}/messages`, {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type:    "individual",
        to,
        type:              "text",
        text: { body: message, preview_url: false },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[whatsapp] API error:", res.status, JSON.stringify(err));
    } else {
      const data = await res.json();
      console.log("[whatsapp] Sent to", to, "| msg_id:", data?.messages?.[0]?.id);
    }
  } catch (e: any) {
    console.error("[whatsapp] fetch threw:", e.message);
  }
}

// ─── Retention message templates ─────────────────────────────────────────────

const APP = process.env.NEXT_PUBLIC_APP_URL || "https://intellixy.vercel.app";

export async function sendWAOnboardingReminder(phone: string, name?: string): Promise<void> {
  const n = name || "there";
  await sendWhatsApp({
    phone,
    message:
      `Hi ${n} 👋 You signed up for Intellixy but haven't uploaded a PDF yet!\n\n` +
      `Upload any PDF and get instant AI answers, summaries, and insights in seconds.\n\n` +
      `👉 ${APP}/dashboard`,
  });
}

export async function sendWAActivationNudge(phone: string, name?: string): Promise<void> {
  const n = name || "there";
  await sendWhatsApp({
    phone,
    message:
      `Hey ${n} 📄 Your PDF is uploaded and ready on Intellixy!\n\n` +
      `Ask it anything — try "Summarise this" or "What are the key points?"\n\n` +
      `👉 ${APP}/dashboard`,
  });
}

export async function sendWAInactiveReminder(phone: string, name?: string): Promise<void> {
  const n = name || "there";
  await sendWhatsApp({
    phone,
    message:
      `Hi ${n} 👀 You still have PDFs waiting on Intellixy!\n\n` +
      `Come back and get instant answers from your documents.\n\n` +
      `👉 ${APP}/dashboard`,
  });
}

export async function sendWALimitReached(phone: string, name?: string): Promise<void> {
  const n = name || "there";
  await sendWhatsApp({
    phone,
    message:
      `Hey ${n} ⚡ You've hit your free plan limit on Intellixy!\n\n` +
      `Upgrade to Pro for unlimited PDFs + unlimited questions.\n` +
      `Only ₹299/month. Cancel anytime.\n\n` +
      `👉 ${APP}/dashboard?view=billing`,
  });
}

export async function sendWAPaymentSuccess(phone: string, name?: string): Promise<void> {
  const n = name || "there";
  await sendWhatsApp({
    phone,
    message:
      `Hi ${n} 🎉 Welcome to Intellixy Pro!\n\n` +
      `Unlimited PDFs, unlimited questions — everything is now unlocked.\n\n` +
      `👉 ${APP}/dashboard`,
  });
}
