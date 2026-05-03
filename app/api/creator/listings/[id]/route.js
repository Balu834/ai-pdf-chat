import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createSessionClient } from "@/lib/supabase-server-client";

const admin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

async function getUser() {
  const sb = await createSessionClient();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

// PUT — update listing (toggle published, update description/price)
export async function PUT(req, { params }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = admin();
  const body = await req.json();
  const { type } = body; // "agent" | "template"

  const table = type === "agent" ? "marketplace_agents" : "marketplace_templates";
  const updates = { updated_at: new Date().toISOString() };

  if (body.name        !== undefined) updates.name        = body.name.trim();
  if (body.description !== undefined) updates.description = body.description.trim();
  if (body.category    !== undefined) updates.category    = body.category;
  if (body.is_published !== undefined) updates.is_published = Boolean(body.is_published);
  if (type === "template" && body.price_paise !== undefined)
    updates.price_paise = Math.max(0, Math.round(Number(body.price_paise)));

  const { data, error } = await sb
    .from(table)
    .update(updates)
    .eq("id", params.id)
    .eq("creator_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ listing: data });
}

// DELETE — unpublish / remove listing
export async function DELETE(req, { params }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "agent" | "template"
  const table = type === "agent" ? "marketplace_agents" : "marketplace_templates";

  const { error } = await admin()
    .from(table)
    .delete()
    .eq("id", params.id)
    .eq("creator_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
