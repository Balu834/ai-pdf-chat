import { NextResponse } from "next/server"
import pdf from "pdf-parse/lib/pdf-parse"

import { vectorStore } from "@/lib/vectorStore"

function splitText(text) {

  const size = 500
  const chunks = []

  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size))
  }

  return chunks

}

export async function POST(req) {

  try {

    const formData = await req.formData()

    const file = formData.get("file")
    const userId = formData.get("userId")

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const data = await pdf(buffer)
    const text = data.text

    console.log("PDF TEXT LENGTH:", text.length)

    const chunks = splitText(text)

    vectorStore.addDocuments(chunks, {
      userId,
      fileName: file.name
    })

    return NextResponse.json({
      success: true,
      chunks: chunks.length
    })

  } catch (error) {

    console.error("Upload Error:", error)

    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    )

  }

}