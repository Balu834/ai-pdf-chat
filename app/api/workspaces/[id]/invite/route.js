import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-server-client";
import { requireWorkspaceMember, addWorkspaceMember } from "@/lib/workspace";
import { sendWorkspaceInviteEmail } from "@/lib/email";

const admin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* GET → list pending invites for workspace (admin/owner) */
export async function GET(req, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json([], { status: 401 });

    const { id } = await params;
    await requireWorkspaceMember(id, user.id, "admin");

    const { data, error } = await admin
      .from("workspace_invites")
      .select("id, email, role, token, created_at, expires_at, accepted_at")
      .eq("workspace_id", id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json([], { status: 500 });
    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json([], { status: 403 });
  }
}

/* POST { email?, role? } → create invite token, optionally send email */
export async function POST(req, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await requireWorkspaceMember(id, user.id, "admin");

    const { email, role = "member" } = await req.json();
    if (!["member", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Fetch workspace name for the email
    const { data: workspace } = await admin
      .from("workspaces")
      .select("name")
      .eq("id", id)
      .single();

    const { data: invite, error } = await admin
      .from("workspace_invites")
      .insert({ workspace_id: id, email: email || null, role, invited_by: user.id })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://intellixy.vercel.app";
    const inviteUrl = `${appUrl}/invite/${invite.token}`;

    // Send email non-blocking
    if (email) {
      sendWorkspaceInviteEmail(email, workspace?.name || "a workspace", inviteUrl).catch(() => {});
    }

    return NextResponse.json({ ...invite, url: inviteUrl }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

/* DELETE ?inviteId=xxx → revoke invite (admin/owner) */
export async function DELETE(req, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await requireWorkspaceMember(id, user.id, "admin");

    const { searchParams } = new URL(req.url);
    const inviteId = searchParams.get("inviteId");
    if (!inviteId) return NextResponse.json({ error: "inviteId required" }, { status: 400 });

    const { error } = await admin
      .from("workspace_invites")
      .delete()
      .eq("id", inviteId)
      .eq("workspace_id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
