"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTTS } from "./useTTS";

export type ConvState = "idle" | "listening" | "thinking" | "speaking";

interface Options {
  /** Called with the final transcript so the caller can send it to the AI. */
  onTranscript: (text: string) => void;
  /** True while the AI is streaming a response. */
  isThinking: boolean;
  /** The latest complete AI message text to speak after streaming ends. */
  lastAiMessage: string;
  /** Only start speaking/listening when a doc is selected. */
  hasDoc: boolean;
}

const MIC_ERRORS: Record<string, string> = {
  "not-allowed":         "🎤 Mic blocked. Click the 🔒 icon in your address bar → Allow microphone → Refresh.",
  "service-not-allowed": "🎤 Mic blocked. Click the 🔒 icon in your address bar → Allow microphone → Refresh.",
  "not-found":           "No microphone detected. Plug in a mic and try again.",
  "not-readable":        "Mic is in use by another app. Close it and try again.",
  "network":             "Network error while starting mic. Check your connection.",
};

export function useVoiceConversation({ onTranscript, isThinking, lastAiMessage, hasDoc }: Options) {
  const [active,    setActive]    = useState(false);
  const [convState, setConvState] = useState<ConvState>("idle");
  const [error,     setError]     = useState<string | null>(null);

  const tts          = useTTS();
  const recRef       = useRef<any>(null);
  const activeRef    = useRef(false);    // survives closure captures
  const wasThinking  = useRef(false);   // detect isThinking flip: true → false

  // ── Start one round of listening ────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!activeRef.current) return;

    type SR = { new(): SpeechRecognitionAlt };
    interface SpeechRecognitionAlt extends EventTarget {
      lang: string; interimResults: boolean; continuous: boolean;
      onresult: ((e: any) => void) | null;
      onerror:  ((e: any) => void) | null;
      start(): void; stop(): void;
    }
    const SRCtor: SR | false =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition);

    if (!SRCtor) {
      setError("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    tts.stop();
    setConvState("listening");

    const rec: SpeechRecognitionAlt = new SRCtor();
    rec.lang           = "en-US";
    rec.interimResults = false;
    rec.continuous     = false;
    recRef.current     = rec as any;

    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results as any[])
        .filter((r: any) => r.isFinal)
        .map((r: any) => (r[0] as any).transcript as string)
        .join(" ")
        .trim();
      if (transcript && activeRef.current) {
        setConvState("thinking");
        onTranscript(transcript);
      }
    };

    rec.onerror = (e: any) => {
      if (!activeRef.current) return;
      if (e.error === "no-speech") {
        setTimeout(startListening, 300);
        return;
      }
      if (e.error === "aborted") return;
      setError(MIC_ERRORS[e.error as string] ?? `Mic error: ${e.error}`);
      setActive(false);
      activeRef.current = false;
      setConvState("idle");
    };

    rec.start();
  }, [onTranscript, tts]);

  // ── Watch isThinking: when AI finishes → speak the response ─────────────
  useEffect(() => {
    if (!active) return;
    if (isThinking) { wasThinking.current = true; return; }
    if (!wasThinking.current) return;   // never started thinking yet

    // isThinking just flipped to false → response complete
    wasThinking.current = false;
    if (lastAiMessage && activeRef.current) {
      setConvState("speaking");
      tts.speak(lastAiMessage);
    }
  }, [active, isThinking, lastAiMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── When TTS finishes → restart listening ───────────────────────────────
  useEffect(() => {
    if (!active || convState !== "speaking") return;
    if (tts.state === "idle") {
      setTimeout(() => {
        if (activeRef.current) startListening();
      }, 500);
    }
  }, [tts.state, active, convState, startListening]);

  // ── Start voice mode ─────────────────────────────────────────────────────
  const start = useCallback(async () => {
    setError(null);

    // HTTPS guard
    if (
      typeof window !== "undefined" &&
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost"
    ) {
      setError("🔒 Voice mode requires a secure (HTTPS) connection.");
      return;
    }

    // Permission pre-check
    if (typeof navigator !== "undefined" && navigator.permissions) {
      try {
        const status = await navigator.permissions.query({ name: "microphone" as PermissionName });
        if (status.state === "denied") {
          setError("🎤 Mic blocked. Click the 🔒 icon in your address bar → Allow microphone → Refresh.");
          return;
        }
      } catch { /* permissions API not supported — fall through */ }
    }

    activeRef.current  = true;
    wasThinking.current = false;
    setActive(true);
    startListening();
  }, [startListening]);

  // ── Stop voice mode ──────────────────────────────────────────────────────
  const stop = useCallback(() => {
    activeRef.current = false;
    setActive(false);
    setConvState("idle");
    recRef.current?.stop();
    recRef.current = null;
    tts.stop();
  }, [tts]);

  const toggle = useCallback(() => {
    if (active) stop(); else start();
  }, [active, start, stop]);

  // Interrupt: user taps mic while AI is speaking → cancel TTS and listen
  const interrupt = useCallback(() => {
    if (!active) return;
    tts.stop();
    setConvState("listening");
    setTimeout(startListening, 150);
  }, [active, tts, startListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      activeRef.current = false;
      recRef.current?.stop();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  return { active, convState, toggle, interrupt, error, clearError: () => setError(null) };
}
