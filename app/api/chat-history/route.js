import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req) {

  const { document } = await req.json()

  const { data } = await supabase.auth.getSession()

  const userId = data?.session?.user?.id

  if (!userId) {
    return NextResponse.json([])
  }

  const { data: chats } = await supabase
    .from("chats")
    .select("*")
    .eq("user_id", userId)
    .eq("document_name", document)
    .order("created_at", { ascending: true })

  return NextResponse.json(chats)

}