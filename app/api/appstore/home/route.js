/**
 * GET /api/appstore/home
 * Returns all homepage sections in a single round-trip:
 *   featured, trending, top_rated, new_releases, recommendations
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { getAdminClient } from "@/lib/admin-client";
import { getUserContext, annotateItems } from "@/lib/appstore";

async function getUser() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

const SECTION_LIMIT = 8;

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sb = getAdminClient();

    const [
      { data: featured },
      { data: trending },
      { data: topRated },
      { data: newReleases },
      { data: recRows },
      ctx,
    ] = await Promise.all([
      sb.from("app_store_view")
        .select("*")
        .eq("is_featured", true)
        .order("featured_order", { ascending: true })
        .order("ranking_score",   { ascending: false })
        .limit(6),

      sb.from("app_store_view")
        .select("*")
        .order("recent_installs_24h", { ascending: false })
        .order("ranking_score",        { ascending: false })
        .limit(SECTION_LIMIT),

      sb.from("app_store_view")
        .select("*")
        .gt("review_count", 0)
        .order("avg_rating",    { ascending: false })
        .order("install_count", { ascending: false })
        .limit(SECTION_LIMIT),

      sb.from("app_store_view")
        .select("*")
        .gte("created_at", new Date(Date.now() - 30 * 86400_000).toISOString())
        .order("created_at",   { ascending: false })
        .order("install_count", { ascending: false })
        .limit(SECTION_LIMIT),

      sb.rpc("get_app_recommendations", { p_user_id: user.id, p_limit: SECTION_LIMIT }),

      getUserContext(sb, user.id),
    ]);

    const { installedKeys, favKeys } = ctx;
    const ann = (list) => annotateItems(list ?? [], installedKeys, favKeys);

    return NextResponse.json({
      featured:        ann(featured),
      trending:        ann(trending),
      top_rated:       ann(topRated),
      new_releases:    ann(newReleases),
      recommendations: ann(recRows),
    });
  } catch (err) {
    console.error("[appstore/home GET]", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
