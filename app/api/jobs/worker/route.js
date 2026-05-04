import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { getPendingJobs, updateJob, addLog, scheduleRetry } from "@/lib/platform-jobs";
import { sendEmail } from "@/lib/integrations/gmail";
import { createCalendarEvent } from "@/lib/integrations/google-calendar";
import { sendSlackMessage } from "@/lib/integrations/slack";
import { createNotionPage } from "@/lib/integrations/notion";
import { getOpenAI } from "@/lib/openai-client";


// POST /api/jobs/worker — process pending platform_jobs
// Called by cron (Authorization: Bearer <CRON_SECRET>) or authenticated user
export async function POST(req) {
  const authHeader = req.headers.get("authorization") ?? "";
  const cronOk     = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!cronOk) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobs    = await getPendingJobs(5);
  const results = [];

  for (const job of jobs) {
    try {
      await processJob(job);
      results.push({ id: job.id, name: job.name, status: "processed" });
    } catch (err) {
      results.push({ id: job.id, name: job.name, status: "error", error: err.message });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}

// GET — for cron compatibility (same logic)
export const GET = POST;

// ── Job dispatcher ────────────────────────────────────────────────────────────

async function processJob(job) {
  await updateJob(job.id, { status: "running", started_at: new Date().toISOString() });
  await addLog(job.id, "info", `Started: ${job.name}`);

  try {
    let result;
    switch (job.type) {
      case "send_email":            result = await doSendEmail(job);         break;
      case "create_calendar_event": result = await doCreateEvent(job);       break;
      case "send_slack_message":    result = await doSendSlack(job);         break;
      case "create_notion_page":    result = await doCreateNotion(job);      break;
      case "pipeline":              result = await doPipeline(job);          break;
      default: throw new Error(`Unknown job type: ${job.type}`);
    }
    await updateJob(job.id, { status: "completed", result, completed_at: new Date().toISOString() });
    await addLog(job.id, "info", "Completed", result);
  } catch (err) {
    await scheduleRetry(job, err.message);
  }
}

// ── Individual runners ────────────────────────────────────────────────────────

function doSendEmail(job) {
  return sendEmail(job.user_id, job.payload);
}

function doCreateEvent(job) {
  return createCalendarEvent(job.user_id, job.payload);
}

function doSendSlack(job) {
  return sendSlackMessage(job.user_id, job.payload);
}

function doCreateNotion(job) {
  return createNotionPage(job.user_id, job.payload);
}

// ── Pipeline: multi-step with template substitution ───────────────────────────

async function doPipeline(job) {
  const steps       = job.steps ?? [];
  const stepResults = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    await updateJob(job.id, { current_step: i });
    await addLog(job.id, "info", `Step ${i + 1}/${steps.length}: ${step.type}`, null, i);

    const args = resolveTemplates(step.args ?? {}, stepResults);
    let result;

    switch (step.type) {
      case "send_email":            result = await sendEmail(job.user_id, args);            break;
      case "create_calendar_event": result = await createCalendarEvent(job.user_id, args);  break;
      case "send_slack_message":    result = await sendSlackMessage(job.user_id, args);     break;
      case "create_notion_page":    result = await createNotionPage(job.user_id, args);     break;
      case "ai_summarize":          result = await doAISummarize(args);                     break;
      default: throw new Error(`Unknown pipeline step: ${step.type}`);
    }

    stepResults.push({ type: step.type, result });
    await addLog(job.id, "info", `Step ${i + 1} done`, result, i);
  }

  return { steps: stepResults };
}

// Replace {{stepN.result}} and {{stepN.result.field}} in stringified args
function resolveTemplates(args, stepResults) {
  const str = JSON.stringify(args);
  const out = str.replace(/\{\{step(\d+)\.result(?:\.(\w+))?\}\}/g, (_, idx, field) => {
    const res = stepResults[parseInt(idx)]?.result;
    if (!res) return "";
    if (field) return String(res[field] ?? "");
    return typeof res === "string" ? res : JSON.stringify(res);
  });
  return JSON.parse(out);
}

async function doAISummarize({ text, maxTokens = 400 }) {
  const res = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini", temperature: 0.2, max_tokens: maxTokens,
    messages: [
      { role: "system", content: "Summarize the following in plain prose, no markdown." },
      { role: "user",   content: text },
    ],
  });
  return res.choices[0].message.content;
}
