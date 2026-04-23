"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type MicState = "idle" | "requesting" | "listening" | "error";

interface UseMicOptions {
  lang?: string;
  onTranscript: (text: string, isFinal: boolean) => void;
  onError?: (message: string) => void;
}

const MIC_ERRORS: Record<string, string> = {
  // DOMException names thrown by getUserMedia
  NotAllowedError:       "🎤 Mic blocked. Click the 🔒 icon in your address bar → Allow microphone → Refresh.",
  PermissionDeniedError: "🎤 Mic blocked. Click the 🔒 icon in your address bar → Allow microphone → Refresh.",
  NotFoundError:         "No microphone detected. Plug in a mic and try again.",
  NotReadableError:      "Mic is in use by another app. Close it and try again.",
  OverconstrainedError:  "Mic constraints not supported by your device.",
  // SpeechRecognition error codes
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
    if (code === "aborted" || code === "no-speech") return ""; // silent — not user-visible errors
    return MIC_ERRORS[code] ?? `Mic error: ${code}`;
  }
  return "Could not access microphone. Please check your device settings.";
}

export function useMic({ lang = "en-US", onTranscript, onError }: UseMicOptions) {
  const [micState, setMicState] = useState<MicState>("idle");

  const streamRef   = useRef<MediaStream | null>(null);
  const recRef      = useRef<any>(null);
  const startingRef = useRef(false); // prevents overlapping start() calls

  // Store callbacks in refs so the start() closure never goes stale
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef      = useRef(onError);
  useEffect(() => { onTranscriptRef.current = onTranscript; });
  useEffect(() => { onErrorRef.current      = onError; });

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const stop = useCallback(() => {
    startingRef.current = false;
    if (recRef.current) {
      // Null all handlers before abort() so onend/onerror don't fire after stop
      recRef.current.onstart = null;
      recRef.current.onresult = null;
      recRef.current.onerror = null;
      recRef.current.onend   = null;
      try { recRef.current.abort(); } catch {}
      recRef.current = null;
    }
    stopStream();
    setMicState("idle");
  }, [stopStream]);

  const start = useCallback(async () => {
    if (startingRef.current || recRef.current) return; // already starting or running
    startingRef.current = true;

    // HTTPS guard
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

    // getUserMedia serves two purposes here:
    // 1. Triggers the browser permission prompt before SpeechRecognition touches the mic
    // 2. Keeps the mic hardware warm so SpeechRecognition.start() doesn't hit
    //    NotAllowedError during the brief window between mic release and re-acquire
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

    const rec = new SR();
    rec.lang           = lang;
    rec.interimResults = true;
    rec.continuous     = false;
    recRef.current     = rec;

    rec.onstart = () => {
      startingRef.current = false;
      setMicState("listening");
    };

    rec.onresult = (e: any) => {
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
      // Don't call stop() here — onend always fires after onerror and will clean up
    };

    rec.onend = () => {
      stopStream(); // release physical mic (turns off browser mic indicator)
      recRef.current      = null;
      startingRef.current = false;
      setMicState("idle");
    };

    rec.start();
  }, [lang, stopStream]); // callbacks via refs — not in deps, always current

  const toggle = useCallback(() => {
    if (startingRef.current || recRef.current) stop();
    else start();
  }, [start, stop]);

  // Cleanup on unmount
  useEffect(() => () => { stop(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    micState,
    isListening:   micState === "listening",
    isRequesting:  micState === "requesting",
    start,
    stop,
    toggle,
  };
}
