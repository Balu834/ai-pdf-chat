"use client";

import { useRef, useCallback, useEffect, useState } from "react";

// Strip markdown so voice reads clean prose
function strip(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "code block. ")
    .replace(/`[^`]+`/g, "")
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*•]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\|[^\n]+/g, "")
    .replace(/https?:\/\/\S+/g, "link")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .trim();
}

export type StreamTTSState = "idle" | "speaking";

export function useStreamingTTS() {
  const [state, setState] = useState<StreamTTSState>("idle");

  const bufRef      = useRef("");
  const queueRef    = useRef<string[]>([]);
  const playingRef  = useRef(false);
  const activeRef   = useRef(false);
  const voiceRef    = useRef<SpeechSynthesisVoice | null>(null);
  const rateRef     = useRef(1.05);
  const langRef     = useRef("en-US");

  // Dequeue and speak the next sentence
  const playNext = useCallback(() => {
    if (!activeRef.current || playingRef.current || queueRef.current.length === 0) return;

    const text    = queueRef.current.shift()!;
    const cleaned = strip(text);
    if (!cleaned) { playNext(); return; }

    playingRef.current = true;
    setState("speaking");

    const u   = new SpeechSynthesisUtterance(cleaned);
    u.rate    = rateRef.current;
    u.lang    = langRef.current;
    if (voiceRef.current) u.voice = voiceRef.current;

    u.onend = () => {
      playingRef.current = false;
      if (queueRef.current.length > 0) playNext();
      else setState("idle");
    };
    u.onerror = (e) => {
      if (e.error === "interrupted" || e.error === "canceled") return;
      playingRef.current = false;
      if (activeRef.current && queueRef.current.length > 0) playNext();
      else setState("idle");
    };

    window.speechSynthesis.speak(u);
  }, []);

  // Scan buffer for the next sentence boundary and enqueue it
  const drainBuffer = useCallback(() => {
    const text = bufRef.current;
    // Match: period/!/?  followed by whitespace  OR  a newline
    const idx = text.search(/[.!?]\s|\n/);
    if (idx === -1) return;

    const end      = text[idx] === "\n" ? idx + 1 : idx + 2;
    const sentence = text.slice(0, end).trim();
    bufRef.current = text.slice(end);

    if (sentence.length >= 30) {
      queueRef.current.push(sentence);
      playNext();
    }
    // Recursively drain if more boundaries remain
    if (/[.!?]\s|\n/.test(bufRef.current)) drainBuffer();
  }, [playNext]);

  /** Call for each streaming token as it arrives */
  const addChunk = useCallback((chunk: string) => {
    if (!activeRef.current) return;
    bufRef.current += chunk;
    drainBuffer();
  }, [drainBuffer]);

  /** Call once when the stream ends — speaks any remaining buffered text */
  const flush = useCallback(() => {
    const tail = bufRef.current.trim();
    bufRef.current = "";
    if (tail.length >= 5) {
      queueRef.current.push(tail);
      playNext();
    }
  }, [playNext]);

  /** Reset for a new response — cancels any in-progress speech */
  const start = useCallback(() => {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    activeRef.current  = true;
    playingRef.current = false;
    bufRef.current     = "";
    queueRef.current   = [];
    setState("idle");
  }, []);

  /** Cancel everything immediately */
  const stop = useCallback(() => {
    activeRef.current  = false;
    playingRef.current = false;
    bufRef.current     = "";
    queueRef.current   = [];
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setState("idle");
  }, []);

  const setVoice = useCallback((v: SpeechSynthesisVoice | null) => { voiceRef.current = v; }, []);
  const setRate  = useCallback((r: number) => { rateRef.current = r; }, []);
  const setLang  = useCallback((l: string) => { langRef.current = l; }, []);

  // Cleanup on unmount
  useEffect(() => () => {
    activeRef.current = false;
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);

  return { addChunk, flush, start, stop, setVoice, setRate, setLang, state };
}
