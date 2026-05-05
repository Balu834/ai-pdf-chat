import { NextResponse } from "next/server";
import { createClient as createSessionClient } from "@/lib/supabase-server-client";
import { getAdminClient } from "@/lib/admin-client";

async function getUser() {
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function getWorkflow(id, userId) {
  const { data } = await getAdminClient()
    .from("workflows")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function GET(req, { params }) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workflow = await getWorkflow(params.id, user.id);
    if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: steps } = await getAdminClient()
      .from("workflow_steps")
      .select("*")
      .eq("workflow_id", params.id)
      .order("position");

    return NextResponse.json({ workflow, steps: steps ?? [] });
  } catch (err) {
    console.error("[workflows/[id] GET]", err.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workflow = await getWorkflow(params.id, user.id);
    if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const db = getAdminClient();

    const updates = { updated_at: new Date().toISOString() };
    if (body.name !== undefined)        updates.name        = body.name.trim();
    if (body.description !== undefined) updates.description = body.description?.trim() ?? null;
    if (body.trigger !== undefined)     updates.trigger     = body.trigger;
    if (body.is_active !== undefined)   updates.is_active   = Boolean(body.is_active);

    const { data: updatedWf, error: wfErr } = await db
      .from("workflows")
      .update(updates)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select()
      .maybeSingle();

    if (wfErr)    return NextResponse.json({ error: wfErr.message }, { status: 500 });
    if (!updatedWf) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (Array.isArray(body.steps)) {
      await db.from("workflow_steps").delete().eq("workflow_id", params.id);
      if (body.steps.length > 0) {
        const VALID = ["extract_fields", "summarize", "condition", "send_email", "call_webhook", "run_agent"];
        const newSteps = body.steps
          .filter((s) => VALID.includes(s.type))
          .map((s, i) => ({ workflow_id: params.id, position: s.position ?? i, type: s.type, config: s.config ?? {} }));
        await db.from("workflow_steps").insert(newSteps);
      }
    }

    const { data: steps } = await db
      .from("workflow_steps")
      .select("*")
      .eq("workflow_id", params.id)
      .order("position");

    return NextResponse.json({ workflow: updatedWf, steps: steps ?? [] });
  } catch (err) {
    console.error("[workflows/[id] PUT]", err.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workflow = await getWorkflow(params.id, user.id);
    if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { error } = await getAdminClient()
      .from("workflows")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("[workflows/[id] DELETE]", err.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
