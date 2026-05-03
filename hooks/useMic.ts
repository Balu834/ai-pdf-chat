"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type MicState = "idle" | "requesting" | "listening" | "error";

interface UseMicOptions {
  lang?:           string;
  /** Called once when the recognition engine actually starts (after permission granted). */
  onStart?:        () => void;
  onTranscript:    (text: string, isFinal: boolean) => void;
  onError?:        (message: string) => void;
  /** Auto-stop after this many ms of total recording. Default 60 000 (60 s). */
  maxDurationMs?:  number;
  /** Auto-stop after this many ms of silence (no new transcript events). Default 3 000 (3 s). */
  silenceMs?:      number;
}

const MIC_ERRORS: Record<string, string> = {
  NotAllowedError:       "🎤 Mic blocked. Click the 🔒 icon in your address bar → Allow microphone → Refresh.",
  PermissionDeniedError: "🎤 Mic blocked. Click the 🔒 icon in your address bar → Allow microphone → Refresh.",
  NotFoundError:         "No microphone detected. Plug in a mic and try again.",
  NotReadableError:      "Mic is in use by another app. Close it and try again.",
  OverconstrainedError:  "Mic constraints not supported by your device.",
  "not-allowed":         "🎤 Mic blocked. Click the 🔒 icon in your address bar → Allow microphone → Refresh.",
  "service-not-allowed": "🎤 Mic blocked. Click the 🔒 icon in your address bar → Allow microphone → Refresh.",
  "not-found":           "No microphone detected. Plug in a mic and try again.",
  "not-readable":        "Mic is in use by another app. Close it and try again.",
  "network":             "Network error while starting mic. Check your connection.",
};

function getMicError(err: unknown): string {
  if (err instanceof DOMException) return MIC_ERRORS[err.name] ?? `Mic error: ${err.message}`;
  if (err && typeof err === "object" && "error" in err) {
    const code = (err as { error: string }).error;
    if (code === "aborted" || code === "no-speech") return "";
    return MIC_ERRORS[code] ?? `Mic error: ${code}`;
  }
  return "Could not access microphone. Please check your device settings.";
}

export function useMic({
  lang            = "en-US",
  onStart,
  onTranscript,
  onError,
  maxDurationMs   = 60_000,
  silenceMs       = 3_000,
}: UseMicOptions) {
  const [micState, setMicState] = useState<MicState>("idle");

  const streamRef       = useRef<MediaStream | null>(null);
  const recRef          = useRef<any>(null);
  const startingRef     = useRef(false);
  const durationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always-fresh callback refs — callers never need to restart the hook when callbacks change
  const onStartRef      = useRef(onStart);
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef      = useRef(onError);
  useEffect(() => { onStartRef.current      = onStart;      });
  useEffect(() => { onTranscriptRef.current = onTranscript; });
  useEffect(() => { onErrorRef.current      = onError;      });

  const clearTimers = useCallback(() => {
    if (durationTimerRef.current) { clearTimeout(durationTimerRef.current); durationTimerRef.current = null; }
    if (silenceTimerRef.current)  { clearTimeout(silenceTimerRef.current);  silenceTimerRef.current  = null; }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const stop = useCallback(() => {
    startingRef.current = false;
    clearTimers();
    if (recRef.current) {
      recRef.current.onstart  = null;
      recRef.current.onresult = null;
      recRef.current.onerror  = null;
      recRef.current.onend    = null;
      try { recRef.current.abort(); } catch {}
      recRef.current = null;
    }
    stopStream();
    setMicState("idle");
  }, [clearTimers, stopStream]);

  // Reset the silence watchdog; called on every transcript event
  const kickSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => stop(), silenceMs);
  }, [silenceMs, stop]);

  const start = useCallback(async () => {
    if (startingRef.current || recRef.current) return;
    startingRef.current = true;

    if (
      typeof window !== "undefined" &&
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost"
    ) {
      onErrorRef.current?.("🔒 Microphone requires a secure (HTTPS) connection.");
      startingRef.current = false;
      setMicState("error");
      return;
    }

    const SR: any =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition);

    if (!SR) {
      onErrorRef.current?.("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      startingRef.current = false;
      setMicState("error");
      return;
    }

    setMicState("requesting");

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      stopStream();
      startingRef.current = false;
      const msg = getMicError(err);
      if (msg) onErrorRef.current?.(msg);
      setMicState("error");
      return;
    }

    const rec           = new SR();
    rec.lang            = lang;
    rec.interimResults  = true;
    rec.continuous      = false;
    recRef.current      = rec;

    rec.onstart = () => {
      startingRef.current = false;
      setMicState("listening");
      onStartRef.current?.();

      // Hard 60-second session cap
      durationTimerRef.current = setTimeout(() => stop(), maxDurationMs);
      // Initial silence watchdog — fires if nothing is spoken at all
      kickSilenceTimer();
    };

    rec.onresult = (e: any) => {
      // Reset silence watchdog each time speech is detected
      kickSilenceTimer();

      let text     = "";
      let hasFinal = false;
      for (const result of Array.from(e.results) as any[]) {
        text += result[0].transcript;
        if (result.isFinal) hasFinal = true;
      }
      if (text) onTranscriptRef.current(text, hasFinal);
    };

    rec.onerror = (e: any) => {
      const msg = getMicError(e);
      if (msg) onErrorRef.current?.(msg);
      // onend always fires after onerror — cleanup happens there
    };

    rec.onend = () => {
      clearTimers();
      stopStream();
      recRef.current      = null;
      startingRef.current = false;
      setMicState("idle");
    };

    rec.start();
  }, [lang, maxDurationMs, kickSilenceTimer, stop, stopStream]);

  const toggle = useCallback(() => {
    if (startingRef.current || recRef.current) stop();
    else start();
  }, [start, stop]);

  useEffect(() => () => { stop(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // useState(false) ensures server and client both start with false,
  // preventing React hydration mismatch (#418/#419). The real value is
  // set after mount via useEffect so the browser DOM is available.
  const [isSupported, setIsSupported] = useState(false);
  useEffect(() => {
    setIsSupported(
      !!(
        (window as any).SpeechRecognition ??
        (window as any).webkitSpeechRecognition
      )
    );
  }, []);

  return {
    micState,
    isListening:  micState === "listening",
    isRequesting: micState === "requesting",
    isSupported,
    start,
    stop,
    toggle,
  };
}
