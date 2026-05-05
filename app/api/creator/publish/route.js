import { NextResponse } from "next/server";
import { createClient as createSessionClient } from "@/lib/supabase-server-client";
import { getAdminClient } from "@/lib/admin-client";

async function getUser() {
  const sb = await createSessionClient();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

const VALID_CATEGORIES = ["Productivity", "Finance", "Legal", "Education", "Other"];

// POST — publish an agent or workflow template to the marketplace
export async function POST(req) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sb = getAdminClient();

    // Require a creator profile
    const { data: profile } = await sb
      .from("creator_profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) return NextResponse.json({ error: "Create a creator profile first" }, { status: 403 });

    const body = await req.json();
    const { type, source_id, name, description, category, price_paise = 0 } = body;

    if (!["agent", "template"].includes(type))
      return NextResponse.json({ error: "type must be agent or template" }, { status: 400 });
    if (!name?.trim())
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    if (!VALID_CATEGORIES.includes(category))
      return NextResponse.json({ error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` }, { status: 400 });

    if (type === "agent") {
      // Resolve source agent config
      let sourceConfig = {};
      if (source_id) {
        const { data: src } = await sb.from("agents").select("role, instructions, tools")
          .eq("id", source_id).eq("user_id", user.id).single();
        if (!src) return NextResponse.json({ error: "Source agent not found" }, { status: 404 });
        sourceConfig = src;
      }

      const { data, error } = await sb.from("marketplace_agents").insert({
        creator_id:   user.id,
        name:         name.trim(),
        description:  description?.trim() ?? "",
        category,
        role:         body.role || sourceConfig.role || "General Assistant",
        instructions: body.instructions || sourceConfig.instructions || "",
        tools:        body.tools || sourceConfig.tools || [],
      }).select().single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ published: true, listing: data }, { status: 201 });

    } else {
      // Resolve source workflow + steps
      let steps = body.steps ?? [];
      if (source_id && !steps.length) {
        const { data: srcSteps } = await sb
          .from("workflow_steps")
          .select("position, type, config")
          .eq("workflow_id", source_id)
          .order("position");

        // Verify ownership
        const { data: srcWf } = await sb.from("workflows").select("user_id").eq("id", source_id).single();
        if (!srcWf || srcWf.user_id !== user.id)
          return NextResponse.json({ error: "Source workflow not found" }, { status: 404 });

        steps = srcSteps ?? [];
      }

      const VALID_TYPES = ["pdf_summarizer", "invoice_extractor", "contract_checker", "custom"];
      const templateType = VALID_TYPES.includes(body.template_type) ? body.template_type : "custom";
      const pricePaise   = Math.max(0, Math.round(Number(price_paise)));

      const { data, error } = await sb.from("marketplace_templates").insert({
        creator_id:    user.id,
        name:          name.trim(),
        description:   description?.trim() ?? "",
        category,
        template_type: templateType,
        steps:         steps.map((s) => ({ type: s.type, config: s.config ?? {}, position: s.position ?? 0 })),
        price_paise:   pricePaise,
      }).select().single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ published: true, listing: data }, { status: 201 });
    }
  } catch (err) {
    console.error("[creator/publish/route.js]", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
