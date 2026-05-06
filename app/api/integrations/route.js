import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-client";
import { createClient as serverClient } from "@/lib/supabase-server-client";

export async function GET() {
  try {
    const supabase = await serverClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data } = await getAdminClient()
      .from("integrations")
      .select("id, provider, account_email, account_name, scopes, created_at, updated_at")
      .eq("user_id", user.id)
      .order("provider");

    return NextResponse.json({ integrations: data ?? [] });
  } catch (err) {
    console.error("[integrations GET]", err?.message ?? err);
    return NextResponse.json({ integrations: [] }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const supabase = await serverClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const provider = new URL(req.url).searchParams.get("provider");
    if (!provider) return NextResponse.json({ error: "provider required" }, { status: 400 });

    await getAdminClient().from("integrations").delete().eq("user_id", user.id).eq("provider", provider);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[integrations DELETE]", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
