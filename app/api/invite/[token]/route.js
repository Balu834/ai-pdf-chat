import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-server-client";
import { addWorkspaceMember, getWorkspaceMember } from "@/lib/workspace";

const admin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* GET → fetch invite metadata (public — no auth needed) */
export async function GET(req, { params }) {
  try {
    const { token } = await params;

    const { data: invite, error } = await admin
      .from("workspace_invites")
      .select("id, role, email, workspace_id, expires_at, accepted_at")
      .eq("token", token)
      .maybeSingle();

    if (error || !invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }
    if (invite.accepted_at) {
      return NextResponse.json({ error: "Invite already accepted" }, { status: 410 });
    }
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 410 });
    }

    const { data: workspace } = await admin
      .from("workspaces")
      .select("name")
      .eq("id", invite.workspace_id)
      .single();

    // Fetch inviter email
    const { data: inviterRow } = await admin
      .from("workspace_invites")
      .select("invited_by")
      .eq("token", token)
      .single();

    let inviterEmail = null;
    if (inviterRow?.invited_by) {
      const { data: { user: inviter } } = await admin.auth.admin.getUserById(inviterRow.invited_by);
      inviterEmail = inviter?.email || null;
    }

    return NextResponse.json({
      workspaceName: workspace?.name || "Unknown workspace",
      role: invite.role,
      inviterEmail,
      expiresAt: invite.expires_at,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* POST → accept invite (must be authenticated) */
export async function POST(req, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Must be logged in to accept invite" }, { status: 401 });

    const { token } = await params;

    const { data: invite, error } = await admin
      .from("workspace_invites")
      .select("id, workspace_id, role, email, expires_at, accepted_at")
      .eq("token", token)
      .maybeSingle();

    if (error || !invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    if (invite.accepted_at) return NextResponse.json({ error: "Invite already accepted" }, { status: 410 });
    if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: "Invite expired" }, { status: 410 });

    // If invite is email-specific, enforce match
    if (invite.email && invite.email.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json({ error: "This invite was sent to a different email address" }, { status: 403 });
    }

    // Check if already a member
    const existing = await getWorkspaceMember(invite.workspace_id, user.id);
    if (existing) {
      return NextResponse.json({ workspaceId: invite.workspace_id, alreadyMember: true });
    }

    // Add member
    await addWorkspaceMember(invite.workspace_id, user.id, invite.role);

    // Mark invite accepted
    await admin
      .from("workspace_invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invite.id);

    return NextResponse.json({ workspaceId: invite.workspace_id, role: invite.role });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
