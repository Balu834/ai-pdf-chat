/**
 * DEPRECATED — kept only for backwards compatibility with any Razorpay dashboard
 * entries that still point to this path.
 *
 * The canonical, fully-featured webhook handler lives at:
 *   /api/razorpay/webhook
 *
 * Forward the raw request there so we don't duplicate logic.
 */
import { NextResponse } from "next/server";

export async function POST(request) {
  const body      = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";

  const target = new URL("/api/razorpay/webhook", request.url);

  const res = await fetch(target.toString(), {
    method:  "POST",
    headers: {
      "content-type":          "application/json",
      "x-razorpay-signature":  signature,
    },
    body,
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
