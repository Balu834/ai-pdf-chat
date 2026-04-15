import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { isProActive } from "@/lib/user-plan";
import { createClient as createAdmin } from "@supabase/supabase-js";

const MAX_FREE_PDFS = 5;

const admin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [isPro, { count, error: countError }] = await Promise.all([
      isProActive(user.id),
      admin
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

    if (countError) {
      console.error("[/api/user/stats] count error:", countError.message);
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }

    const pdfCount = count ?? 0;

    return NextResponse.json({
      pdfCount,
      maxPdfs:       isPro ? null : MAX_FREE_PDFS,
      plan:          isPro ? "pro" : "free",
      limitReached:  !isPro && pdfCount >= MAX_FREE_PDFS,
    });
  } catch (err) {
    console.error("[/api/user/stats] unhandled error:", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
