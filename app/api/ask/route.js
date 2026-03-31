import { NextResponse } from "next/server";
import fs from "fs";
import pdfParse from "pdf-parse";

export async function POST(req) {
  try {
    const body = await req.json();

    const { question, filePath } = body;

    // ❌ SAFETY CHECK
    if (!filePath) {
      return NextResponse.json(
        { error: "No file uploaded yet" },
        { status: 400 }
      );
    }

    // ✅ READ PDF
    const dataBuffer = fs.readFileSync(filePath);

    // ✅ EXTRACT TEXT
    const pdfData = await pdfParse(dataBuffer);

    const text = pdfData.text;

    // ✅ SIMPLE ANSWER (NO OPENAI YET)
    const answer = text.slice(0, 1000);

    return NextResponse.json({
      answer,
    });

  } catch (error) {
    console.error("ASK API ERROR:", error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}