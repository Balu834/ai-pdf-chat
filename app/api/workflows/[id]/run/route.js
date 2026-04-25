import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { runWorkflow } from "@/lib/workflow-engine";

const adminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

async function getUser() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(req, { params }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = adminClient();

  const { data: workflow } = await supabase
    .from("workflows")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!workflow) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  if (!workflow.is_active) return NextResponse.json({ error: "Workflow is disabled" }, { status: 400 });

  const { data: steps } = await supabase
    .from("workflow_steps")
    .select("*")
    .eq("workflow_id", params.id)
    .order("position");

  if (!steps?.length) return NextResponse.json({ error: "Workflow has no steps" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const { document_id } = body;

  // Fetch pdf_text if document provided
  let pdf_text = "";
  if (document_id) {
    const { data: doc } = await supabase
      .from("documents")
      .select("content")
      .eq("id", document_id)
      .eq("user_id", user.id)
      .single();
    pdf_text = doc?.content ?? "";
  }

  const result = await runWorkflow(workflow, steps, {
    pdf_text,
    document_id: document_id ?? null,
    user_id: user.id,
  });

  return NextResponse.json(result, { status: result.status === "failed" ? 500 : 200 });
}
