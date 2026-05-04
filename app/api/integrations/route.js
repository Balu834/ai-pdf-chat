import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-client";
import { createClient as serverClient } from "@/lib/supabase-server-client";

// GET /api/integrations — list connected providers for the current user
export async function GET() {
  const supabase = await serverClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await getAdminClient()
    .from("integrations")
    .select("id, provider, account_email, account_name, scopes, created_at, updated_at")
    .eq("user_id", user.id)
    .order("provider");

  return NextResponse.json({ integrations: data ?? [] });
}

// DELETE /api/integrations?provider=google — disconnect a provider
export async function DELETE(req) {
  const supabase = await serverClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = new URL(req.url).searchParams.get("provider");
  if (!provider) return NextResponse.json({ error: "provider required" }, { status: 400 });

  await getAdminClient().from("integrations").delete().eq("user_id", user.id).eq("provider", provider);
  return NextResponse.json({ ok: true });
}
