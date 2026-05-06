import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { getJobWithLogs } from "@/lib/platform-jobs";
import { getAdminClient } from "@/lib/admin-client";

export async function GET(req, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const job = await getJobWithLogs(params.id);
    if (!job || job.user_id !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ job });
  } catch (err) {
    console.error("[jobs/[id] GET]", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: job } = await getAdminClient()
      .from("platform_jobs")
      .select("user_id, status")
      .eq("id", params.id)
      .maybeSingle();

    if (!job || job.user_id !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!["pending", "awaiting_confirmation"].includes(job.status)) {
      return NextResponse.json({ error: "Only pending jobs can be cancelled" }, { status: 400 });
    }

    await getAdminClient()
      .from("platform_jobs")
      .update({ status: "cancelled", completed_at: new Date().toISOString() })
      .eq("id", params.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[jobs/[id] DELETE]", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
