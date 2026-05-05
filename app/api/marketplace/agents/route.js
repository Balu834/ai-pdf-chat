import { NextResponse } from "next/server";
import { createClient as createSessionClient } from "@/lib/supabase-server-client";
import { getAdminClient } from "@/lib/admin-client";

async function getUserId() {
  const sb = await createSessionClient();
  const { data: { user } } = await sb.auth.getUser();
  return user?.id ?? null;
}

export async function GET(req) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search   = searchParams.get("search")   ?? "";
    const category = searchParams.get("category") ?? "all";
    const sort     = searchParams.get("sort")      ?? "popular";

    let q = getAdminClient()
      .from("marketplace_agents")
      .select(`
        id, name, description, category, role, instructions, tools,
        install_count, avg_rating, review_count, created_at,
        creator_id,
        creator_profiles!marketplace_agents_creator_id_fkey(display_name)
      `)
      .eq("is_published", true);

    if (category !== "all") q = q.eq("category", category);
    if (search)             q = q.or(`name.ilike.%${search}%,description.ilike.%${search}%`);

    const orderCol = sort === "rating" ? "avg_rating" : sort === "new" ? "created_at" : "install_count";
    q = q.order(orderCol, { ascending: false }).limit(100);

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Flag which ones the user already has installed
    const { data: installed } = await getAdminClient()
      .from("agents")
      .select("source_marketplace_agent_id")
      .eq("user_id", userId)
      .not("source_marketplace_agent_id", "is", null);

    const installedSet = new Set((installed ?? []).map((r) => r.source_marketplace_agent_id));

    const agents = (data ?? []).map((a) => ({
      ...a,
      creator_name: a.creator_profiles?.display_name || "Creator",
      creator_profiles: undefined,
      installed: installedSet.has(a.id),
    }));

    return NextResponse.json({ agents });
  } catch (err) {
    console.error("[marketplace/agents/route.js]", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
