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

export async function GET(req, { params }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await admin()
    .from("marketplace_reviews")
    .select("id, user_id, rating, review, created_at")
    .eq("target_type", "template")
    .eq("target_id", params.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data ?? [] });
}

export async function POST(req, { params }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rating, review } = await req.json();
  if (!rating || rating < 1 || rating > 5)
    return NextResponse.json({ error: "rating must be 1–5" }, { status: 400 });

  const sb = admin();

  // Must have installed the template to review it
  const { data: installed } = await sb
    .from("workflows")
    .select("id")
    .eq("user_id", user.id)
    .eq("source_marketplace_template_id", params.id)
    .maybeSingle();

  if (!installed) return NextResponse.json({ error: "Install the template before reviewing" }, { status: 403 });

  const { data, error } = await sb
    .from("marketplace_reviews")
    .upsert({
      user_id: user.id,
      target_type: "template",
      target_id: params.id,
      rating,
      review: review?.trim() ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,target_type,target_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ review: data });
}
