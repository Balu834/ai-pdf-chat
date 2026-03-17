import { NextResponse } from "next/server";
import OpenAI from "openai";
import { OpenAIEmbeddings } from "@langchain/openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// split text
function chunkText(text, size = 1000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

// cosine similarity
function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

export async function POST(req) {
  try {
    const { question, context } = await req.json();

    const chunks = chunkText(context);

    // 🔥 embeddings for chunks
    const chunkEmbeddings = await embeddings.embedDocuments(chunks);

    // 🔥 embedding for question
    const questionEmbedding = await embeddings.embedQuery(question);

    // 🔥 similarity search
    const scoredChunks = chunks.map((chunk, i) => ({
      chunk,
      score: cosineSimilarity(questionEmbedding, chunkEmbeddings[i]),
    }));

    const topChunks = scoredChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.chunk);

    const finalContext = topChunks.join("\n");

    // 🔥 AI answer
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Answer clearly using the document. Be helpful and concise.",
        },
        {
          role: "user",
          content: `Document:\n${finalContext}\n\nQuestion: ${question}`,
        },
      ],
    });

    return NextResponse.json({
      answer: completion.choices[0].message.content,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "AI failed" }, { status: 500 });
  }
}