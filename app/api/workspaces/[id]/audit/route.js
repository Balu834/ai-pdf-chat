import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { getAdminClient } from "@/lib/admin-client";
import { requireWorkspaceMember } from "@/lib/workspace";

/* GET → fetch last 50 audit log entries (members only) */
export async function GET(req, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json([], { status: 401 });

    const { id } = await params;
    await requireWorkspaceMember(id, user.id);

    const { data, error } = await getAdminClient()
      .from("workspace_audit_log")
      .select("id, action, actor_id, target_id, meta, created_at")
      .eq("workspace_id", id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return NextResponse.json([], { status: 500 });

    // Enrich with actor emails
    const actorIds = [...new Set((data || []).map(r => r.actor_id).filter(Boolean))];
    let emailMap = {};
    if (actorIds.length > 0) {
      const { data: { users } } = await getAdminClient().auth.admin.listUsers({ perPage: 200 });
      emailMap = Object.fromEntries(
        (users || []).filter(u => actorIds.includes(u.id)).map(u => [u.id, u.email])
      );
    }

    const enriched = (data || []).map(row => ({
      ...row,
      actor_email: emailMap[row.actor_id] || null,
    }));

    return NextResponse.json(enriched);
  } catch (err) {
    return NextResponse.json([], { status: 403 });
  }
}
