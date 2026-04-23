"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type RecorderState = "idle" | "requesting" | "recording" | "stopped";

interface Options {
  onStop?:  (blob: Blob, durationMs: number) => void;
  onError?: (message: string) => void;
}

/** Picks the best supported MIME type for voice recording. */
function bestMime(): string {
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg"]) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) return m;
  }
  return "audio/webm";
}

export function useVoiceRecorder({ onStop, onError }: Options = {}) {
  const [state,    setState]    = useState<RecorderState>("idle");
  const [duration, setDuration] = useState(0); // elapsed seconds

  const recorderRef  = useRef<MediaRecorder | null>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const chunksRef    = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep callbacks in refs — stable start/stop regardless of parent re-renders
  const onStopRef  = useRef(onStop);
  const onErrorRef = useRef(onError);
  useEffect(() => { onStopRef.current  = onStop;  });
  useEffect(() => { onErrorRef.current = onError; });

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  /** Begin recording. No-op if already recording. */
  const start = useCallback(async () => {
    if (state === "recording" || state === "requesting") return;

    setState("requesting");

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: unknown) {
      releaseStream();
      setState("idle");
      const name = (err as DOMException)?.name ?? "";
      onErrorRef.current?.(
        name === "NotAllowedError" || name === "PermissionDeniedError"
          ? "🎤 Mic blocked — allow microphone access and try again."
          : "Could not access microphone."
      );
      return;
    }

    const mime     = bestMime();
    const recorder = new MediaRecorder(streamRef.current, { mimeType: mime });
    recorderRef.current = recorder;
    chunksRef.current   = [];
    startedAtRef.current = Date.now();

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      clearTimer();
      releaseStream();
      const ms   = Date.now() - startedAtRef.current;
      const blob = new Blob(chunksRef.current, { type: mime });
      setState("stopped");
      onStopRef.current?.(blob, ms);
    };

    recorder.start(100); // chunk every 100 ms
    setState("recording");
    setDuration(0);

    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 500);
  }, [state, clearTimer, releaseStream]);

  /** Stop and emit the blob. */
  const stop = useCallback(() => {
    if (recorderRef.current?.state !== "inactive") {
      try { recorderRef.current?.stop(); } catch {}
    }
    clearTimer();
  }, [clearTimer]);

  /** Discard recording without emitting. */
  const cancel = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.ondataavailable = null;
      recorderRef.current.onstop          = null;
      if (recorderRef.current.state !== "inactive") {
        try { recorderRef.current.stop(); } catch {}
      }
      recorderRef.current = null;
    }
    clearTimer();
    releaseStream();
    chunksRef.current = [];
    setDuration(0);
    setState("idle");
  }, [clearTimer, releaseStream]);

  /** Reset to idle after the stopped blob has been consumed. */
  const reset = useCallback(() => {
    setDuration(0);
    setState("idle");
  }, []);

  useEffect(() => () => { cancel(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    state,
    duration,                           // elapsed seconds
    isRecording: state === "recording",
    isRequesting: state === "requesting",
    start,
    stop,
    cancel,
    reset,
  };
}
