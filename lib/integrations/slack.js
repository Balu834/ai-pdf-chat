import { getAdminClient } from "@/lib/admin-client";

async function getToken(userId) {
  const { data } = await getAdminClient()
    .from("integrations")
    .select("access_token, meta")
    .eq("user_id", userId)
    .eq("provider", "slack")
    .maybeSingle();
  if (!data) throw new Error("Slack not connected. Go to Settings → Integrations → Connect Slack.");
  return data.access_token;
}

export async function sendSlackMessage(userId, { channel, text, blocks }) {
  const token = await getToken(userId);
  const payload = { channel, text };
  if (blocks) payload.blocks = blocks;
  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Slack error: ${data.error}`);
  return { ts: data.ts, channel: data.channel, text };
}

export async function listChannels(userId) {
  const token = await getToken(userId);
  const res = await fetch(
    "https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=50&exclude_archived=true",
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = await res.json();
  if (!data.ok) throw new Error(`Slack error: ${data.error}`);
  return (data.channels ?? []).map((c) => ({ id: c.id, name: c.name, isPrivate: c.is_private }));
}

export async function sendDM(userId, { userEmail, text }) {
  const token = await getToken(userId);
  const lookup = await fetch(
    `https://slack.com/api/users.lookupByEmail?email=${encodeURIComponent(userEmail)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const lu = await lookup.json();
  if (!lu.ok) throw new Error(`Slack user not found: ${lu.error}`);
  const open = await fetch("https://slack.com/api/conversations.open", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ users: lu.user.id }),
  });
  const ch = await open.json();
  if (!ch.ok) throw new Error(`Could not open DM: ${ch.error}`);
  return sendSlackMessage(userId, { channel: ch.channel.id, text });
}
