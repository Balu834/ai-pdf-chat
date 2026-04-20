import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { createClient as createAdmin } from "@supabase/supabase-js";

const admin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { endpoint, keys } = await request.json();
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription object" }, { status: 400 });
    }

    // Upsert — same endpoint may re-subscribe after SW update
    const { error } = await admin
      .from("push_subscriptions")
      .upsert(
        {
          user_id:     user.id,
          endpoint,
          p256dh:      keys.p256dh,
          auth:        keys.auth,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" }
      );

    if (error) {
      console.error("[push/subscribe]", error.message);
      return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
    }

    console.log(`[push/subscribe] ✅ User ${user.id} subscribed on ${endpoint.slice(-20)}`);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[push/subscribe] Unhandled:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { endpoint } = await request.json();
    await admin
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id)
      .eq("endpoint", endpoint);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
