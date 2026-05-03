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

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await adminClient()
    .from("agents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ agents: data ?? [] });
}

export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, role, instructions, tools: agentTools = [] } = body;

  if (!name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const validTools = agentTools.filter((t) => t in TOOLS);

  const { data, error } = await adminClient()
    .from("agents")
    .insert({
      user_id: user.id,
      name: name.trim(),
      role: role?.trim() || "General Assistant",
      instructions: instructions?.trim() || "",
      tools: validTools,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ agent: data }, { status: 201 });
}
