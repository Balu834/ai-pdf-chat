import { NextResponse } from "next/server"
import { vectorStore } from "@/lib/vectorStore"

export async function GET() {

  const docs = vectorStore.getDocuments()

  return NextResponse.json({
    documents: docs
  })

}