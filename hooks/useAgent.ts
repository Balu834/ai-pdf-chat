"use client";

import { useState, useRef, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ToolCall {
  id:     string;
  name:   string;
  args:   Record<string, unknown>;
  result: string | null;
  ms:     number | null;
  status: "running" | "done" | "error";
}

export interface ConfirmAction {
  jobId:   string | null;
  tool:    string;
  preview: string;
  args:    Record<string, unknown>;
}

export interface AgentMessage {
  id:          string;
  role:        "user" | "assistant";
  content:     string;
  toolCalls:   ToolCall[];
  confirms:    ConfirmAction[];
  isStreaming: boolean;
}

interface UseAgentOptions {
  fileUrl?: string | null;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAgent({ fileUrl = null }: UseAgentOptions = {}) {
  const [messages,   setMessages]   = useState<AgentMessage[]>([]);
  const [isRunning,  setIsRunning]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const abortRef   = useRef<AbortController | null>(null);
  const historyRef = useRef<{ role: string; content: string }[]>([]);

  // ── Core send ─────────────────────────────────────────────────────────────
  const send = useCallback(async (text: string) => {
    if (!text.trim() || isRunning) return;

    setError(null);
    setIsRunning(true);

    const userId  = `u-${Date.now()}`;
    const aiId    = `a-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", content: text, toolCalls: [], confirms: [], isStreaming: false },
      { id: aiId,   role: "assistant", content: "", toolCalls: [], confirms: [], isStreaming: true },
    ]);

    historyRef.current = [...historyRef.current, { role: "user", content: text }];

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    let accContent  = "";
    let accTools:    ToolCall[]       = [];
    let accConfirms: ConfirmAction[]  = [];

    try {
      const res = await fetch("/api/agent", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: text, history: historyRef.current.slice(-10), fileUrl: fileUrl ?? undefined }),
        credentials: "include",
        signal:  ctrl.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let   lineBuf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        lineBuf += decoder.decode(value, { stream: true });
        const lines = lineBuf.split("\n");
        lineBuf = lines.pop()!;

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;

          let evt: Record<string, any>;
          try { evt = JSON.parse(raw); } catch { continue; }

          switch (evt.t) {
            case "think": break;

            case "tc":
              accTools = [...accTools, { id: evt.id, name: evt.name, args: evt.args ?? {}, result: null, ms: null, status: "running" }];
              setMessages((prev) => prev.map((m) => m.id === aiId ? { ...m, toolCalls: accTools } : m));
              break;

            case "tr":
              accTools = accTools.map((tc) =>
                tc.id === evt.id ? { ...tc, result: evt.res, ms: evt.ms, status: evt.err ? "error" : "done" } : tc
              );
              setMessages((prev) => prev.map((m) => m.id === aiId ? { ...m, toolCalls: accTools } : m));
              break;

            case "confirm":
              accConfirms = [...accConfirms, { jobId: evt.jobId, tool: evt.tool, preview: evt.preview, args: evt.args ?? {} }];
              setMessages((prev) => prev.map((m) => m.id === aiId ? { ...m, confirms: accConfirms } : m));
              break;

            case "tok":
              accContent += evt.c ?? "";
              setMessages((prev) => prev.map((m) => m.id === aiId ? { ...m, content: accContent } : m));
              break;

            case "err":
              setError(evt.msg ?? "Agent error");
              break;
          }
        }
      }

      setMessages((prev) => prev.map((m) =>
        m.id === aiId ? { ...m, content: accContent, toolCalls: accTools, confirms: accConfirms, isStreaming: false } : m
      ));

      if (accContent) {
        historyRef.current = [...historyRef.current, { role: "assistant", content: accContent }];
      }

    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setError(err?.message ?? "Unexpected error");
      setMessages((prev) => prev.map((m) =>
        m.id === aiId ? { ...m, content: accContent || "Sorry, something went wrong.", isStreaming: false } : m
      ));
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, fileUrl]);

  // ── Confirm / reject a queued action ──────────────────────────────────────
  const confirmAction = useCallback(async (jobId: string, approved: boolean) => {
    const res = await fetch(`/api/jobs/${jobId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ approved }),
    });
    return res.ok;
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsRunning(false);
    setMessages((prev) => prev.map((m) => m.isStreaming ? { ...m, isStreaming: false } : m));
  }, []);

  const clear = useCallback(() => {
    historyRef.current = [];
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isRunning, error, send, stop, clear, confirmAction, clearError: () => setError(null) };
}
