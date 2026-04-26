import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runAgent } from "@/lib/agent-runner";
import { runWorkflow } from "@/lib/workflow-engine";

const adminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = adminClient();
  const processed = [];

  // Process up to 10 jobs per cron tick
  for (let i = 0; i < 10; i++) {
    const { data: jobs } = await supabase.rpc("claim_next_job");
    const job = jobs?.[0];
    if (!job) break;

    let result;
    let status = "done";
    let error;

    try {
      if (job.type === "agent_run") {
        const { agent_id, user_id, task, document_id } = job.payload;

        const { data: agent } = await supabase.from("agents").select("*").eq("id", agent_id).single();
        if (!agent) throw new Error("Agent not found");

        let pdf_text = "";
        if (document_id) {
          const { data: doc } = await supabase.from("documents").select("content").eq("id", document_id).single();
          pdf_text = doc?.content ?? "";
        }

        result = await runAgent(agent, { task, pdf_text, document_id, user_id });
        if (result.status === "failed") throw new Error(result.error);

      } else if (job.type === "workflow_run") {
        const { workflow_id, user_id, document_id } = job.payload;

        const { data: workflow } = await supabase.from("workflows").select("*").eq("id", workflow_id).single();
        if (!workflow) throw new Error("Workflow not found");

        const { data: steps } = await supabase
          .from("workflow_steps")
          .select("*")
          .eq("workflow_id", workflow_id)
          .order("position");

        let pdf_text = "";
        if (document_id) {
          const { data: doc } = await supabase.from("documents").select("content").eq("id", document_id).single();
          pdf_text = doc?.content ?? "";
        }

        result = await runWorkflow(workflow, steps ?? [], { pdf_text, document_id, user_id });
        if (result.status === "failed") throw new Error(result.error);

      } else {
        throw new Error(`Unknown job type: ${job.type}`);
      }
    } catch (err) {
      status = "failed";
      error = err.message;
      result = null;
    }

    await supabase
      .from("job_queue")
      .update({
        status,
        result: result ?? null,
        error: error ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    processed.push({ id: job.id, type: job.type, status });
  }

  // Refresh trending counts on every cron tick (non-blocking)
  supabase.rpc("refresh_trending_counts").then(() => {});

  return NextResponse.json({ processed, count: processed.length });
}
