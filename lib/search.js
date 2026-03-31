import supabase from "./supabase";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function searchSimilarChunks(query, documentId) {
  try {
    // ✅ Create embedding for question
    const embeddingRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    const embedding = embeddingRes.data[0].embedding;

    console.log("🔍 Query:", query);
    console.log("📄 Document:", documentId);

    // ✅ Call Supabase RPC
    const { data, error } = await supabase.rpc("match_chunks", {
      query_embedding: embedding,
      match_threshold: 0.3, // 🔥 IMPORTANT
      match_count: 10,      // 🔥 IMPORTANT
      doc_id: documentId,
    });

    if (error) {
      console.error("❌ Search error:", error);
      return [];
    }

    console.log("🔥 SEARCH RESULT:", data);

    return data || [];
  } catch (err) {
    console.error("❌ Embedding error:", err);
    return [];
  }
}