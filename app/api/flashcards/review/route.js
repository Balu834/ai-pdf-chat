import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";

// SM-2 algorithm
// quality: 0=Again, 1=Hard(struggle), 2=Hard, 3=Good(effort), 4=Good, 5=Easy
function sm2(card, quality) {
  let { interval_days, ease_factor, reps } = card;

  if (quality < 3) {
    reps = 0;
    interval_days = 1;
  } else {
    ease_factor = Math.max(1.3, ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (reps === 0)      interval_days = 1;
    else if (reps === 1) interval_days = 6;
    else                 interval_days = Math.round(interval_days * ease_factor);
    reps++;
  }

  const next_review = new Date(Date.now() + interval_days * 86400 * 1000).toISOString();
  return { interval_days, ease_factor, reps, next_review };
}

// POST /api/flashcards/review  body: { id, quality }
// quality map from UI: Again=0  Hard=2  Good=4  Easy=5
export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, quality } = await req.json();
    if (!id || quality === undefined) {
      return NextResponse.json({ error: "id and quality required" }, { status: 400 });
    }
    if (quality < 0 || quality > 5) {
      return NextResponse.json({ error: "quality must be 0-5" }, { status: 400 });
    }

    // Fetch current card state
    const { data: card } = await supabase
      .from("flashcards")
      .select("interval_days, ease_factor, reps")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

    const updated = sm2(card, quality);

    const { error } = await supabase
      .from("flashcards")
      .update(updated)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, ...updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
