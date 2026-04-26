/**
 * POST /api/appstore/[type]/[id]/favorite
 * Toggles favorite status. Returns { favorited: boolean }.
 */
import { NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { admin, logUsage } from "@/lib/appstore";

async function getUser() {
  const sb = createServerComponentClient({ cookies });
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

export async function POST(req, { params }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, id } = params;
  if (!["agent", "template"].includes(type))
    return NextResponse.json({ error: "type must be agent or template" }, { status: 400 });

  const sb = admin();

  // Check current state
  const { data: existing } = await sb
    .from("app_favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_type", type)
    .eq("target_id", id)
    .maybeSingle();

  if (existing) {
    // Un-favorite
    await sb.from("app_favorites").delete().eq("id", existing.id);
    logUsage(sb, user.id, type, id, "unfavorite");
    return NextResponse.json({ favorited: false });
  } else {
    // Favorite
    await sb.from("app_favorites").insert({
      user_id: user.id, target_type: type, target_id: id,
    });
    logUsage(sb, user.id, type, id, "favorite");
    return NextResponse.json({ favorited: true });
  }
}
