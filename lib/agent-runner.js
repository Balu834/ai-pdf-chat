/**
 * lib/agent-runner.js — OpenAI function-calling agentic loop
 */

import { createClient } from "@supabase/supabase-js";
import { getOpenAI } from "@/lib/openai-client";
import { TOOLS, TOOL_OPENAI_SCHEMAS } from "./tools.js";

const adminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

const MAX_ROUNDS = 5;

/**
 * Run an agent to completion.
 * @param {object} agent - Row from agents table (id, name, role, instructions, tools[])
 * @param {object} input - { task, pdf_text?, document_id?, user_id }
 * @returns {{ output: string, tool_calls_log: object[], rounds: number, status: 'completed'|'failed', error?: string }}
 */
export async function runAgent(agent, input) {
  const { task, pdf_text = "", document_id, user_id } = input;

  const enabledSchemas = TOOL_OPENAI_SCHEMAS.filter((s) =>
    agent.tools.includes(s.function.name)
  );

  const messages = [
    {
      role: "system",
      content:
        `You are ${agent.name}, a ${agent.role}.\n\n${agent.instructions}\n\n` +
        (pdf_text ? `Document content:\n${pdf_text.slice(0, 12000)}` : ""),
    },
    { role: "user", content: task },
  ];

  const tool_calls_log = [];
  let rounds = 0;
  let output = "";
  let status = "completed";
  let error;

  try {
    while (rounds < MAX_ROUNDS) {
      rounds++;

      const resp = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 1500,
        messages,
        tools: enabledSchemas.length > 0 ? enabledSchemas : undefined,
        tool_choice: enabledSchemas.length > 0 ? "auto" : undefined,
      });

      const msg = resp.choices[0].message;
      messages.push(msg);

      if (resp.choices[0].finish_reason === "stop" || !msg.tool_calls?.length) {
        output = msg.content ?? "";
        break;
      }

      // Execute all tool calls in this round
      for (const call of msg.tool_calls) {
        const toolName = call.function.name;
        const toolArgs = JSON.parse(call.function.arguments);
        const tool = TOOLS[toolName];

        let result;
        let toolError;

        try {
          if (!tool) throw new Error(`Unknown tool: ${toolName}`);
          result = await tool.execute({ ...toolArgs, pdf_text });
        } catch (err) {
          toolError = err.message;
          result = { error: err.message };
        }

        tool_calls_log.push({
          tool: toolName,
          args: toolArgs,
          result,
          error: toolError ?? null,
          round: rounds,
        });

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
    }

    if (rounds >= MAX_ROUNDS && !output) {
      output = messages.findLast((m) => m.role === "assistant" && m.content)?.content ?? "";
    }
  } catch (err) {
    status = "failed";
    error = err.message;
    output = "";
  }

  // Persist run log
  try {
    const supabase = adminClient();
    await supabase.from("agent_runs").insert({
      agent_id: agent.id,
      user_id,
      input: { task, document_id },
      output: { text: output },
      tool_calls: tool_calls_log,
      status,
      error: error ?? null,
    });

    if (status === "completed") {
      await supabase
        .from("agents")
        .update({ runs_count: agent.runs_count + 1, updated_at: new Date().toISOString() })
        .eq("id", agent.id);
    }
  } catch {
    // log persistence failure is non-fatal
  }

  return { output, tool_calls_log, rounds, status, error };
}
