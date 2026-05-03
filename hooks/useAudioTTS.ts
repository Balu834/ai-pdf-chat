"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type AudioTTSState = "idle" | "loading" | "playing" | "paused";

export type TTSVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
export type TTSModel = "tts-1" | "tts-1-hd";

export interface AudioTTSOptions {
  voice?: TTSVoice;
  model?: TTSModel;
}

// Cheap hash for cache key — not crypto, just for deduplication
function fastHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < Math.min(s.length, 400); i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

export function useAudioTTS({ voice = "nova", model = "tts-1" }: AudioTTSOptions = {}) {
  const [state,     setState]     = useState<AudioTTSState>("idle");
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const audioRef  = useRef<HTMLAudioElement | null>(null);
  const cacheRef  = useRef<Map<string, string>>(new Map()); // cacheKey → objectURL
  const abortRef  = useRef<AbortController | null>(null);
  const keyRef    = useRef<string | null>(null);

  function getAudio(): HTMLAudioElement {
    if (!audioRef.current) audioRef.current = new Audio();
    return audioRef.current;
  }

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    keyRef.current = null;
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.src = "";
      a.onended = null;
      a.onerror = null;
    }
    setActiveKey(null);
    setState("idle");
  }, []);

  /**
   * Fetch audio from /api/tts and play it.
   * @param text    - The text to speak (markdown will be stripped server-side)
   * @param cacheId - Optional stable ID for caching (e.g. message ID). Falls back to a text hash.
   */
  const speak = useCallback(async (text: string, cacheId?: string) => {
    if (!text?.trim()) return;

    // Abort any in-flight request and stop current audio
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const a = getAudio();
    a.pause();
    a.onended = null;
    a.onerror = null;

    const cacheKey = (cacheId ?? fastHash(text)) + "_" + voice;
    keyRef.current = cacheKey;
    setActiveKey(cacheKey);

    // ── Cache hit: play immediately ───────────────────────────────────────
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setState("playing");
      a.src = cached;
      a.onended = () => { if (keyRef.current === cacheKey) { setState("idle"); setActiveKey(null); } };
      a.onerror = () => { if (keyRef.current === cacheKey) { setState("idle"); setActiveKey(null); } };
      try { await a.play(); } catch {}
      return;
    }

    // ── Cache miss: fetch from API ────────────────────────────────────────
    setState("loading");
    try {
      const res = await fetch("/api/tts", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ text, voice, model }),
        credentials: "include",
        signal:      ctrl.signal,
      });

      if (ctrl.signal.aborted) return;

      if (!res.ok) {
        if (keyRef.current === cacheKey) { setState("idle"); setActiveKey(null); }
        console.warn("[useAudioTTS] API error:", res.status);
        return;
      }

      const blob = await res.blob();
      if (ctrl.signal.aborted) return;

      const url = URL.createObjectURL(blob);
      cacheRef.current.set(cacheKey, url);

      if (keyRef.current !== cacheKey) return; // superseded by a newer speak() call

      setState("playing");
      a.src = url;
      a.onended = () => { if (keyRef.current === cacheKey) { setState("idle"); setActiveKey(null); } };
      a.onerror = () => { if (keyRef.current === cacheKey) { setState("idle"); setActiveKey(null); } };
      await a.play();
    } catch (err: any) {
      if (err?.name !== "AbortError" && keyRef.current === cacheKey) {
        setState("idle");
        setActiveKey(null);
      }
    }
  }, [voice, model]);

  const pause = useCallback(() => {
    if (state !== "playing") return;
    audioRef.current?.pause();
    setState("paused");
  }, [state]);

  const resume = useCallback(() => {
    if (state !== "paused") return;
    audioRef.current?.play().catch(() => setState("idle"));
    setState("playing");
  }, [state]);

  /** Toggle play/pause for a given text+id. If a different message is playing, starts this one. */
  const toggle = useCallback((text: string, cacheId?: string) => {
    const key = (cacheId ?? fastHash(text)) + "_" + voice;
    if (activeKey === key) {
      if (state === "playing") pause();
      else if (state === "paused") resume();
      else stop();
    } else {
      speak(text, cacheId);
    }
  }, [activeKey, state, speak, pause, resume, stop, voice]);

  // Revoke cached object URLs on unmount to free memory
  useEffect(() => () => {
    stop();
    cacheRef.current.forEach((url) => URL.revokeObjectURL(url));
    cacheRef.current.clear();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { state, activeKey, speak, pause, resume, stop, toggle };
}
