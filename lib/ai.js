import { getOpenAI } from "@/lib/openai-client";

export async function createEmbedding(text) {
  const response = await getOpenAI().embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

export async function askAI(context, question) {
  const prompt = `
You are an AI assistant that answers questions from a document.

Document Context:
${context}

Question:
${question}

Answer clearly using the context.
`;

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content;
}
