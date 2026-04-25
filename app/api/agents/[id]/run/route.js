import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { runAgent } from "@/lib/agent-runner";

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

  const { data: agent } = await adminClient()
    .from("agents")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  if (!agent.is_active) return NextResponse.json({ error: "Agent is disabled" }, { status: 400 });

  const body = await req.json();
  const { task, document_id } = body;

  if (!task?.trim()) return NextResponse.json({ error: "task is required" }, { status: 400 });

  // Fetch pdf_text if document_id provided
  let pdf_text = "";
  if (document_id) {
    const { data: doc } = await adminClient()
      .from("documents")
      .select("content")
      .eq("id", document_id)
      .eq("user_id", user.id)
      .single();
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
