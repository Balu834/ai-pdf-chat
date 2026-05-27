import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { getOpenAI } from "@/lib/openai-client";

export const maxDuration = 60;

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, subjects, examDate, hoursPerDay } = await req.json();
    if (!subjects?.length || !examDate || !hoursPerDay) {
      return NextResponse.json({ error: "subjects, examDate, hoursPerDay required" }, { status: 400 });
    }

    const today = new Date();
    const exam  = new Date(examDate);
    const daysLeft = Math.max(1, Math.round((exam - today) / 86400000));
    const weeksLeft = Math.ceil(daysLeft / 7);

    const subjectList = subjects.map((s, i) => `${i + 1}. ${s.name}${s.chapters ? ` (${s.chapters} chapters)` : ""}`).join("\n");

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            `You are an expert study planner. Create a realistic week-by-week study schedule.\n\n` +
            `Return ONLY valid JSON:\n` +
            `{\n` +
            `  "weeks": [\n` +
            `    {\n` +
            `      "week": 1,\n` +
            `      "label": "Week 1: Foundation",\n` +
            `      "days": [\n` +
            `        {\n` +
            `          "day": "Mon",\n` +
            `          "subject": "Subject name",\n` +
            `          "topic": "Specific topic or chapter to study",\n` +
            `          "hours": 2,\n` +
            `          "completed": false\n` +
            `        }\n` +
            `      ]\n` +
            `    }\n` +
            `  ],\n` +
            `  "tips": ["tip1", "tip2", "tip3"]\n` +
            `}\n\n` +
            `Rules:\n` +
            `- Plan for exactly ${Math.min(weeksLeft, 8)} weeks\n` +
            `- Max ${hoursPerDay} study hours per day\n` +
            `- Include 1 rest/revision day per week (Sunday or Saturday)\n` +
            `- Last week = full revision and mock tests\n` +
            `- Distribute subjects evenly based on priority\n` +
            `- Day entries: Mon/Tue/Wed/Thu/Fri/Sat/Sun (skip rest days)\n` +
            `- Each topic should be specific and actionable (e.g. "Newton's Laws + practice numericals")\n` +
            `- Include 3 study tips at the end`,
        },
        {
          role: "user",
          content:
            `Exam: ${title || "Final Exam"}\n` +
            `Exam date: ${examDate}\n` +
            `Days remaining: ${daysLeft}\n` +
            `Study hours per day: ${hoursPerDay}\n` +
            `Subjects:\n${subjectList}`,
        },
      ],
    });

    const parsed = JSON.parse(completion.choices[0].message.content);

    const { data: plan, error } = await supabase
      .from("study_plans")
      .insert({
        user_id:       user.id,
        title:         title || "My Study Plan",
        exam_date:     examDate,
        hours_per_day: hoursPerDay,
        subjects:      subjects,
        schedule:      parsed.weeks || [],
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ id: plan.id, weeks: parsed.weeks || [], tips: parsed.tips || [] });
  } catch (err) {
    console.error("[planner/generate]", err.message);
    return NextResponse.json({ error: "Planner generation failed" }, { status: 500 });
  }
}
