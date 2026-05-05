// ── Tool registry ─────────────────────────────────────────────────────────────
// Definitions follow OpenAI function-calling schema.
// Executors receive (args, ctx) where ctx = { supabase, openai, fileUrl, userId }.

const TOP_K   = 5;
const MAX_CTX = 5000;

// ── 1. search_document ────────────────────────────────────────────────────────
async function execSearchDocument({ query }, { supabase, openai, fileUrl }) {
  if (!fileUrl) return "No document is loaded. Ask the user to upload a PDF first.";

  const { data: doc } = await supabase
    .from("documents")
    .select("id, name")
    .eq("file_url", fileUrl)
    .maybeSingle();

  if (!doc?.id) return "Document not found in the knowledge base.";

  const embRes = await openai.embeddings.create({ model: "text-embedding-3-small", input: query });

  const { data: chunks, error } = await supabase.rpc("match_document_chunks", {
    query_embedding:   embRes.data[0].embedding,
    match_document_id: doc.id,
    match_count:       TOP_K,
  });

  if (error || !chunks?.length) return `No relevant content found for "${query}".`;

  const sections = chunks
    .slice(0, 4)
    .map((c, i) => `[Section ${i + 1}]\n${c.content.trim()}`)
    .join("\n\n");

  return `Document: "${doc.name}"\n\n${sections}`;
}

// ── 2. web_search ─────────────────────────────────────────────────────────────
async function execWebSearch({ query }) {
  const serperKey = process.env.SERPER_API_KEY;
  const braveKey  = process.env.BRAVE_SEARCH_API_KEY;

  try {
    if (serperKey) {
      const res  = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
        body: JSON.stringify({ q: query, num: 5 }),
      });
      const data = await res.json();
      const hits = (data.organic ?? []).slice(0, 4);
      if (hits.length) return hits.map((r) => `• ${r.title}\n  ${r.snippet}`).join("\n\n");
    }

    if (braveKey) {
      const res  = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
        { headers: { Accept: "application/json", "X-Subscription-Token": braveKey } },
      );
      const data = await res.json();
      const hits = (data.web?.results ?? []).slice(0, 4);
      if (hits.length) return hits.map((r) => `• ${r.title}\n  ${r.description}`).join("\n\n");
    }

    const res  = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
      { headers: { "User-Agent": "Intellixy/1.0" } },
    );
    const data = await res.json();
    const parts = [data.AbstractText].filter(Boolean);
    (data.RelatedTopics ?? []).slice(0, 3).forEach((t) => t.Text && parts.push(t.Text));
    return parts.length ? parts.join("\n\n") : `No results found for "${query}".`;
  } catch (e) {
    return `Web search failed: ${e.message}`;
  }
}

// ── 3. calculate ──────────────────────────────────────────────────────────────
function execCalculate({ expression }) {
  const safe = expression.replace(/\s/g, "");
  if (!/^[\d+\-*/.()%^,eE]+$/.test(safe)) {
    return `Unsafe expression rejected: "${expression}". Only arithmetic operators allowed.`;
  }
  try {
    const result = Function('"use strict"; return (' + expression + ')')();
    if (typeof result !== "number" || !isFinite(result)) return `Result: ${result}`;
    const formatted = Number.isInteger(result)
      ? result.toLocaleString()
      : parseFloat(result.toFixed(8)).toLocaleString();
    return `${expression} = ${formatted}`;
  } catch (e) {
    return `Could not evaluate "${expression}": ${e.message}`;
  }
}

// ── 4. get_current_datetime ───────────────────────────────────────────────────
function execGetDatetime({ timezone = "UTC" }) {
  try {
    return new Date().toLocaleString("en-US", {
      timeZone: timezone, weekday: "long", year: "numeric", month: "long",
      day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short",
    });
  } catch {
    return new Date().toUTCString();
  }
}

// ── 5. summarize_document ─────────────────────────────────────────────────────
async function execSummarizeDocument({ aspect = "" }, { supabase, openai, fileUrl }) {
  if (!fileUrl) return "No document is loaded.";

  const { data: doc } = await supabase
    .from("documents").select("id, name").eq("file_url", fileUrl).maybeSingle();

  if (!doc?.id) return "Document not found.";

  const { data: chunks } = await supabase.rpc("match_document_chunks", {
    query_embedding:   Array(1536).fill(0).map((_, i) => Math.sin(i) * 0.001),
    match_document_id: doc.id,
    match_count:       12,
  });

  if (!chunks?.length) return "Could not retrieve document content.";

  let ctx = "";
  for (const c of chunks) {
    if ((ctx + c.content).length > MAX_CTX) break;
    ctx += c.content + "\n\n";
  }

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini", temperature: 0.2, max_tokens: 500,
    messages: [
      { role: "system", content: "You are a document summariser. Write in plain prose, no markdown." },
      { role: "user",   content: `Summarise this document${aspect ? ` focusing on ${aspect}` : ""}.\n\nDOCUMENT:\n${ctx}` },
    ],
  });

  return res.choices[0].message.content ?? "Summary unavailable.";
}

// ── 6. send_email (SENSITIVE — queued for confirmation) ───────────────────────
async function execSendEmail({ to, subject, body, cc }, { userId }) {
  // Actual send is handled by the worker after user confirms.
  // This function is never called directly — see SENSITIVE_TOOLS handling in route.js.
  return `Email to ${to} queued for confirmation.`;
}

// ── 7. create_calendar_event (SENSITIVE) ──────────────────────────────────────
async function execCreateCalendarEvent({ title, startTime, endTime, description, attendees }, { userId }) {
  return `Calendar event "${title}" queued for confirmation.`;
}

// ── 8. send_slack_message (SENSITIVE) ─────────────────────────────────────────
async function execSendSlack({ channel, text }, { userId }) {
  return `Slack message to ${channel} queued for confirmation.`;
}

// ── 9. create_notion_page (SENSITIVE) ────────────────────────────────────────
async function execCreateNotion({ title, content }, { userId }) {
  return `Notion page "${title}" queued for confirmation.`;
}

// ── 10. list_jobs ─────────────────────────────────────────────────────────────
async function execListJobs({ status }, { userId }) {
  const { listJobs } = await import("@/lib/platform-jobs");
  const jobs = await listJobs(userId, { status: status ?? undefined, limit: 10 });
  if (!jobs.length) return "No jobs found.";
  return jobs
    .map((j) => `• [${j.status.toUpperCase()}] ${j.name} (${j.type}) — ${new Date(j.created_at).toLocaleString()}`)
    .join("\n");
}

// ── 11. schedule_reminder ────────────────────────────────────────────────────
async function execScheduleReminder({ title, remindAt, description }, { userId }) {
  const { getAdminClient } = await import("@/lib/admin-client");
  await getAdminClient().from("reminders").insert({
    user_id: userId, title, description: description ?? "", remind_at: new Date(remindAt).toISOString(),
  });
  return `Reminder "${title}" scheduled for ${new Date(remindAt).toLocaleString()}.`;
}

// ── 12. search_emails ─────────────────────────────────────────────────────────
async function execSearchEmails({ query, maxResults = 5 }, { userId }) {
  const { searchEmails } = await import("@/lib/integrations/gmail");
  const results = await searchEmails(userId, { query, maxResults });
  if (!results.length) return `No emails found for "${query}".`;
  return results.map((m) => `• From: ${m.from}\n  Subject: ${m.subject}\n  ${m.snippet}`).join("\n\n");
}

// ── 13. list_calendar_events ──────────────────────────────────────────────────
async function execListCalendarEvents({ days = 7 }, { userId }) {
  const { listUpcomingEvents } = await import("@/lib/integrations/google-calendar");
  const events = await listUpcomingEvents(userId, { days });
  if (!events.length) return "No upcoming events found.";
  return events.map((e) => `• ${e.title} — ${new Date(e.start).toLocaleString()}`).join("\n");
}

// ── 14. search_notion ─────────────────────────────────────────────────────────
async function execSearchNotion({ query }, { userId }) {
  const { searchNotionPages } = await import("@/lib/integrations/notion");
  const pages = await searchNotionPages(userId, { query });
  if (!pages.length) return `No Notion pages found for "${query}".`;
  return pages.map((p) => `• ${p.title} — ${p.url}`).join("\n");
}

// ── Dispatcher ────────────────────────────────────────────────────────────────
export async function executeTool(name, args, ctx) {
  switch (name) {
    case "search_document":       return execSearchDocument(args, ctx);
    case "web_search":            return execWebSearch(args);
    case "calculate":             return execCalculate(args);
    case "get_current_datetime":  return execGetDatetime(args);
    case "summarize_document":    return execSummarizeDocument(args, ctx);
    case "send_email":            return execSendEmail(args, ctx);
    case "create_calendar_event": return execCreateCalendarEvent(args, ctx);
    case "send_slack_message":    return execSendSlack(args, ctx);
    case "create_notion_page":    return execCreateNotion(args, ctx);
    case "list_jobs":             return execListJobs(args, ctx);
    case "schedule_reminder":     return execScheduleReminder(args, ctx);
    case "search_emails":         return execSearchEmails(args, ctx);
    case "list_calendar_events":  return execListCalendarEvents(args, ctx);
    case "search_notion":         return execSearchNotion(args, ctx);
    default: throw new Error(`Unknown tool: ${name}`);
  }
}

// Tools that require user confirmation before running
export const SENSITIVE_TOOLS = new Set([
  "send_email",
  "create_calendar_event",
  "send_slack_message",
  "create_notion_page",
]);

// ── OpenAI function definitions ───────────────────────────────────────────────
export const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "search_document",
      description: "Semantically search the uploaded PDF for relevant sections.",
      parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
    },
  },
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the internet for current information or general knowledge.",
      parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate",
      description: "Evaluate a mathematical expression: arithmetic, percentages, totals.",
      parameters: { type: "object", properties: { expression: { type: "string" } }, required: ["expression"] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_current_datetime",
      description: "Get the current date and time, optionally in a specific timezone.",
      parameters: { type: "object", properties: { timezone: { type: "string", description: "IANA timezone, e.g. 'Asia/Kolkata'" } }, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "summarize_document",
      description: "Generate a comprehensive summary of the uploaded document.",
      parameters: { type: "object", properties: { aspect: { type: "string" } }, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "send_email",
      description: "Send an email via Gmail. Requires Google integration. User must confirm before sending.",
      parameters: {
        type: "object",
        properties: {
          to:      { type: "string", description: "Recipient email address" },
          subject: { type: "string" },
          body:    { type: "string", description: "Plain text email body" },
          cc:      { type: "string", description: "Optional CC email" },
        },
        required: ["to", "subject", "body"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_calendar_event",
      description: "Create a Google Calendar event. Requires Google integration. User must confirm.",
      parameters: {
        type: "object",
        properties: {
          title:       { type: "string" },
          startTime:   { type: "string", description: "ISO 8601 datetime" },
          endTime:     { type: "string", description: "ISO 8601 datetime" },
          description: { type: "string" },
          attendees:   { type: "array", items: { type: "string" }, description: "List of attendee emails" },
          timeZone:    { type: "string" },
        },
        required: ["title", "startTime", "endTime"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_slack_message",
      description: "Send a Slack message to a channel. Requires Slack integration. User must confirm.",
      parameters: {
        type: "object",
        properties: {
          channel: { type: "string", description: "Channel name or ID, e.g. #general" },
          text:    { type: "string", description: "Message text" },
        },
        required: ["channel", "text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_notion_page",
      description: "Create a Notion page. Requires Notion integration. User must confirm.",
      parameters: {
        type: "object",
        properties: {
          title:        { type: "string" },
          content:      { type: "string", description: "Page body text" },
          parentPageId: { type: "string", description: "Optional parent page ID" },
        },
        required: ["title", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_jobs",
      description: "List the user's background jobs and their statuses.",
      parameters: {
        type: "object",
        properties: { status: { type: "string", enum: ["pending", "running", "completed", "failed", "awaiting_confirmation"] } },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "schedule_reminder",
      description: "Schedule a reminder for a future date and time.",
      parameters: {
        type: "object",
        properties: {
          title:       { type: "string" },
          remindAt:    { type: "string", description: "ISO 8601 datetime" },
          description: { type: "string" },
        },
        required: ["title", "remindAt"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_emails",
      description: "Search Gmail inbox. Requires Google integration.",
      parameters: {
        type: "object",
        properties: {
          query:      { type: "string", description: "Gmail search query, e.g. 'from:boss@company.com subject:report'" },
          maxResults: { type: "number" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_calendar_events",
      description: "List upcoming Google Calendar events. Requires Google integration.",
      parameters: {
        type: "object",
        properties: { days: { type: "number", description: "How many days ahead to look (default 7)" } },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_notion",
      description: "Search Notion workspace for pages. Requires Notion integration.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
];

export const TOOL_META = {
  search_document:       { icon: "🔍", label: "Searching document",   sensitive: false },
  web_search:            { icon: "🌐", label: "Searching web",         sensitive: false },
  calculate:             { icon: "🧮", label: "Calculating",           sensitive: false },
  get_current_datetime:  { icon: "🕐", label: "Getting time",          sensitive: false },
  summarize_document:    { icon: "📄", label: "Summarising document",  sensitive: false },
  send_email:            { icon: "📧", label: "Sending email",         sensitive: true  },
  create_calendar_event: { icon: "📅", label: "Creating event",        sensitive: true  },
  send_slack_message:    { icon: "💬", label: "Sending Slack message", sensitive: true  },
  create_notion_page:    { icon: "📝", label: "Creating Notion page",  sensitive: true  },
  list_jobs:             { icon: "📋", label: "Checking jobs",         sensitive: false },
  schedule_reminder:     { icon: "⏰", label: "Scheduling reminder",   sensitive: false },
  search_emails:         { icon: "📬", label: "Searching emails",      sensitive: false },
  list_calendar_events:  { icon: "🗓",  label: "Checking calendar",    sensitive: false },
  search_notion:         { icon: "🗃",  label: "Searching Notion",     sensitive: false },
};
