import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-server-client";
import { requireWorkspaceMember, addWorkspaceMember } from "@/lib/workspace";

const admin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* GET → list workspace members with email */
export async function GET(req, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json([], { status: 401 });

    const { id } = await params;
    await requireWorkspaceMember(id, user.id);

    const { data: members, error } = await admin
      .from("workspace_members")
      .select("id, user_id, role, joined_at")
      .eq("workspace_id", id)
      .order("joined_at");

    if (error) return NextResponse.json([], { status: 500 });

    // Enrich with emails from auth.users via admin API
    const userIds = members.map((m) => m.user_id);
    const { data: { users: authUsers } } = await admin.auth.admin.listUsers({
      perPage: 200,
    });
    const emailMap = Object.fromEntries(
      (authUsers || []).filter((u) => userIds.includes(u.id)).map((u) => [u.id, u.email])
    );

    const enriched = members.map((m) => ({ ...m, email: emailMap[m.user_id] || m.user_id }));
    return NextResponse.json(enriched);
  } catch (err) {
    console.error("[members GET]", err.message);
    return NextResponse.json([], { status: 500 });
  }
}

/* PATCH { memberId, role }  → change member role (admin/owner) */
export async function PATCH(req, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const caller = await requireWorkspaceMember(id, user.id, "admin");

    const { memberId, role } = await req.json();
    if (!memberId || !["member", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid memberId or role" }, { status: 400 });
    }

    // Prevent changing owner's role
    const { data: target } = await admin
      .from("workspace_members")
      .select("role")
      .eq("id", memberId)
      .maybeSingle();
    if (target?.role === "owner") {
      return NextResponse.json({ error: "Cannot change owner's role" }, { status: 403 });
    }
    // Only owner can promote to admin
    if (role === "admin" && caller.role !== "owner") {
      return NextResponse.json({ error: "Only owners can promote to admin" }, { status: 403 });
    }

    const { data, error } = await admin
      .from("workspace_members")
      .update({ role })
      .eq("id", memberId)
      .eq("workspace_id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

/* DELETE  ?memberId=xxx  → remove member (admin/owner can remove others; any member can remove self) */
export async function DELETE(req, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    if (!memberId) return NextResponse.json({ error: "memberId required" }, { status: 400 });

    // Fetch the target member to check if it's self-removal
    const { data: target } = await admin
      .from("workspace_members")
      .select("user_id, role")
      .eq("id", memberId)
      .eq("workspace_id", id)
      .maybeSingle();

    if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    if (target.role === "owner") return NextResponse.json({ error: "Cannot remove the owner" }, { status: 403 });

    const isSelf = target.user_id === user.id;
    if (!isSelf) {
      // Only admin/owner can remove others
      await requireWorkspaceMember(id, user.id, "admin");
    }

    const { error } = await admin
      .from("workspace_members")
      .delete()
      .eq("id", memberId)
      .eq("workspace_id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
