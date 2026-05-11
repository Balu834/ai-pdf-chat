import { NextResponse } from "next/server";
import { createClient as createSessionClient } from "@/lib/supabase-server-client";
import { getAdminClient } from "@/lib/admin-client";
import { runAgent } from "@/lib/agent-runner";
import { withErrorHandler } from "@/lib/with-error-handler";

async function getUser() {
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function _POST(req, { params }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: agent } = await getAdminClient()
    .from("agents")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  if (!agent.is_active) return NextResponse.json({ error: "Agent is disabled" }, { status: 400 });

  const body = await req.json();
  const { task, document_id } = body;

  if (!task?.trim()) return NextResponse.json({ error: "task is required" }, { status: 400 });

  let pdf_text = "";
  if (document_id) {
    const { data: doc } = await getAdminClient()
      .from("documents")
      .select("content")
      .eq("id", document_id)
      .eq("user_id", user.id)
      .maybeSingle();
    pdf_text = doc?.content ?? "";
  }

  const result = await runAgent(agent, {
    task: task.trim(),
    pdf_text,
    document_id,
    user_id: user.id,
  });

  return NextResponse.json(result, { status: result.status === "failed" ? 500 : 200 });
}

export const POST = withErrorHandler(_POST, { route: "api/agents/[id]/run" });
