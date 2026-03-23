import { NextResponse } from "next/server";
import pdf from "pdf-parse";
import OpenAI from "openai";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const question = formData.get("question");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract PDF text
    const data = await pdf(buffer);
    const text = data.text;

    // OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Answer based on the PDF content only",
        },
        {
          role: "user",
          content: `PDF Content:\n${text}\n\nQuestion: ${question}`,
        },
      ],
    });

    return NextResponse.json({
      answer: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}