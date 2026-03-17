import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const uploadDir = path.join(process.cwd(), "uploads");

export async function GET() {
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }

    const files = fs.readdirSync(uploadDir);

    const documents = files.map((file, index) => ({
      id: index + 1,
      name: file,
      path: `/uploads/${file}`
    }));

    return NextResponse.json({ documents });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ documents: [] });
  }
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const files = fs.readdirSync(uploadDir);

  const file = files[id - 1];

  if (file) {
    fs.unlinkSync(path.join(uploadDir, file));
  }

  return NextResponse.json({ success: true });
}