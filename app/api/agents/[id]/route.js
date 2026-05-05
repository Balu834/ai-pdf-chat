import { NextResponse } from "next/server";
import { createClient as createSessionClient } from "@/lib/supabase-server-client";
import { getAdminClient } from "@/lib/admin-client";
import { TOOLS } from "@/lib/tools";

async function getUser() {
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function getAgent(id, userId) {
  const { data } = await getAdminClient()
    .from("agents")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function GET(req, { params }) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const agent = await getAgent(params.id, user.id);
    if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: runs } = await getAdminClient()
      .from("agent_runs")
      .select("id, status, created_at, input, output, tool_calls")
      .eq("agent_id", params.id)
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({ agent, runs: runs ?? [] });
  } catch (err) {
    console.error("[agents/[id] GET]", err.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const agent = await getAgent(params.id, user.id);
    if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const updates = {};
    if (body.name !== undefined)         updates.name         = body.name.trim();
    if (body.role !== undefined)         updates.role         = body.role.trim();
    if (body.instructions !== undefined) updates.instructions = body.instructions.trim();
    if (body.is_active !== undefined)    updates.is_active    = Boolean(body.is_active);
    if (body.tools !== undefined)        updates.tools        = body.tools.filter((t) => t in TOOLS);
    updates.updated_at = new Date().toISOString();

    const { data, error } = await getAdminClient()
      .from("agents")
      .update(updates)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select()
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data)  return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ agent: data });
  } catch (err) {
    console.error("[agents/[id] PUT]", err.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const agent = await getAgent(params.id, user.id);
    if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { error } = await getAdminClient()
      .from("agents")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("[agents/[id] DELETE]", err.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
