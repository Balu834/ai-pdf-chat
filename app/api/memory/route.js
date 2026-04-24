import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase-server-client";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* GET → return the current user's memory */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(null, { status: 401 });

    const { data } = await supabase
      .from("user_memory")
      .select("preferences, topics, summary, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    return NextResponse.json(data || { preferences: "", topics: [], summary: "" });
  } catch (err) {
    console.error("[memory GET]", err.message);
    return NextResponse.json({ preferences: "", topics: [], summary: "" });
  }
}

/* POST  { messages: [...], documentTitle? }
   Extract facts from the conversation and upsert into user_memory.
   Called silently after every AI response. */
export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { messages, documentTitle } = await req.json();
    if (!messages?.length) return NextResponse.json({ success: true });

    // Fetch existing memory to merge with
    const { data: existing } = await supabase
      .from("user_memory")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const convoText = messages
      .slice(-8)
      .map((m) => `${m.role === "assistant" ? "AI" : "User"}: ${m.content?.slice(0, 400)}`)
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 160,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "From this conversation, extract memory to personalize future responses.\n" +
            "Return JSON:\n" +
            '{ "preferences": "one sentence about how user wants answers (tone/length/style)", ' +
            '"topics": ["up to 4 topic keywords"], ' +
            '"summary": "1-2 sentences: what was discussed, any key facts learned" }\n' +
            "If nothing notable, return empty strings/arrays.\n" +
            `Existing memory: ${JSON.stringify({ preferences: existing?.preferences, topics: existing?.topics, summary: existing?.summary })}`,
        },
        {
          role: "user",
          content: `Conversation${documentTitle ? ` about document "${documentTitle}"` : ""}:\n${convoText}`,
        },
      ],
    });

    const extracted = JSON.parse(completion.choices[0].message.content);

    // Merge topics: deduplicate, cap at 12
    const mergedTopics = [
      ...new Set([...(existing?.topics || []), ...(extracted.topics || [])]),
    ].slice(0, 12);

    const memoryRow = {
      user_id:     user.id,
      preferences: extracted.preferences?.trim() || existing?.preferences || "",
      topics:      mergedTopics,
      summary:     extracted.summary?.trim()     || existing?.summary     || "",
      updated_at:  new Date().toISOString(),
    };

    await supabase
      .from("user_memory")
      .upsert(memoryRow, { onConflict: "user_id" });

    return NextResponse.json({ success: true });
  } catch (err) {
    // Memory update is non-critical — never surface errors to the user
    console.warn("[memory POST]", err.message);
    return NextResponse.json({ success: false });
  }
}

/* DELETE → wipe memory for the current user */
export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await supabase.from("user_memory").delete().eq("user_id", user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[memory DELETE]", err.message);
    return NextResponse.json({ error: "Failed to reset memory" }, { status: 500 });
  }
}
