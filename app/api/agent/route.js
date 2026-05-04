import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai-client";
import { createClient } from "@/lib/supabase-server-client";
import { checkQuestionLimit, recordQuestion, FREE_PLAN } from "@/lib/limits";
import { deductCredit } from "@/lib/credits";
import { createJob } from "@/lib/platform-jobs";
import { TOOL_DEFINITIONS, SENSITIVE_TOOLS, executeTool } from "./tools";


const MAX_TOOL_ROUNDS = 6;
const MAX_TOKENS_TOOL  = 800;
const MAX_TOKENS_REPLY = 900;

const SSE = {
  "Content-Type":           "text/event-stream; charset=utf-8",
  "Cache-Control":          "no-cache, no-transform",
  "X-Accel-Buffering":      "no",
  "X-Content-Type-Options": "nosniff",
};

const SYSTEM_PROMPT = `You are Intellixy, an intelligent AI agent with access to tools — use them proactively.

Tool usage guidelines:
- search_document: any question about an uploaded PDF
- web_search: current events, general knowledge, facts not in the document
- calculate: arithmetic, percentages, totals, conversions
- get_current_datetime: any question about today's date or current time
- summarize_document: when asked for a document overview or summary
- send_email: send an email via Gmail (user must confirm)
- create_calendar_event: create a Google Calendar event (user must confirm)
- send_slack_message: send a Slack message (user must confirm)
- create_notion_page: save content to Notion (user must confirm)
- list_jobs: check status of background jobs
- schedule_reminder: set a reminder for a future date
- search_emails: search Gmail inbox
- list_calendar_events: check upcoming Google Calendar events
- search_notion: search Notion workspace

Rules:
- Always use a tool when it would produce a more accurate answer
- Chain tools when needed (e.g. search → calculate)
- Cite specific information from tool results
- Never fabricate numbers, dates, or facts — use tools
- For send_email / send_slack_message / create_calendar_event / create_notion_page: always confirm the details with the user before calling the tool
- Keep final responses conversational and clear (2–5 sentences when possible)
- Do NOT use markdown formatting — plain prose only`;

/* ─── POST /api/agent ──────────────────────────────────────────────────────────
  Body: { message, history, fileUrl? }

  SSE events:
    {"t":"think"}
    {"t":"tc","id":"…","name":"…","args":{}}
    {"t":"tr","id":"…","name":"…","res":"…","ms":234,"err":false}
    {"t":"confirm","jobId":"…","tool":"…","preview":"…","args":{}}
    {"t":"tok","c":"…"}
    {"t":"err","msg":"…"}
    [DONE]
──────────────────────────────────────────────────────────────────────────────*/
export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

    const { message, history = [], fileUrl = null } = body;
    if (!message?.trim()) return NextResponse.json({ error: "message required" }, { status: 400 });

    // ── Rate limit ────────────────────────────────────────────────────────────
    const { exceeded } = await checkQuestionLimit(supabase, user.id);
    if (exceeded) {
      const credited = await deductCredit(user.id);
      if (!credited) {
        const enc = new TextEncoder();
        return new Response(
          new ReadableStream({
            start(ctrl) {
              const msg = `You have reached your limit of ${FREE_PLAN.maxQuestions} questions. Please upgrade to continue.`;
              ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ t: "tok", c: msg })}\n\n`));
              ctrl.enqueue(enc.encode("data: [DONE]\n\n"));
              ctrl.close();
            },
          }),
          { headers: SSE },
        );
      }
    }

    await recordQuestion(supabase, user.id);

    const ctx  = { supabase, openai, fileUrl, userId: user.id };
    const msgs = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(-10).map(({ role, content }) => ({ role, content })),
      { role: "user", content: message.trim() },
    ];

    const encoder = new TextEncoder();
    const stream  = new ReadableStream({
      async start(controller) {
        function emit(obj) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        }

        try {
          let rounds = 0;

          while (rounds < MAX_TOOL_ROUNDS) {
            rounds++;
            emit({ t: "think" });

            const decision = await getOpenAI().chat.completions.create({
              model:       "gpt-4o-mini",
              messages:    msgs,
              tools:       TOOL_DEFINITIONS,
              tool_choice: "auto",
              temperature: 0.3,
              max_tokens:  MAX_TOKENS_TOOL,
            });

            const choice  = decision.choices[0];
            const aiMsg   = choice.message;

            if (choice.finish_reason === "tool_calls" && aiMsg.tool_calls?.length) {
              msgs.push({ role: "assistant", content: aiMsg.content ?? null, tool_calls: aiMsg.tool_calls });

              const executions = aiMsg.tool_calls.map(async (tc) => {
                const name = tc.function.name;
                let args;
                try { args = JSON.parse(tc.function.arguments); } catch { args = {}; }

                emit({ t: "tc", id: tc.id, name, args });

                // ── Sensitive tool → queue for confirmation ────────────────
                if (SENSITIVE_TOOLS.has(name)) {
                  const preview = buildPreview(name, args);
                  const job     = await createJob(user.id, {
                    name:    preview,
                    type:    name,
                    payload: args,
                    status:  "awaiting_confirmation",
                  }).catch(() => null);

                  const jobId = job?.id ?? null;
                  emit({ t: "confirm", jobId, tool: name, preview, args });

                  const confirmMsg = jobId
                    ? `Queued for confirmation (job ${jobId}). I've asked you to approve before proceeding.`
                    : `This action requires your confirmation before I can proceed.`;

                  emit({ t: "tr", id: tc.id, name, res: confirmMsg, ms: 0, err: false });
                  return { id: tc.id, content: confirmMsg };
                }

                // ── Regular tool → execute immediately ─────────────────────
                const t0 = Date.now();
                let result = "", err = false;
                try {
                  result = await executeTool(name, args, ctx);
                } catch (e) {
                  result = `Tool error: ${e.message}`;
                  err    = true;
                }
                const ms = Date.now() - t0;
                emit({ t: "tr", id: tc.id, name, res: result.slice(0, 800), ms, err });
                return { id: tc.id, content: result };
              });

              const results = await Promise.all(executions);
              for (const r of results) {
                msgs.push({ role: "tool", tool_call_id: r.id, content: r.content });
              }
              continue;
            }

            // ── Direct answer ─────────────────────────────────────────────
            const content = aiMsg.content ?? "";
            if (content) {
              for (const w of content.split(/(\s+)/)) {
                if (w) emit({ t: "tok", c: w });
              }
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }
            break;
          }

          // ── Final streaming reply ─────────────────────────────────────────
          if (rounds >= MAX_TOOL_ROUNDS) {
            msgs.push({ role: "user", content: "Please provide your final answer now." });
          }

          const finalStream = await getOpenAI().chat.completions.create({
            model: "gpt-4o-mini", messages: msgs, stream: true, temperature: 0.4, max_tokens: MAX_TOKENS_REPLY,
          });

          for await (const chunk of finalStream) {
            const tok = chunk.choices[0]?.delta?.content;
            if (tok) emit({ t: "tok", c: tok });
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (err) {
          emit({ t: "err", msg: err?.message ?? "Agent error" });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, { headers: SSE });
  } catch (err) {
    console.error("[agent]", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildPreview(tool, args) {
  switch (tool) {
    case "send_email":
      return `Send email to ${args.to} — "${args.subject}"`;
    case "create_calendar_event":
      return `Create event "${args.title}" at ${args.startTime}`;
    case "send_slack_message":
      return `Post Slack message to ${args.channel}: "${args.text?.slice(0, 60)}"`;
    case "create_notion_page":
      return `Create Notion page "${args.title}"`;
    default:
      return tool;
  }
}
