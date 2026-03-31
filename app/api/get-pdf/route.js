import supabase from "@/lib/supabase";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const docId = searchParams.get("docId");

  const { data } = await supabase
    .from("documents")
    .select("file_path")
    .eq("id", docId)
    .single();

  const { data: file } = await supabase.storage
    .from("pdfs")
    .download(data.file_path);

  return new Response(file, {
    headers: {
      "Content-Type": "application/pdf",
    },
  });
}