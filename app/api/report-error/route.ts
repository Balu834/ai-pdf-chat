import { NextRequest, NextResponse } from "next/server";
import { sendTelegramAlert } from "@/lib/notify";
import { logErrorLimiter } from "@/lib/rate-limit";

/**
 * Telegram is called with parse_mode: "HTML", so anything interpolated into the
 * alert must be escaped. Unescaped user input lets a caller inject markup, and
 * malformed HTML makes Telegram reject the whole message — which sendTelegramAlert
 * swallows silently, so crafted input could make alerts disappear.
 */
function esc(value: unknown, maxLen = 300): string {
  return String(value ?? "")
    .slice(0, maxLen)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(req: NextRequest) {
  try {
    // This endpoint is public by design (it reports errors from logged-out users
    // too), so it is throttled per IP — otherwise anyone can flood the alert
    // channel and bury real errors in noise.
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const rl = logErrorLimiter.check(ip);
    if (!rl.ok) {
      return NextResponse.json(
        { ok: false },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const { type, message, page, userEmail, details } = await req.json();

    const emoji: Record<string, string> = {
      upload:  "📄",
      chat:    "💬",
      payment: "💳",
      auth:    "🔐",
      general: "⚠️",
    };

    // Look the icon up from the raw value, but never interpolate it unescaped.
    const icon = emoji[String(type)] ?? "⚠️";
    const time = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    const text = [
      `${icon} <b>Intellixy User Error</b>`,
      ``,
      `<b>Type:</b> ${esc(type, 40)}`,
      `<b>Page:</b> ${page ? esc(page, 200) : "unknown"}`,
      `<b>User:</b> ${userEmail ? esc(userEmail, 120) : "not logged in"}`,
      `<b>Error:</b> ${esc(message, 500)}`,
      details ? `<b>Details:</b> ${esc(details, 800)}` : null,
      ``,
      `<b>Time:</b> ${time} IST`,
    ].filter(Boolean).join("\n");

    await sendTelegramAlert(text);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
