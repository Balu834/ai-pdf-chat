/**
 * lib/tools.js — Agent tool registry
 *
 * Each tool has: name, description, openaiSchema (for function-calling), execute(args)
 * Tools receive pre-fetched pdf_text in args — fetching happens in the runner/engine.
 */

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const FROM   = process.env.EMAIL_FROM || "Intellixy <noreply@intellixy.in>";

// ── Tool: summarize_pdf ───────────────────────────────────────────────────────

export const summarize_pdf = {
  name: "summarize_pdf",
  description: "Summarize a PDF document into concise structured output",
  openaiSchema: {
    type: "function",
    function: {
      name: "summarize_pdf",
      description: "Summarize a PDF document",
      parameters: {
        type: "object",
        properties: {
          style: {
            type: "string",
            enum: ["bullet", "paragraph", "executive"],
            description: "bullet = 5–7 bullets, paragraph = 2–3 paragraphs, executive = Overview + Key Points + Actions",
          },
        },
        required: [],
      },
    },
  },
  async execute({ pdf_text, style = "bullet" }) {
    if (!pdf_text) throw new Error("pdf_text is required for summarize_pdf");
    const stylePrompt = {
      bullet:    "Return exactly 5–7 concise bullet points (use • symbol). Each bullet ≤ 15 words.",
      paragraph: "Return a 2–3 paragraph professional summary.",
      executive: "Return: **Overview** (2 sentences), **Key Points** (3–5 bullets), **Action Items** (2–3 bullets).",
    }[style] ?? "Return a bullet point summary.";

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 700,
      messages: [
        { role: "system", content: `You are a precise document summarizer. ${stylePrompt} Be accurate and brief.` },
        { role: "user",   content: `Summarize this document:\n\n${pdf_text.slice(0, 9000)}` },
      ],
    });
    return { summary: resp.choices[0].message.content, style };
  },
};

// ── Tool: extract_fields ──────────────────────────────────────────────────────

export const extract_fields = {
  name: "extract_fields",
  description: "Extract specific named fields from a PDF document as structured JSON",
  openaiSchema: {
    type: "function",
    function: {
      name: "extract_fields",
      description: "Extract structured fields from a PDF",
      parameters: {
        type: "object",
        properties: {
          fields: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name:        { type: "string" },
                description: { type: "string" },
                type:        { type: "string", enum: ["string", "number", "date", "boolean", "array"] },
              },
              required: ["name"],
            },
            description: "Fields to extract",
          },
        },
        required: ["fields"],
      },
    },
  },
  async execute({ pdf_text, fields }) {
    if (!pdf_text)   throw new Error("pdf_text is required for extract_fields");
    if (!fields?.length) throw new Error("fields array is required");

    const fieldList = fields.map((f) => `- "${f.name}": ${f.description ?? ""} (${f.type ?? "string"})`).join("\n");

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 1000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Extract the following fields from the document. Return valid JSON with field names as keys. " +
            "Use null for fields not found. Dates in ISO 8601 format. Numbers as numeric types.",
        },
        {
          role: "user",
          content: `Fields to extract:\n${fieldList}\n\nDocument:\n${pdf_text.slice(0, 9000)}`,
        },
      ],
    });
    const extracted = JSON.parse(resp.choices[0].message.content);
    return extracted;
  },
};

// ── Tool: send_email ──────────────────────────────────────────────────────────

export const send_email = {
  name: "send_email",
  description: "Send an email to a recipient",
  openaiSchema: {
    type: "function",
    function: {
      name: "send_email",
      description: "Send an email",
      parameters: {
        type: "object",
        properties: {
          to:      { type: "string", description: "Recipient email address" },
          subject: { type: "string" },
          body:    { type: "string", description: "HTML or plain-text email body" },
        },
        required: ["to", "subject", "body"],
      },
    },
  },
  async execute({ to, subject, body }) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY not configured");
    if (!to || !subject) throw new Error("to and subject are required");

    const html = body.includes("<") ? body : `<pre style="font-family:sans-serif;white-space:pre-wrap">${body}</pre>`;
    const res = await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body:    JSON.stringify({ from: FROM, to, subject, html }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Email failed: ${res.status} — ${JSON.stringify(err)}`);
    }
    const data = await res.json();
    return { sent: true, message_id: data.id, to };
  },
};

// ── Tool: call_webhook ────────────────────────────────────────────────────────

export const call_webhook = {
  name: "call_webhook",
  description: "Send an HTTP POST request to a webhook URL with a JSON payload",
  openaiSchema: {
    type: "function",
    function: {
      name: "call_webhook",
      description: "POST JSON payload to a webhook URL",
      parameters: {
        type: "object",
        properties: {
          url:     { type: "string", description: "HTTPS webhook URL" },
          payload: { type: "object", description: "JSON payload to send" },
          method:  { type: "string", enum: ["POST", "PUT"], default: "POST" },
        },
        required: ["url", "payload"],
      },
    },
  },
  async execute({ url, payload, method = "POST" }) {
    if (!url.startsWith("https://")) throw new Error("Webhook URL must start with https://");

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", "X-Source": "intellixy-agent" },
      body:    JSON.stringify(payload),
      signal:  AbortSignal.timeout(15_000),
    });
    const text = await res.text().catch(() => "");
    return { status: res.status, ok: res.ok, response: text.slice(0, 500) };
  },
};

// ── Registry ──────────────────────────────────────────────────────────────────

export const TOOLS = {
  summarize_pdf,
  extract_fields,
  send_email,
  call_webhook,
};

export const TOOL_LIST = Object.values(TOOLS);

export const TOOL_OPENAI_SCHEMAS = TOOL_LIST.map((t) => t.openaiSchema);

// Descriptions for UI rendering — exported from client-safe module
export { TOOL_LABELS } from "./tool-labels.js";
