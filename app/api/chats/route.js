import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase-server-client";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* GET  ?documentId=xxx  → list sessions for a document (ordered newest-first)
   GET  ?id=xxx          → single session */
export async function GET(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json([], { status: 401 });

    const { searchParams } = new URL(req.url);
    const id         = searchParams.get("id");
    const documentId = searchParams.get("documentId");

    if (id) {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) return NextResponse.json(null, { status: 500 });
      return NextResponse.json(data);
    }

    if (!documentId) return NextResponse.json([]);

    const { data, error } = await supabase
      .from("chat_sessions")
      .select("id, title, created_at, updated_at")
      .eq("document_id", documentId)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) {
      console.warn("[chats GET]", error.message);
      return NextResponse.json([]);
    }
    return NextResponse.json(data || []);
  } catch (err) {
    console.error("[chats GET]", err.message);
    return NextResponse.json([]);
  }
}

/* POST  { documentId, title? }  → create a new session */
export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { documentId, title = "New Chat" } = await req.json();
    if (!documentId)
      return NextResponse.json({ error: "documentId required" }, { status: 400 });

    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id, document_id: documentId, title })
      .select()
      .single();

    if (error) {
      console.error("[chats POST]", error.message);
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[chats POST]", err.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/* PATCH  { id, title }              → rename
   PATCH  { id, firstMessage }       → auto-generate title from first message */
export async function PATCH(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, title, firstMessage } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    let finalTitle = title?.trim();

    if (!finalTitle && firstMessage) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0,
          max_tokens: 12,
          messages: [
            {
              role: "system",
              content:
                "Generate a short, descriptive chat title (3-5 words) from this message. " +
                "Plain text only — no quotes, no punctuation at the end.",
            },
            { role: "user", content: firstMessage.slice(0, 200) },
          ],
        });
        finalTitle =
          completion.choices[0].message.content?.trim().slice(0, 60) ||
          firstMessage.slice(0, 45);
      } catch {
        finalTitle = firstMessage.slice(0, 45);
      }
    }

    if (!finalTitle) return NextResponse.json({ error: "title required" }, { status: 400 });

    const { data, error } = await supabase
      .from("chat_sessions")
      .update({ title: finalTitle, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("[chats PATCH]", error.message);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("[chats PATCH]", err.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/* DELETE  ?id=xxx  → delete session (messages cascade via FK) */
export async function DELETE(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const { error } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[chats DELETE]", error.message);
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[chats DELETE]", err.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
