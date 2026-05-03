import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createSessionClient } from "@/lib/supabase-server-client";

const adminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

async function getUser() {
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

const VALID_TRIGGERS = ["manual", "pdf_upload", "scheduled"];
const VALID_STEP_TYPES = ["extract_fields", "summarize", "condition", "send_email", "call_webhook", "run_agent"];

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = adminClient();
  const { data: workflows, error } = await supabase
    .from("workflows")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Attach step counts
  const ids = (workflows ?? []).map((w) => w.id);
  let stepCounts = {};
  if (ids.length) {
    const { data: steps } = await supabase
      .from("workflow_steps")
      .select("workflow_id")
      .in("workflow_id", ids);
    (steps ?? []).forEach((s) => { stepCounts[s.workflow_id] = (stepCounts[s.workflow_id] ?? 0) + 1; });
  }

  const result = (workflows ?? []).map((w) => ({ ...w, step_count: stepCounts[w.id] ?? 0 }));
  return NextResponse.json({ workflows: result });
}

export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, description, trigger = "manual", steps = [] } = body;

  if (!name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });
  if (!VALID_TRIGGERS.includes(trigger))
    return NextResponse.json({ error: `trigger must be one of ${VALID_TRIGGERS.join(", ")}` }, { status: 400 });

  const supabase = adminClient();

  const { data: workflow, error: wfErr } = await supabase
    .from("workflows")
    .insert({
      user_id: user.id,
      name: name.trim(),
      description: description?.trim() ?? null,
      trigger,
    })
    .select()
    .single();

  if (wfErr) return NextResponse.json({ error: wfErr.message }, { status: 500 });

  let insertedSteps = [];
  if (steps.length > 0) {
    const validSteps = steps
      .filter((s) => VALID_STEP_TYPES.includes(s.type))
      .map((s, i) => ({
        workflow_id: workflow.id,
        position: s.position ?? i,
        type: s.type,
        config: s.config ?? {},
      }));

    const { data: stepsData, error: stepsErr } = await supabase
      .from("workflow_steps")
      .insert(validSteps)
      .select();

    if (stepsErr) return NextResponse.json({ error: stepsErr.message }, { status: 500 });
    insertedSteps = stepsData ?? [];
  }

  return NextResponse.json({ workflow, steps: insertedSteps }, { status: 201 });
}
