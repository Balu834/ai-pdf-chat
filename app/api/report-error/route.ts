import { NextRequest, NextResponse } from "next/server";
import { sendTelegramAlert } from "@/lib/notify";

export async function POST(req: NextRequest) {
  try {
    const { type, message, page, userEmail, details } = await req.json();

    const emoji: Record<string, string> = {
      upload:  "📄",
      chat:    "💬",
      payment: "💳",
      auth:    "🔐",
      general: "⚠️",
    };

    const icon = emoji[type] ?? "⚠️";
    const time = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    const text = [
      `${icon} <b>Intellixy User Error</b>`,
      ``,
      `<b>Type:</b> ${type}`,
      `<b>Page:</b> ${page ?? "unknown"}`,
      `<b>User:</b> ${userEmail ?? "not logged in"}`,
      `<b>Error:</b> ${message}`,
      details ? `<b>Details:</b> ${details}` : null,
      ``,
      `<b>Time:</b> ${time} IST`,
    ].filter(Boolean).join("\n");

    await sendTelegramAlert(text);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
