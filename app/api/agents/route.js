import { NextResponse } from "next/server";
import { createClient as createSessionClient } from "@/lib/supabase-server-client";
import { getAdminClient } from "@/lib/admin-client";
import { TOOLS } from "@/lib/tools";

async function getUser() {
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await getAdminClient()
      .from("agents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ agents: data ?? [] });
  } catch (err) {
    console.error("[agents GET]", err.message);
    return NextResponse.json({ agents: [] }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, role, instructions, tools: agentTools = [] } = body;

    if (!name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const validTools = agentTools.filter((t) => t in TOOLS);

    const { data, error } = await getAdminClient()
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
  } catch (err) {
    console.error("[agents POST]", err.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
