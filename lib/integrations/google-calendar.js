import { getAdminClient } from "@/lib/admin-client";

async function validToken(userId) {
  const { data } = await getAdminClient()
    .from("integrations")
    .select("access_token, refresh_token, token_expires_at")
    .eq("user_id", userId)
    .eq("provider", "google")
    .single();
  if (!data) throw new Error("Google not connected. Go to Settings → Integrations → Connect Google.");
  const expired = data.token_expires_at && new Date(data.token_expires_at) < new Date(Date.now() + 60_000);
  if (expired && data.refresh_token) {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token", refresh_token: data.refresh_token,
        client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    });
    const tok = await res.json();
    if (!res.ok) throw new Error(`Token refresh failed: ${tok.error}`);
    await getAdminClient().from("integrations").update({
      access_token: tok.access_token,
      token_expires_at: new Date(Date.now() + tok.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId).eq("provider", "google");
    return tok.access_token;
  }
  return data.access_token;
}

export async function createCalendarEvent(userId, { title, description, startTime, endTime, attendees = [], timeZone = "UTC" }) {
  const token = await validToken(userId);
  const body = {
    summary:     title,
    description: description ?? "",
    start: { dateTime: new Date(startTime).toISOString(), timeZone },
    end:   { dateTime: new Date(endTime).toISOString(),   timeZone },
    attendees: attendees.map((email) => ({ email })),
    reminders:   { useDefault: true },
  };
  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Calendar event failed: ${data.error?.message}`);
  return { eventId: data.id, htmlLink: data.htmlLink, title: data.summary, start: data.start };
}

export async function listUpcomingEvents(userId, { maxResults = 5, days = 7 } = {}) {
  const token = await validToken(userId);
  const timeMin = encodeURIComponent(new Date().toISOString());
  const timeMax = encodeURIComponent(new Date(Date.now() + days * 86_400_000).toISOString());
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`Calendar list failed: ${data.error?.message}`);
  return (data.items ?? []).map((e) => ({
    id: e.id, title: e.summary,
    start: e.start?.dateTime ?? e.start?.date,
    end:   e.end?.dateTime   ?? e.end?.date,
    description: e.description, link: e.htmlLink,
  }));
}
