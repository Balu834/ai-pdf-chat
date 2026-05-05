/**
 * lib/workflow-engine.js — Workflow step executor
 *
 * Steps execute sequentially; each step's output is merged into `context`.
 * {{variable}} placeholders in step configs are resolved from context before execution.
 */

import { TOOLS } from "./tools.js";
import { runAgent } from "./agent-runner.js";
import { getAdminClient } from "@/lib/admin-client";

// ── Template resolution ───────────────────────────────────────────────────────

function resolve(value, context) {
  if (typeof value === "string") {
    return value.replace(/\{\{(\w+)\}\}/g, (_, key) => context[key] ?? "");
  }
  if (Array.isArray(value)) return value.map((v) => resolve(v, context));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, resolve(v, context)])
    );
  }
  return value;
}

// ── Step executors ────────────────────────────────────────────────────────────

async function execExtractFields(config, context) {
  const tool = TOOLS.extract_fields;
  const fields = resolve(config.fields, context);
  return tool.execute({ pdf_text: context.pdf_text ?? "", fields });
}

async function execSummarize(config, context) {
  const tool = TOOLS.summarize_pdf;
  const style = resolve(config.style ?? "bullet", context);
  return tool.execute({ pdf_text: context.pdf_text ?? "", style });
}

async function execCondition(config, context) {
  // Simple condition: field <op> value → true/false in output
  const { field, operator = "exists", value } = config;
  const actual = context[field];
  let passed;

  switch (operator) {
    case "exists":   passed = actual != null && actual !== ""; break;
    case "equals":   passed = String(actual) === String(value); break;
    case "contains": passed = String(actual ?? "").includes(String(value)); break;
    case "gt":       passed = Number(actual) > Number(value); break;
    case "lt":       passed = Number(actual) < Number(value); break;
    default:         passed = Boolean(actual);
  }

  return { condition_passed: passed, field, operator, actual, expected: value };
}

async function execSendEmail(config, context) {
  const tool = TOOLS.send_email;
  return tool.execute({
    to:      resolve(config.to, context),
    subject: resolve(config.subject, context),
    body:    resolve(config.body, context),
  });
}

async function execCallWebhook(config, context) {
  const tool = TOOLS.call_webhook;
  return tool.execute({
    url:     resolve(config.url, context),
    payload: resolve(config.payload ?? {}, context),
    method:  config.method ?? "POST",
  });
}

async function execRunAgent(config, context) {
  const supabase = getAdminClient();
  const { data: agent } = await supabase
    .from("agents")
    .select("*")
    .eq("id", config.agent_id)
    .single();

  if (!agent) throw new Error(`Agent ${config.agent_id} not found`);

  const result = await runAgent(agent, {
    task: resolve(config.task ?? "Process this document.", context),
    pdf_text: context.pdf_text ?? "",
    document_id: context.document_id,
    user_id: context.user_id,
  });

  return { agent_output: result.output, agent_status: result.status };
}

const STEP_EXECUTORS = {
  extract_fields: execExtractFields,
  summarize:      execSummarize,
  condition:      execCondition,
  send_email:     execSendEmail,
  call_webhook:   execCallWebhook,
  run_agent:      execRunAgent,
};

// ── Main runner ───────────────────────────────────────────────────────────────

/**
 * Execute a workflow to completion.
 * @param {object} workflow  - Row from workflows table
 * @param {object[]} steps   - Ordered rows from workflow_steps
 * @param {object} inputCtx  - { pdf_text?, document_id?, user_id, ...extra }
 * @returns {{ output: object, step_logs: object[], status: string, error?: string }}
 */
export async function runWorkflow(workflow, steps, inputCtx) {
  const supabase = getAdminClient();
  const context = { ...inputCtx };
  const step_logs = [];
  let status = "completed";
  let error;

  // Create execution record
  const { data: execution } = await supabase
    .from("workflow_executions")
    .insert({
      workflow_id: workflow.id,
      user_id: inputCtx.user_id,
      status: "running",
      input: { document_id: inputCtx.document_id },
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  const execId = execution?.id;

  try {
    for (const step of steps) {
      const executor = STEP_EXECUTORS[step.type];
      if (!executor) {
        step_logs.push({ step_id: step.id, type: step.type, status: "skipped", error: "Unknown step type" });
        continue;
      }

      const stepStart = Date.now();
      let stepResult;
      let stepError;
      let stepStatus = "completed";

      try {
        stepResult = await executor(step.config, context);
        // Merge step output into context under a stable key
        const key = step.config.output_key ?? `step_${step.position}`;
        Object.assign(context, stepResult, { [key]: stepResult });
      } catch (err) {
        stepError = err.message;
        stepStatus = "failed";
        stepResult = null;
        // Conditions failing shouldn't abort the whole workflow
        if (step.type !== "condition") {
          status = "failed";
          error = `Step ${step.position} (${step.type}) failed: ${err.message}`;
          step_logs.push({
            step_id: step.id, type: step.type, position: step.position,
            status: stepStatus, error: stepError, duration_ms: Date.now() - stepStart,
          });
          break;
        }
      }

      step_logs.push({
        step_id: step.id, type: step.type, position: step.position,
        status: stepStatus, result: stepResult, error: stepError ?? null,
        duration_ms: Date.now() - stepStart,
      });
    }
  } catch (err) {
    status = "failed";
    error = err.message;
  }

  // Collect final output (everything except pdf_text to keep it compact)
  const { pdf_text: _drop, ...outputContext } = context;
  const output = outputContext;

  // Update execution record
  if (execId) {
    await supabase
      .from("workflow_executions")
      .update({
        status,
        output,
        step_logs,
        error: error ?? null,
        finished_at: new Date().toISOString(),
      })
      .eq("id", execId);
  }

  // Bump runs_count
  if (status === "completed") {
    await supabase
      .from("workflows")
      .update({ runs_count: (workflow.runs_count ?? 0) + 1, updated_at: new Date().toISOString() })
      .eq("id", workflow.id);
  }

  return { output, step_logs, status, error, execution_id: execId };
}
