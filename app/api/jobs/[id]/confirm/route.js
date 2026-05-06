import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { getAdminClient } from "@/lib/admin-client";
import { addLog } from "@/lib/platform-jobs";

export async function POST(req, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { approved } = await req.json().catch(() => ({}));

    const { data: job } = await getAdminClient()
      .from("platform_jobs")
      .select("user_id, status, name")
      .eq("id", params.id)
      .maybeSingle();

    if (!job || job.user_id !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (job.status !== "awaiting_confirmation") {
      return NextResponse.json({ error: "Job is not awaiting confirmation" }, { status: 400 });
    }

    if (approved) {
      await getAdminClient().from("platform_jobs")
        .update({ status: "confirmed", scheduled_for: new Date().toISOString() })
        .eq("id", params.id);
      await addLog(params.id, "info", "User approved — job queued for execution");
    } else {
      await getAdminClient().from("platform_jobs")
        .update({ status: "cancelled", completed_at: new Date().toISOString() })
        .eq("id", params.id);
      await addLog(params.id, "info", "User rejected — job cancelled");
    }

    return NextResponse.json({ ok: true, status: approved ? "confirmed" : "cancelled" });
  } catch (err) {
    console.error("[jobs/[id]/confirm POST]", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
