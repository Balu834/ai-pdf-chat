import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const admin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

async function getUser() {
  const sb = createServerComponentClient({ cookies });
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

// GET — full template detail with steps + reviews
export async function GET(req, { params }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = admin();

  const { data: template, error } = await sb
    .from("marketplace_templates")
    .select(`
      id, name, description, category, template_type, steps, price_paise,
      install_count, avg_rating, review_count, created_at, creator_id,
      creator_profiles!marketplace_templates_creator_id_fkey(display_name, bio)
    `)
    .eq("id", params.id)
    .eq("is_published", true)
    .single();

  if (error || !template) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [{ data: reviews }, { data: installed }, { data: purchase }] = await Promise.all([
    sb.from("marketplace_reviews")
      .select("rating, review, created_at")
      .eq("target_type", "template")
      .eq("target_id", params.id)
      .order("created_at", { ascending: false })
      .limit(20),
    sb.from("workflows")
      .select("id")
      .eq("user_id", user.id)
      .eq("source_marketplace_template_id", params.id)
      .maybeSingle(),
    sb.from("template_purchases")
      .select("status")
      .eq("user_id", user.id)
      .eq("template_id", params.id)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    template: {
      ...template,
      creator_name: template.creator_profiles?.display_name || "Creator",
      creator_bio:  template.creator_profiles?.bio  || "",
      creator_profiles: undefined,
      installed: !!installed,
      purchased: template.price_paise === 0 || purchase?.status === "completed",
      step_count: Array.isArray(template.steps) ? template.steps.length : 0,
    },
    reviews: reviews ?? [],
  });
}

// POST — install template (free) or validate purchase and install (paid)
export async function POST(req, { params }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = admin();

  const { data: template } = await sb
    .from("marketplace_templates")
    .select("*")
    .eq("id", params.id)
    .eq("is_published", true)
    .single();

  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  // Access check for paid templates
  if (template.price_paise > 0) {
    const { data: purchase } = await sb
      .from("template_purchases")
      .select("status")
      .eq("user_id", user.id)
      .eq("template_id", params.id)
      .eq("status", "completed")
      .maybeSingle();

    if (!purchase) return NextResponse.json({ error: "Purchase required", code: "PAYMENT_REQUIRED" }, { status: 402 });
  }

  // Idempotent check
  const { data: existing } = await sb
    .from("workflows")
    .select("id")
    .eq("user_id", user.id)
    .eq("source_marketplace_template_id", params.id)
    .maybeSingle();

  if (existing) return NextResponse.json({ installed: true, workflow_id: existing.id, already_had: true });

  // Clone workflow
  const { data: wf, error: wfErr } = await sb
    .from("workflows")
    .insert({
      user_id: user.id,
      name: template.name,
      description: template.description,
      trigger: "manual",
      source_marketplace_template_id: params.id,
    })
    .select("id")
    .single();

  if (wfErr) return NextResponse.json({ error: wfErr.message }, { status: 500 });

  // Clone steps
  const steps = Array.isArray(template.steps) ? template.steps : [];
  if (steps.length > 0) {
    await sb.from("workflow_steps").insert(
      steps.map((s, i) => ({
        workflow_id: wf.id,
        position: s.position ?? i,
        type: s.type,
        config: s.config ?? {},
      }))
    );
  }

  // Increment counter (non-blocking)
  sb.rpc("increment_install_count", { p_type: "template", p_id: params.id }).then(() => {});

  return NextResponse.json({ installed: true, workflow_id: wf.id });
}
