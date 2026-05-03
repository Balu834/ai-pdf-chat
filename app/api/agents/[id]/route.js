import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createSessionClient } from "@/lib/supabase-server-client";
import { TOOLS } from "@/lib/tools";

const adminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

async function getUser() {
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function getAgent(id, userId) {
  const { data } = await adminClient()
    .from("agents")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  return data;
}

export async function GET(req, { params }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agent = await getAgent(params.id, user.id);
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Include recent runs
  const { data: runs } = await adminClient()
    .from("agent_runs")
    .select("id, status, created_at, input, output, tool_calls")
    .eq("agent_id", params.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({ agent, runs: runs ?? [] });
}

export async function PUT(req, { params }) {
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

  const { data, error } = await adminClient()
    .from("agents")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ agent: data });
}

export async function DELETE(req, { params }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agent = await getAgent(params.id, user.id);
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await adminClient().from("agents").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
