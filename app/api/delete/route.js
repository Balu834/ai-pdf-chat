import fs from "fs"
import path from "path"

export async function POST(req) {

  try {

    const body = await req.json()
    const id = body.id

    if (!id) {
      return Response.json({ error: "Missing id" }, { status: 400 })
    }

    const filePath = path.join(process.cwd(), "public", "uploads", id)

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    return Response.json({ success: true })

  } catch (error) {

    return Response.json({ error: "Delete failed" }, { status: 500 })

  }

}