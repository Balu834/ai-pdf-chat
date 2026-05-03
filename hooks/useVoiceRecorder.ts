"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type RecorderState = "idle" | "requesting" | "recording" | "processing";

interface UseVoiceRecorderOptions {
  /** Hard cap on recording length. Default 120 s. */
  maxDurationMs?: number;
  onError?: (msg: string) => void;
}

function bestMime(): string {
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg"]) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) return m;
  }
  return "";
}

export function useVoiceRecorder({
  maxDurationMs = 120_000,
  onError,
}: UseVoiceRecorderOptions = {}) {
  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  const [durationMs, setDurationMs]       = useState(0);
  const [isSupported, setIsSupported]     = useState(false);

  const mrRef       = useRef<MediaRecorder | null>(null);
  const streamRef   = useRef<MediaStream  | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const startRef    = useRef(0);
  const tickRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const capRef      = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const onErrorRef  = useRef(onError);
  useEffect(() => { onErrorRef.current = onError; });

  // SSR-safe: only set true in browser after mount
  useEffect(() => {
    setIsSupported(
      typeof window !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== "undefined"
    );
  }, []);

  const clearTimers = useCallback(() => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    if (capRef.current)  { clearTimeout(capRef.current);   capRef.current  = null; }
  }, []);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (recorderState !== "idle") return;

    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
      onErrorRef.current?.("🔒 Recording requires a secure (HTTPS) connection.");
      return;
    }

    setRecorderState("requesting");

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      releaseStream();
      setRecorderState("idle");
      const name = (err as DOMException)?.name ?? "";
      onErrorRef.current?.(
        name === "NotAllowedError" || name === "PermissionDeniedError"
          ? "🎤 Mic blocked — allow microphone access and try again."
          : name === "NotFoundError"
          ? "No microphone detected. Plug one in and try again."
          : "Could not access microphone."
      );
      return;
    }

    const mime     = bestMime();
    const mr       = new MediaRecorder(streamRef.current, mime ? { mimeType: mime } : undefined);
    mrRef.current  = mr;
    chunksRef.current = [];

    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.start(100);

    startRef.current = Date.now();
    setDurationMs(0);
    setRecorderState("recording");

    tickRef.current = setInterval(() => setDurationMs(Date.now() - startRef.current), 100);
    capRef.current  = setTimeout(() => stopAndGet(true).then(() => {}), maxDurationMs);
  }, [recorderState, maxDurationMs]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Internal: stop MediaRecorder and return Blob (or null if cancelled). */
  const stopAndGet = useCallback(
    (keep: boolean): Promise<Blob | null> =>
      new Promise((resolve) => {
        clearTimers();
        const mr = mrRef.current;
        if (!mr || mr.state === "inactive") {
          releaseStream();
          mrRef.current = null;
          resolve(null);
          return;
        }
        mr.onstop = () => {
          const blob = keep && chunksRef.current.length > 0
            ? new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" })
            : null;
          chunksRef.current = [];
          releaseStream();
          mrRef.current = null;
          resolve(blob);
        };
        mr.stop();
      }),
    [clearTimers, releaseStream]
  );

  /**
   * Stop recording and return the Blob for transcription.
   * State transitions to "processing"; call `doneProcessing()` when done.
   */
  const stop = useCallback(async (): Promise<Blob | null> => {
    const blob = await stopAndGet(true);
    if (blob) {
      setRecorderState("processing");
    } else {
      setRecorderState("idle");
      setDurationMs(0);
    }
    return blob;
  }, [stopAndGet]);

  /** Discard the current recording and return to idle. */
  const cancel = useCallback(async () => {
    await stopAndGet(false);
    setRecorderState("idle");
    setDurationMs(0);
  }, [stopAndGet]);

  /** Call after transcription finishes (success or failure). */
  const doneProcessing = useCallback(() => {
    setRecorderState("idle");
    setDurationMs(0);
  }, []);

  useEffect(() => () => { clearTimers(); releaseStream(); }, [clearTimers, releaseStream]);

  return {
    recorderState,
    isRequesting:  recorderState === "requesting",
    isRecording:   recorderState === "recording",
    isProcessing:  recorderState === "processing",
    durationMs,
    isSupported,
    start,
    stop,
    cancel,
    doneProcessing,
  };
}
