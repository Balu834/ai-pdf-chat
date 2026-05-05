import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient as createSessionClient } from "@/lib/supabase-server-client";
import { getAdminClient } from "@/lib/admin-client";

function getRazorpay() {
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

async function getUser() {
  const sb = await createSessionClient();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

const PLATFORM_FEE_PCT = 0.20; // 20% platform fee

export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { template_id } = await req.json();
  if (!template_id) return NextResponse.json({ error: "template_id is required" }, { status: 400 });

  const sb = getAdminClient();

  const { data: template } = await sb
    .from("marketplace_templates")
    .select("id, name, description, price_paise, creator_id")
    .eq("id", template_id)
    .eq("is_published", true)
    .single();

  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });
  if (template.price_paise === 0) return NextResponse.json({ error: "Template is free — install directly" }, { status: 400 });

  // Check if already purchased
  const { data: existing } = await sb
    .from("template_purchases")
    .select("status")
    .eq("user_id", user.id)
    .eq("template_id", template_id)
    .maybeSingle();

  if (existing?.status === "completed")
    return NextResponse.json({ error: "Already purchased", already_purchased: true }, { status: 400 });

  const platformFee = Math.round(template.price_paise * PLATFORM_FEE_PCT);
  const creatorAmt  = template.price_paise - platformFee;

  const order = await getRazorpay().orders.create({
    amount:   template.price_paise,
    currency: "INR",
    receipt:  `tpl_${template_id.slice(0, 8)}_${Date.now()}`,
    notes: {
      template_id,
      user_id: user.id,
      type: "template_purchase",
    },
  });

  // Create pending purchase record (upsert to handle re-attempts)
  await sb.from("template_purchases").upsert({
    user_id:            user.id,
    template_id,
    razorpay_order_id:  order.id,
    amount_paise:       template.price_paise,
    platform_fee_paise: platformFee,
    creator_paise:      creatorAmt,
    status:             "pending",
  }, { onConflict: "user_id,template_id" });

  return NextResponse.json({
    order_id:    order.id,
    amount:      order.amount,
    currency:    order.currency,
    template: {
      id:          template.id,
      name:        template.name,
      description: template.description,
      price_paise: template.price_paise,
    },
    key_id: process.env.RAZORPAY_KEY_ID,
  });
}
