"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// Strip markdown/code syntax so the voice reads clean plain text.
function stripForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "code block.")       // fenced code → "code block"
    .replace(/`[^`]+`/g, "")                          // inline code
    .replace(/\*\*([^*]+)\*\*/g, "$1")               // bold
    .replace(/\*([^*]+)\*/g, "$1")                    // italic
    .replace(/^#{1,6}\s+/gm, "")                      // headings
    .replace(/^[-*•]\s+/gm, "")                       // bullet points
    .replace(/^\d+\.\s+/gm, "")                       // numbered lists
    .replace(/\|[^|\n]+/g, "")                        // table cells
    .replace(/https?:\/\/\S+/g, "link")               // URLs
    .replace(/\n{2,}/g, ". ")                          // paragraph breaks → pause
    .replace(/\n/g, " ")
    .trim();
}

export type TTSState = "idle" | "speaking" | "paused";

export interface TTSOptions {
  rate?:  number;   // 0.5–2.0, default 1.0
  pitch?: number;   // 0–2.0,   default 1.0
  voiceURI?: string;
}

export function useTTS(options?: TTSOptions) {
  const [state,     setState]     = useState<TTSState>("idle");
  const [supported, setSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeRef    = useRef(false);   // guard against stale onend after cancel

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const speak = useCallback((text: string) => {
    if (!supported) return;

    // Cancel any current speech globally (fires onend on the previous utterance,
    // which will reset that message's button via its own activeRef guard).
    window.speechSynthesis.cancel();
    activeRef.current = true;

    const clean = stripForSpeech(text);
    if (!clean) return;

    const u = new SpeechSynthesisUtterance(clean);
    u.rate  = options?.rate  ?? 1.0;
    u.pitch = options?.pitch ?? 1.0;

    if (options?.voiceURI) {
      const voices = window.speechSynthesis.getVoices();
      const match  = voices.find((v) => v.voiceURI === options.voiceURI);
      if (match) u.voice = match;
    }

    u.onstart = () => { if (activeRef.current) setState("speaking"); };
    u.onend   = () => { if (activeRef.current) { setState("idle"); activeRef.current = false; } };
    u.onerror = (e) => {
      if (!activeRef.current) return;
      // "interrupted" = another speak() cancelled us — not an error for the user
      if (e.error !== "interrupted" && e.error !== "canceled") {
        setState("idle");
      }
      activeRef.current = false;
    };
    u.onpause  = () => { if (activeRef.current) setState("paused"); };
    u.onresume = () => { if (activeRef.current) setState("speaking"); };

    utteranceRef.current = u;
    window.speechSynthesis.speak(u);
  }, [supported, options?.rate, options?.pitch, options?.voiceURI]);

  const pause = useCallback(() => {
    if (!supported || state !== "speaking") return;
    window.speechSynthesis.pause();
  }, [supported, state]);

  const resume = useCallback(() => {
    if (!supported || state !== "paused") return;
    window.speechSynthesis.resume();
  }, [supported, state]);

  const stop = useCallback(() => {
    if (!supported) return;
    activeRef.current = false;
    window.speechSynthesis.cancel();
    setState("idle");
  }, [supported]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      activeRef.current = false;
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  return { speak, pause, resume, stop, state, supported };
}

// Returns available voices (loads asynchronously in Chrome).
export function useVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    function load() { setVoices(window.speechSynthesis.getVoices()); }
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  return voices;
}
