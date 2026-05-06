import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { createJob, listJobs } from "@/lib/platform-jobs";

export async function GET(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const status = new URL(req.url).searchParams.get("status") ?? undefined;
    const jobs   = await listJobs(user.id, { status });
    return NextResponse.json({ jobs });
  } catch (err) {
    console.error("[jobs GET]", err?.message ?? err);
    return NextResponse.json({ jobs: [] }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

    const { name, type, steps, payload, scheduledFor, maxRetries } = body;
    if (!name || !type) return NextResponse.json({ error: "name and type required" }, { status: 400 });

    const job = await createJob(user.id, { name, type, steps, payload, scheduledFor, maxRetries });
    return NextResponse.json({ job }, { status: 201 });
  } catch (err) {
    console.error("[jobs POST]", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
