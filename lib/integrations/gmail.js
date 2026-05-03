import { createClient } from "@supabase/supabase-js";

const admin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

async function getTokens(userId) {
  const { data } = await admin()
    .from("integrations")
    .select("access_token, refresh_token, token_expires_at")
    .eq("user_id", userId)
    .eq("provider", "google")
    .single();
  if (!data) throw new Error("Google not connected. Go to Settings → Integrations → Connect Google.");
  return data;
}

async function refreshToken(userId, refreshToken) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type:    "refresh_token",
      refresh_token: refreshToken,
      client_id:     process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  });
  const tok = await res.json();
  if (!res.ok) throw new Error(`Google token refresh failed: ${tok.error_description ?? tok.error}`);
  const expiresAt = new Date(Date.now() + tok.expires_in * 1000).toISOString();
  await admin()
    .from("integrations")
    .update({ access_token: tok.access_token, token_expires_at: expiresAt, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("provider", "google");
  return tok.access_token;
}

async function validToken(userId) {
  const { access_token, refresh_token, token_expires_at } = await getTokens(userId);
  const expired = token_expires_at && new Date(token_expires_at) < new Date(Date.now() + 60_000);
  if (expired && refresh_token) return refreshToken(userId, refresh_token);
  return access_token;
}

export async function sendEmail(userId, { to, subject, body, cc, bcc }) {
  const token = await validToken(userId);
  const lines = [
    `To: ${to}`,
    cc  ? `Cc: ${cc}`   : null,
    bcc ? `Bcc: ${bcc}` : null,
    `Subject: ${subject}`,
    `Content-Type: text/plain; charset=UTF-8`,
    ``,
    body,
  ].filter(Boolean);
  const raw = Buffer.from(lines.join("\r\n")).toString("base64url");
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Gmail send failed: ${data.error?.message}`);
  return { messageId: data.id, threadId: data.threadId, to, subject };
}

export async function searchEmails(userId, { query, maxResults = 5 }) {
  const token = await validToken(userId);
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const listData = await listRes.json();
  if (!listRes.ok) throw new Error(`Gmail search failed: ${listData.error?.message}`);
  const messages = listData.messages ?? [];
  return Promise.all(
    messages.slice(0, maxResults).map(async ({ id }) => {
      const r = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const m = await r.json();
      const h = (name) => (m.payload?.headers ?? []).find((x) => x.name === name)?.value ?? "";
      return { id, from: h("From"), subject: h("Subject"), date: h("Date"), snippet: m.snippet };
    }),
  );
}
