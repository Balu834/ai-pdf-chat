import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

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

async function getWorkflow(id, userId) {
  const { data } = await adminClient()
    .from("workflows")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  return data;
}

export async function GET(req, { params }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workflow = await getWorkflow(params.id, user.id);
  if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: steps } = await adminClient()
    .from("workflow_steps")
    .select("*")
    .eq("workflow_id", params.id)
    .order("position");

  return NextResponse.json({ workflow, steps: steps ?? [] });
}

export async function PUT(req, { params }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workflow = await getWorkflow(params.id, user.id);
  if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const supabase = adminClient();

  const updates = { updated_at: new Date().toISOString() };
  if (body.name !== undefined)        updates.name        = body.name.trim();
  if (body.description !== undefined) updates.description = body.description?.trim() ?? null;
  if (body.trigger !== undefined)     updates.trigger     = body.trigger;
  if (body.is_active !== undefined)   updates.is_active   = Boolean(body.is_active);

  const { data: updatedWf, error: wfErr } = await supabase
    .from("workflows")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (wfErr) return NextResponse.json({ error: wfErr.message }, { status: 500 });

  // Replace steps if provided
  if (Array.isArray(body.steps)) {
    await supabase.from("workflow_steps").delete().eq("workflow_id", params.id);

    if (body.steps.length > 0) {
      const VALID = ["extract_fields", "summarize", "condition", "send_email", "call_webhook", "run_agent"];
      const newSteps = body.steps
        .filter((s) => VALID.includes(s.type))
        .map((s, i) => ({
          workflow_id: params.id,
          position: s.position ?? i,
          type: s.type,
          config: s.config ?? {},
        }));
      await supabase.from("workflow_steps").insert(newSteps);
    }
  }

  const { data: steps } = await supabase
    .from("workflow_steps")
    .select("*")
    .eq("workflow_id", params.id)
    .order("position");

  return NextResponse.json({ workflow: updatedWf, steps: steps ?? [] });
}

export async function DELETE(req, { params }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workflow = await getWorkflow(params.id, user.id);
  if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await adminClient().from("workflows").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
