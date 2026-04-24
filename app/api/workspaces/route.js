import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { requireWorkspaceMember } from "@/lib/workspace";

/* GET → list all workspaces the authenticated user belongs to */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json([], { status: 401 });

    const { data, error } = await supabase
      .from("workspace_members")
      .select(`
        role,
        joined_at,
        workspace:workspace_id (
          id, name, owner_id, created_at
        )
      `)
      .eq("user_id", user.id)
      .order("joined_at", { ascending: false });

    if (error) {
      console.warn("[workspaces GET]", error.message);
      return NextResponse.json([]);
    }

    const workspaces = (data || [])
      .filter((m) => m.workspace)
      .map((m) => ({ ...m.workspace, role: m.role, joinedAt: m.joined_at }));

    return NextResponse.json(workspaces);
  } catch (err) {
    console.error("[workspaces GET]", err.message);
    return NextResponse.json([]);
  }
}

/* POST  { name }  → create workspace; creator becomes owner */
export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const { data: workspace, error: wsErr } = await supabase
      .from("workspaces")
      .insert({ name: name.trim(), owner_id: user.id, slug: `${slug}-${Date.now().toString(36)}` })
      .select()
      .single();

    if (wsErr) {
      console.error("[workspaces POST]", wsErr.message);
      return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 });
    }

    // Add creator as owner member
    await supabase.from("workspace_members").insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: "owner",
    });

    return NextResponse.json({ ...workspace, role: "owner" }, { status: 201 });
  } catch (err) {
    console.error("[workspaces POST]", err.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
