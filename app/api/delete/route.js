import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req) {

  try {

    const { document } = await req.json()

    const { data } = await supabase.auth.getUser()

    if (!data?.user) {
      return NextResponse.json({ error: "Not authenticated" })
    }

    const userId = data.user.id

    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("user_id", userId)
      .eq("document_name", document)

    if (error) {
      return NextResponse.json({ error: "Delete failed" })
    }

    return NextResponse.json({ success: true })

  } catch (error) {

    console.error(error)

    return NextResponse.json({ error: "Server error" })

  }

}