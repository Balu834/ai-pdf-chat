import { NextResponse } from "next/server";
import { createClient as createSessionClient } from "@/lib/supabase-server-client";
import { getAdminClient } from "@/lib/admin-client";
import { runWorkflow } from "@/lib/workflow-engine";
import { withErrorHandler } from "@/lib/with-error-handler";

async function getUser() {
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function _POST(req, { params }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getAdminClient();

  const { data: workflow } = await db
    .from("workflows")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!workflow) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  if (!workflow.is_active) return NextResponse.json({ error: "Workflow is disabled" }, { status: 400 });

  const { data: steps } = await db
    .from("workflow_steps")
    .select("*")
    .eq("workflow_id", params.id)
    .order("position");

  if (!steps?.length) return NextResponse.json({ error: "Workflow has no steps" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const { document_id } = body;

  let pdf_text = "";
  if (document_id) {
    const { data: doc } = await db
      .from("documents")
      .select("content")
      .eq("id", document_id)
      .eq("user_id", user.id)
      .maybeSingle();
    pdf_text = doc?.content ?? "";
  }

  const result = await runWorkflow(workflow, steps, {
    pdf_text,
    document_id: document_id ?? null,
    user_id: user.id,
  });

  return NextResponse.json(result, { status: result.status === "failed" ? 500 : 200 });
}

export const POST = withErrorHandler(_POST, { route: "api/workflows/[id]/run" });
