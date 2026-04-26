import { NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { admin, getUserContext, annotateItems } from "@/lib/appstore";

async function getUser() {
  const sb = createServerComponentClient({ cookies });
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

export async function GET(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(20, parseInt(searchParams.get("limit") ?? "8"));

  const sb = admin();

  const [{ data: recs, error }, ctx] = await Promise.all([
    sb.rpc("get_app_recommendations", { p_user_id: user.id, p_limit: limit }),
    getUserContext(sb, user.id),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    recommendations: annotateItems(recs ?? [], ctx.installedKeys, ctx.favKeys),
  });
}
