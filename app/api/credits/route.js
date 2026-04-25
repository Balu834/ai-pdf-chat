import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { getCredits, getRecentTransactions, getUsageSummary } from "@/lib/credits";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [credits, transactions, usageSummary] = await Promise.all([
      getCredits(user.id),
      getRecentTransactions(user.id, 15),
      getUsageSummary(user.id),
    ]);

    return NextResponse.json({ credits, transactions, usage_30d: usageSummary });
  } catch (err) {
    console.error("[/api/credits] error:", err);
    return NextResponse.json({ error: "Failed to load credits" }, { status: 500 });
  }
}
