/**
 * GET /api/admin/appstore
 * Returns platform-wide App Store analytics.
 * Protected by ADMIN_SECRET header.
 */
import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-client";

export async function GET(req) {
  try {
    const secret = req.headers.get("x-admin-secret");
    if (!secret || secret !== process.env.ADMIN_SECRET)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const days = Math.min(90, Math.max(1, parseInt(searchParams.get("days") ?? "30")));

    const sb = getAdminClient();
    const { data, error } = await sb.rpc("get_appstore_analytics", { p_days: days });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ analytics: data, period_days: days });
  } catch (err) {
    console.error("[admin/appstore GET]", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
