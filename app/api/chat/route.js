import { createClient } from "@supabase/supabase-js"
import { createEmbedding } from "@/lib/createEmbedding"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {

  const { question, documentId } = await req.json()

  // convert question → embedding (fake for now)
  const queryEmbedding = await createEmbedding(question)

  // search similar chunks
  const { data: matches } = await supabase.rpc("match_embeddings", {
    query_embedding: queryEmbedding,
    match_count: 5,
    doc_id: documentId
  })

  const context = matches?.map(m => m.content).join("\n") || ""

  // TEMPORARY ANSWER (no OpenAI needed)
  const answer = `
Question: ${question}

Relevant content from the document:

${context.slice(0, 800)}
`

  return Response.json({ answer })

}