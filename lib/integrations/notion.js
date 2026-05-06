import { getAdminClient } from "@/lib/admin-client";

const API  = "https://api.notion.com/v1";
const VER  = "2022-06-28";

async function getToken(userId) {
  const { data } = await getAdminClient()
    .from("integrations")
    .select("access_token, meta")
    .eq("user_id", userId)
    .eq("provider", "notion")
    .maybeSingle();
  if (!data) throw new Error("Notion not connected. Go to Settings → Integrations → Connect Notion.");
  return { token: data.access_token, meta: data.meta };
}

function headers(token) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Notion-Version": VER };
}

export async function createNotionPage(userId, { title, content, parentPageId }) {
  const { token } = await getToken(userId);
  const parent = parentPageId
    ? { type: "page_id", page_id: parentPageId }
    : { type: "workspace", workspace: true };

  const blocks = content
    .split("\n\n")
    .filter(Boolean)
    .slice(0, 100)
    .map((p) => ({
      object: "block", type: "paragraph",
      paragraph: { rich_text: [{ type: "text", text: { content: p.slice(0, 2000) } }] },
    }));

  const res = await fetch(`${API}/pages`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({
      parent,
      properties: { title: { title: [{ type: "text", text: { content: title } }] } },
      children: blocks,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Notion create failed: ${data.message}`);
  return { pageId: data.id, url: data.url, title };
}

export async function searchNotionPages(userId, { query }) {
  const { token } = await getToken(userId);
  const res = await fetch(`${API}/search`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ query, filter: { value: "page", property: "object" }, page_size: 5 }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Notion search failed: ${data.message}`);
  return (data.results ?? []).map((p) => ({
    id: p.id, url: p.url,
    title: p.properties?.title?.title?.[0]?.plain_text ?? "Untitled",
    lastEdited: p.last_edited_time,
  }));
}
