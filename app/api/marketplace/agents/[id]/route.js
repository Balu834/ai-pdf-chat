import { NextResponse } from "next/server";
import { createClient as createSessionClient } from "@/lib/supabase-server-client";
import { getAdminClient } from "@/lib/admin-client";
import { logUsage } from "@/lib/appstore";

async function getUser() {
  const sb = await createSessionClient();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

// GET /api/marketplace/agents/[id] — full detail with reviews
export async function GET(req, { params }) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sb = getAdminClient();

    const { data: agent, error } = await sb
      .from("marketplace_agents")
      .select(`
        id, name, description, category, role, instructions, tools,
        install_count, avg_rating, review_count, created_at, creator_id,
        creator_profiles!marketplace_agents_creator_id_fkey(display_name, bio)
      `)
      .eq("id", params.id)
      .eq("is_published", true)
      .maybeSingle();

    if (error || !agent) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [{ data: reviews }, { data: installed }] = await Promise.all([
      sb.from("marketplace_reviews").select("rating, review, created_at, user_id")
        .eq("target_type", "agent").eq("target_id", params.id)
        .order("created_at", { ascending: false }).limit(20),
      sb.from("agents").select("id")
        .eq("user_id", user.id)
        .eq("source_marketplace_agent_id", params.id)
        .maybeSingle(),
    ]);

    return NextResponse.json({
      agent: {
        ...agent,
        creator_name: agent.creator_profiles?.display_name || "Creator",
        creator_bio: agent.creator_profiles?.bio || "",
        creator_profiles: undefined,
        installed: !!installed,
      },
      reviews: reviews ?? [],
    });
  } catch (err) {
    console.error("[marketplace/agents/[id]/route.js GET]", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/marketplace/agents/[id] — install agent into user's account
export async function POST(req, { params }) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sb = getAdminClient();

    const { data: mktAgent } = await sb
      .from("marketplace_agents")
      .select("*")
      .eq("id", params.id)
      .eq("is_published", true)
      .maybeSingle();

    if (!mktAgent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    // Idempotent: return existing if already installed
    const { data: existing } = await sb
      .from("agents")
      .select("id")
      .eq("user_id", user.id)
      .eq("source_marketplace_agent_id", params.id)
      .maybeSingle();

    if (existing) return NextResponse.json({ installed: true, agent_id: existing.id, already_had: true });

    const { data: newAgent, error } = await sb
      .from("agents")
      .insert({
        user_id: user.id,
        name: mktAgent.name,
        role: mktAgent.role,
        instructions: mktAgent.instructions,
        tools: mktAgent.tools,
        source_marketplace_agent_id: params.id,
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Increment install counter + log usage (non-blocking)
    sb.rpc("increment_install_count", { p_type: "agent", p_id: params.id }).then(() => {});
    logUsage(sb, user.id, "agent", params.id, "install");

    return NextResponse.json({ installed: true, agent_id: newAgent.id });
  } catch (err) {
    console.error("[marketplace/agents/[id]/route.js POST]", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
