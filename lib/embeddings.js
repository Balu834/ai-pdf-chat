import { getOpenAI } from "@/lib/openai-client";

export async function getEmbedding(text) {
  const res = await getOpenAI().embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return res.data[0].embedding;
}