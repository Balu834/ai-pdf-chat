import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";

// GET /api/planner  → list all plans for user
export async function GET(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("study_plans")
      .select("id, title, exam_date, hours_per_day, subjects, schedule, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return NextResponse.json({ plans: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/planner  body: { id, weekIdx, dayIdx, completed }
// Toggle a single day's completed status
export async function PATCH(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, weekIdx, dayIdx, completed } = await req.json();
    if (!id || weekIdx === undefined || dayIdx === undefined) {
      return NextResponse.json({ error: "id, weekIdx, dayIdx required" }, { status: 400 });
    }

    // Fetch plan, mutate the nested schedule, save back
    const { data: plan } = await supabase
      .from("study_plans")
      .select("schedule")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    const schedule = plan.schedule;
    if (schedule[weekIdx]?.days?.[dayIdx] !== undefined) {
      schedule[weekIdx].days[dayIdx].completed = completed;
    }

    const { error } = await supabase
      .from("study_plans")
      .update({ schedule })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/planner?id=xxx
export async function DELETE(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const { error } = await supabase
      .from("study_plans")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
