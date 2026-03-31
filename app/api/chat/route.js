import { NextResponse } from "next/server";
import pdf from "pdf-parse";

export async function POST(req) {
  try {
    const { message, fileUrl } = await req.json();

    if (!fileUrl) {
      return NextResponse.json(
        { error: "No file URL" },
        { status: 400 }
      );
    }

    const fileRes = await fetch(fileUrl);
    const buffer = Buffer.from(await fileRes.arrayBuffer());

    const pdfData = await pdf(buffer);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `PDF:\n${pdfData.text}\n\nQ: ${message}`,
          },
        ],
      }),
    });

    const data = await response.json();

    return NextResponse.json({
      answer: data.choices?.[0]?.message?.content || "No answer",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}