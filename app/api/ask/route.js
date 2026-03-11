import { NextResponse } from "next/server"
import OpenAI from "openai"

import { vectorStore } from "@/lib/vectorStore"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req) {

  try {

    const { question } = await req.json()

    if (!question) {
      return NextResponse.json(
        { error: "No question provided" },
        { status: 400 }
      )
    }

    const docs = vectorStore.similaritySearch(question)

    let context = docs.map(doc => doc.text).join("\n")

    if (!context || context.length < 50) {

      const allDocs = vectorStore.getAllDocuments()

      context = allDocs
        .map(doc => doc.text)
        .join("\n")

    }

    const prompt = `
Use the document text below to answer the question.

DOCUMENT TEXT:
${context}

QUESTION:
${question}

If the document contains the answer, explain clearly.
If not, say:
"The document does not contain that information."
`

    const response = await openai.chat.completions.create({

      model: "gpt-4o-mini",

      messages: [
        {
          role: "user",
          content: prompt
        }
      ]

    })

    const answer = response.choices[0].message.content

    return NextResponse.json({
      answer
    })

  } catch (error) {

    console.error("Ask Error:", error)

    return NextResponse.json(
      { error: "Failed to generate answer" },
      { status: 500 }
    )

  }

}