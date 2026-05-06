import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { getAdminClient } from "@/lib/admin-client";
import { getUserContext, annotateItems } from "@/lib/appstore";

async function getUser() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

export async function GET(req) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = Math.min(20, parseInt(searchParams.get("limit") ?? "8"));

    const sb = getAdminClient();

    const [{ data: recs, error }, ctx] = await Promise.all([
      sb.rpc("get_app_recommendations", { p_user_id: user.id, p_limit: limit }),
      getUserContext(sb, user.id),
    ]);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      recommendations: annotateItems(recs ?? [], ctx.installedKeys, ctx.favKeys),
    });
  } catch (err) {
    console.error("[appstore/recommendations GET]", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
