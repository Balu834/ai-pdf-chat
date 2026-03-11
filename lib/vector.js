import { MemoryVectorStore } from "@langchain/community/vectorstores/memory"
import { OpenAIEmbeddings } from "@langchain/openai"

export const vectorStore = new MemoryVectorStore(
  new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY
  })
)