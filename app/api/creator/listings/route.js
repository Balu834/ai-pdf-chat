import { NextResponse } from "next/server";
import { createClient as createSessionClient } from "@/lib/supabase-server-client";
import { getAdminClient } from "@/lib/admin-client";

async function getUser() {
  const sb = await createSessionClient();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

// GET — all published listings (agents + templates) by this creator
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = getAdminClient();
  const [{ data: agents }, { data: templates }] = await Promise.all([
    sb.from("marketplace_agents")
      .select("id, name, category, install_count, avg_rating, review_count, is_published, created_at")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false }),
    sb.from("marketplace_templates")
      .select("id, name, category, price_paise, install_count, avg_rating, review_count, is_published, created_at")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({ agents: agents ?? [], templates: templates ?? [] });
}
