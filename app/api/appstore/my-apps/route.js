/**
 * GET /api/appstore/my-apps
 * Returns the current user's installed apps and favorites.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { getAdminClient } from "@/lib/admin-client";

async function getUser() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sb = getAdminClient();

    const { data: installedAgentRows } = await sb
      .from("agents")
      .select("id, name, source_marketplace_agent_id, created_at")
      .eq("user_id", user.id)
      .not("source_marketplace_agent_id", "is", null)
      .order("created_at", { ascending: false });

    const { data: installedTemplateRows } = await sb
      .from("workflows")
      .select("id, name, source_marketplace_template_id, created_at")
      .eq("user_id", user.id)
      .not("source_marketplace_template_id", "is", null)
      .order("created_at", { ascending: false });

    const agentIds    = (installedAgentRows    ?? []).map((r) => r.source_marketplace_agent_id);
    const templateIds = (installedTemplateRows ?? []).map((r) => r.source_marketplace_template_id);

    const [
      { data: agentDetails },
      { data: templateDetails },
      { data: favorites },
    ] = await Promise.all([
      agentIds.length > 0
        ? sb.from("marketplace_agents")
            .select("id, name, description, category, avg_rating, install_count")
            .in("id", agentIds)
        : { data: [] },
      templateIds.length > 0
        ? sb.from("marketplace_templates")
            .select("id, name, description, category, price_paise, avg_rating, install_count")
            .in("id", templateIds)
        : { data: [] },
      sb.from("app_favorites")
        .select("target_type, target_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    const agentMap    = Object.fromEntries((agentDetails    ?? []).map((a) => [a.id, a]));
    const templateMap = Object.fromEntries((templateDetails ?? []).map((t) => [t.id, t]));

    const installed = [
      ...(installedAgentRows ?? []).map((r) => ({
        type: "agent",
        user_item_id: r.id,
        marketplace_id: r.source_marketplace_agent_id,
        installed_at: r.created_at,
        ...(agentMap[r.source_marketplace_agent_id] ?? { name: r.name }),
      })),
      ...(installedTemplateRows ?? []).map((r) => ({
        type: "template",
        user_item_id: r.id,
        marketplace_id: r.source_marketplace_template_id,
        installed_at: r.created_at,
        ...(templateMap[r.source_marketplace_template_id] ?? { name: r.name }),
      })),
    ].sort((a, b) => new Date(b.installed_at) - new Date(a.installed_at));

    const favAgentIds    = (favorites ?? []).filter((f) => f.target_type === "agent")   .map((f) => f.target_id);
    const favTemplateIds = (favorites ?? []).filter((f) => f.target_type === "template").map((f) => f.target_id);

    const [{ data: favAgents }, { data: favTemplates }] = await Promise.all([
      favAgentIds.length > 0
        ? sb.from("marketplace_agents").select("id, name, description, category, avg_rating").in("id", favAgentIds)
        : { data: [] },
      favTemplateIds.length > 0
        ? sb.from("marketplace_templates").select("id, name, description, category, price_paise, avg_rating").in("id", favTemplateIds)
        : { data: [] },
    ]);

    const favAgentMap    = Object.fromEntries((favAgents    ?? []).map((a) => [a.id, a]));
    const favTemplateMap = Object.fromEntries((favTemplates ?? []).map((t) => [t.id, t]));

    const favoriteItems = (favorites ?? []).map((f) => {
      const detail = f.target_type === "agent" ? favAgentMap[f.target_id] : favTemplateMap[f.target_id];
      return detail ? { type: f.target_type, favorited_at: f.created_at, ...detail } : null;
    }).filter(Boolean);

    const { data: recentUsage } = await sb
      .from("app_usage_logs")
      .select("target_type, target_id, action, created_at")
      .eq("user_id", user.id)
      .in("action", ["run", "view"])
      .gte("created_at", new Date(Date.now() - 30 * 86400_000).toISOString())
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json({
      installed,
      favorites: favoriteItems,
      recent_activity: recentUsage ?? [],
      counts: {
        installed:  installed.length,
        favorites:  favoriteItems.length,
      },
    });
  } catch (err) {
    console.error("[appstore/my-apps GET]", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
