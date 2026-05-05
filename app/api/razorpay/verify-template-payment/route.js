import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient as createSessionClient } from "@/lib/supabase-server-client";
import { getAdminClient } from "@/lib/admin-client";
import { logUsage } from "@/lib/appstore";

async function getUser() {
  const sb = await createSessionClient();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

export async function POST(req) {
  try {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, template_id } = await req.json();
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !template_id)
    return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });

  // HMAC verification
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expected !== razorpay_signature)
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });

  const sb = getAdminClient();

  // Idempotency — prevent double-processing
  const { data: existingPmt } = await sb
    .from("template_purchases")
    .select("status")
    .eq("razorpay_payment_id", razorpay_payment_id)
    .maybeSingle();

  if (existingPmt?.status === "completed")
    return NextResponse.json({ success: true, already_completed: true });

  // Fetch purchase record
  const { data: purchase } = await sb
    .from("template_purchases")
    .select("*")
    .eq("user_id", user.id)
    .eq("template_id", template_id)
    .maybeSingle();

  if (!purchase) return NextResponse.json({ error: "Purchase record not found" }, { status: 404 });

  // Mark purchase completed
  await sb.from("template_purchases").update({
    status:              "completed",
    razorpay_payment_id,
  }).eq("id", purchase.id);

  // Credit creator earnings via atomic RPC
  const { data: tpl } = await sb
    .from("marketplace_templates")
    .select("creator_id, name")
    .eq("id", template_id)
    .maybeSingle();

  if (tpl?.creator_id && purchase.creator_paise > 0) {
    await sb.rpc("add_creator_earnings", {
      p_creator_id:   tpl.creator_id,
      p_amount_paise: purchase.creator_paise,
    });
  }

  // Auto-install template for buyer
  let workflow_id = null;
  const { data: template } = await sb
    .from("marketplace_templates")
    .select("*")
    .eq("id", template_id)
    .maybeSingle();

  if (template) {
    const { data: existing } = await sb
      .from("workflows")
      .select("id")
      .eq("user_id", user.id)
      .eq("source_marketplace_template_id", template_id)
      .maybeSingle();

    if (existing) {
      workflow_id = existing.id;
    } else {
      const { data: wf } = await sb.from("workflows").insert({
        user_id:                        user.id,
        name:                           template.name,
        description:                    template.description,
        trigger:                        "manual",
        source_marketplace_template_id: template_id,
      }).select("id").maybeSingle();

      if (wf) {
        workflow_id = wf.id;
        const steps = Array.isArray(template.steps) ? template.steps : [];
        if (steps.length > 0) {
          await sb.from("workflow_steps").insert(
            steps.map((s, i) => ({
              workflow_id: wf.id,
              position:    s.position ?? i,
              type:        s.type,
              config:      s.config ?? {},
            }))
          );
        }
        await sb.rpc("increment_install_count", { p_type: "template", p_id: template_id });
        logUsage(sb, user.id, "template", template_id, "install");
      }
    }
  }

  return NextResponse.json({ success: true, workflow_id });
  } catch (err) {
    console.error("[verify-template-payment POST]", err.message);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}
