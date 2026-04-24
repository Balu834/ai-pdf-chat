import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { requireWorkspaceMember } from "@/lib/workspace";

/* PATCH { name }  → rename workspace (owner only) */
export async function PATCH(req, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await requireWorkspaceMember(id, user.id, "owner");

    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

    const { data, error } = await supabase
      .from("workspaces")
      .update({ name: name.trim() })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

/* DELETE → delete workspace + all members/invites (owner only) */
export async function DELETE(req, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await requireWorkspaceMember(id, user.id, "owner");

    const { error } = await supabase
      .from("workspaces")
      .delete()
      .eq("id", id)
      .eq("owner_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
