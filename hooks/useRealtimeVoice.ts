"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type RTVState = "idle" | "listening" | "thinking" | "speaking";
export type AgentMode = "general" | "document" | "assistant" | "creative";

export interface ConvTurn {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

interface UseRealtimeVoiceOptions {
  docFileUrl?: string | null;
  lang?:       string;
  silenceMs?:  number;
}

// ── Phrase accumulation thresholds ────────────────────────────────────────────
const PHRASE_CHARS   = 70;   // hard limit — split here (word boundary)
const PHRASE_MIN     = 12;   // never send shorter
const PHRASE_PUNC_AT = 18;   // allow punctuation flush after this many chars
const PHRASE_TIMER   = 220;  // ms — straggler timer

export function useRealtimeVoice({
  docFileUrl = null,
  lang       = "en-US",
  silenceMs  = 1100,
}: UseRealtimeVoiceOptions) {

  // ── Reactive state ────────────────────────────────────────────────────────
  const [state,      setState]      = useState<RTVState>("idle");
  const [active,     setActive]     = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiText,     setAiText]     = useState("");
  const [waveform,   setWaveform]   = useState<number[]>(Array(24).fill(0));
  const [error,      setError]      = useState<string | null>(null);
  const [history,    setHistory]    = useState<ConvTurn[]>([]);
  const [voice,      setVoice]      = useState("nova");
  const [agentMode,  setAgentMode]  = useState<AgentMode>("general");

  // ── Core refs ─────────────────────────────────────────────────────────────
  const activeRef      = useRef(false);
  const stateRef       = useRef<RTVState>("idle");
  const voiceRef       = useRef("nova");
  const agentModeRef   = useRef<AgentMode>("general");
  const recRef         = useRef<any>(null);
  const manualStopRef  = useRef(false);
  const abortRef       = useRef<AbortController | null>(null);
  const silenceRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const msgIdRef       = useRef(0);
  const historyRef     = useRef<{ role: "user" | "assistant"; content: string }[]>([]);

  // ── TTS — AudioContext gapless engine ─────────────────────────────────────
  const ttsCtxRef      = useRef<AudioContext | null>(null);
  const gainRef        = useRef<GainNode | null>(null);
  const scheduleChain  = useRef<Promise<void>>(Promise.resolve());
  const scheduledEnd   = useRef(0);
  const activeNodes    = useRef<AudioBufferSourceNode[]>([]);
  // Phrase accumulator
  const phraseBuf      = useRef("");
  const phraseTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phraseCount    = useRef(0);   // phrases scheduled for current msgId
  const doneCount      = useRef(0);   // phrases whose onended has fired
  const streamDone     = useRef(false);

  // ── Waveform — separate AudioContext for mic ──────────────────────────────
  const micStreamRef   = useRef<MediaStream | null>(null);
  const micCtxRef      = useRef<AudioContext | null>(null);
  const animRef        = useRef<number | null>(null);

  // ── Stable callback refs (prevent stale closures in long-lived handlers) ──
  const startListeningRef = useRef<() => void>(() => {});
  const sendToAIRef       = useRef<(text: string) => void>(() => {});

  function setS(s: RTVState) { stateRef.current = s; setState(s); }

  // Keep voice / agent mode refs in sync with state
  useEffect(() => { voiceRef.current    = voice;     }, [voice]);
  useEffect(() => { agentModeRef.current = agentMode; }, [agentMode]);

  // ── Init TTS AudioContext (must be inside a user-gesture handler) ─────────
  const initTTS = useCallback(() => {
    if (ttsCtxRef.current && ttsCtxRef.current.state !== "closed") {
      ttsCtxRef.current.resume().catch(() => {});
      return;
    }
    const ctx  = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
    const gain = ctx.createGain();
    gain.gain.value = 1;
    gain.connect(ctx.destination);
    ttsCtxRef.current  = ctx;
    gainRef.current    = gain;
    scheduledEnd.current   = 0;
    scheduleChain.current  = Promise.resolve();
  }, []);

  // ── Stop / interrupt all audio ────────────────────────────────────────────
  const stopAudio = useCallback(() => {
    if (phraseTimer.current) { clearTimeout(phraseTimer.current); phraseTimer.current = null; }
    phraseBuf.current  = "";
    streamDone.current = false;
    phraseCount.current = 0;
    doneCount.current   = 0;
    // Reset chain so new phrases don't queue behind stale ones
    scheduleChain.current = Promise.resolve();

    const ctx  = ttsCtxRef.current;
    const gain = gainRef.current;
    if (!ctx || !gain) return;

    // Fade out 50 ms to avoid click artifact
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);

    const toStop = activeNodes.current.slice();
    activeNodes.current  = [];
    scheduledEnd.current = 0;
    setTimeout(() => {
      toStop.forEach((n) => { try { n.stop(); n.disconnect(); } catch {} });
      if (gain && ctx.state !== "closed") {
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.setValueAtTime(1, ctx.currentTime);
      }
    }, 60);
  }, []);

  // ── Fetch one phrase's audio — returns ArrayBuffer or null ───────────────
  const fetchPhraseAudio = useCallback(
    async (text: string, msgId: number): Promise<ArrayBuffer | null> => {
      if (!text.trim() || !activeRef.current || msgIdRef.current !== msgId) return null;
      try {
        const res = await fetch("/api/tts-stream", {
          method:      "POST",
          headers:     { "Content-Type": "application/json" },
          body:        JSON.stringify({ text, voice: voiceRef.current }),
          credentials: "include",
        });
        if (!res.ok || msgIdRef.current !== msgId || !activeRef.current) return null;
        return await res.arrayBuffer();
      } catch {
        return null;
      }
    },
    []
  );

  // ── Schedule a phrase for gapless playback ────────────────────────────────
  // Fetch starts immediately (parallel). Scheduling is serialised (ordered).
  const schedulePhrase = useCallback(
    (text: string, msgId: number) => {
      if (text.length < PHRASE_MIN) return;
      phraseCount.current += 1;

      // Start network fetch NOW — runs in parallel with other in-flight phrases
      const fetchP = fetchPhraseAudio(text, msgId);

      scheduleChain.current = scheduleChain.current.then(async () => {
        if (msgIdRef.current !== msgId || !activeRef.current) { doneCount.current += 1; return; }

        const buf = await fetchP;
        if (!buf || msgIdRef.current !== msgId || !activeRef.current) {
          doneCount.current += 1;
          // Inline completion check (avoids stale closure on checkAllDone)
          if (streamDone.current && doneCount.current >= phraseCount.current) {
            if (stateRef.current === "speaking" && activeRef.current) {
              setS("listening");
              setTimeout(() => startListeningRef.current(), 300);
            }
          }
          return;
        }

        const ctx  = ttsCtxRef.current;
        const gain = gainRef.current;
        if (!ctx || !gain || ctx.state === "closed") { doneCount.current += 1; return; }

        let decoded: AudioBuffer;
        try { decoded = await ctx.decodeAudioData(buf); }
        catch { doneCount.current += 1; return; }

        if (msgIdRef.current !== msgId || !activeRef.current) return;

        // Restore gain (may have been faded by an interrupt)
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.setValueAtTime(1, ctx.currentTime);

        const startAt = Math.max(ctx.currentTime + 0.01, scheduledEnd.current);
        const src = ctx.createBufferSource();
        src.buffer = decoded;
        src.connect(gain);
        src.start(startAt);
        scheduledEnd.current = startAt + decoded.duration;
        activeNodes.current.push(src);
        setS("speaking");

        src.onended = () => {
          activeNodes.current = activeNodes.current.filter((n) => n !== src);
          try { src.disconnect(); } catch {}
          doneCount.current += 1;
          // Inline completion check — only refs, no stale closure risk
          if (
            msgIdRef.current === msgId &&
            activeRef.current &&
            streamDone.current &&
            doneCount.current >= phraseCount.current &&
            stateRef.current === "speaking"
          ) {
            setS("listening");
            setTimeout(() => startListeningRef.current(), 300);
          }
        };
      });
    },
    [fetchPhraseAudio]
  );

  // ── Flush the phrase buffer ───────────────────────────────────────────────
  function flushPhraseBuf(msgId: number, force = false) {
    if (phraseTimer.current) { clearTimeout(phraseTimer.current); phraseTimer.current = null; }
    const text = phraseBuf.current.trim();
    if (text.length >= (force ? 1 : PHRASE_MIN)) {
      schedulePhrase(text, msgId);
      phraseBuf.current = "";
    }
  }

  // ── Token-by-token phrase accumulator ─────────────────────────────────────
  function pushToken(token: string, msgId: number) {
    phraseBuf.current += token;
    const buf = phraseBuf.current;

    // Flush on natural speech boundaries
    if (buf.length >= PHRASE_PUNC_AT) {
      const last = buf.trimEnd().slice(-1);
      if (['.', '!', '?'].includes(last)) { flushPhraseBuf(msgId); return; }
      if ([',', ';', ':'].includes(last) && buf.length >= Math.floor(PHRASE_CHARS * 0.6)) {
        flushPhraseBuf(msgId); return;
      }
    }

    // Flush at hard character limit (split on word boundary)
    if (buf.length >= PHRASE_CHARS) {
      const pivot = buf.lastIndexOf(' ', PHRASE_CHARS);
      const split = pivot > PHRASE_MIN ? pivot : PHRASE_CHARS;
      const chunk = buf.slice(0, split).trim();
      phraseBuf.current = buf.slice(split).trimStart();
      if (chunk.length >= PHRASE_MIN) schedulePhrase(chunk, msgId);
      if (phraseBuf.current.length >= PHRASE_CHARS) pushToken("", msgId);
      return;
    }

    // Straggler timer — flush after PHRASE_TIMER ms of silence
    if (phraseTimer.current) clearTimeout(phraseTimer.current);
    phraseTimer.current = setTimeout(() => {
      phraseTimer.current = null;
      if (msgIdRef.current === msgId && phraseBuf.current.trim().length >= PHRASE_MIN) {
        flushPhraseBuf(msgId);
      }
    }, PHRASE_TIMER);
  }

  // ── AI streaming ──────────────────────────────────────────────────────────
  const sendToAI = useCallback(
    async (text: string) => {
      if (!text.trim() || !activeRef.current) return;

      setS("thinking");
      setTranscript(text);

      const msgId = Date.now();
      msgIdRef.current    = msgId;
      phraseBuf.current   = "";
      streamDone.current  = false;
      phraseCount.current = 0;
      doneCount.current   = 0;
      stopAudio();

      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      // Push user turn to history ref (React state updates after AI responds)
      historyRef.current = [...historyRef.current, { role: "user", content: text }];

      try {
        const res = await fetch("/api/voice-chat", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            message:   text,
            fileUrl:   docFileUrl ?? undefined,
            history:   historyRef.current.slice(-8).map(({ role, content }) => ({ role, content })),
            voice:     voiceRef.current,
            agentMode: agentModeRef.current,
          }),
          credentials: "include",
          signal:       ctrl.signal,
        });

        if (!res.ok || ctrl.signal.aborted) {
          if (activeRef.current) { setS("listening"); setTimeout(() => startListeningRef.current(), 300); }
          return;
        }

        let full = "", lineBuf = "";
        const reader  = res.body!.getReader();
        const decoder = new TextDecoder();
        let ended     = false;

        while (!ended) {
          const { done, value } = await reader.read();
          if (done || ctrl.signal.aborted) break;
          lineBuf += decoder.decode(value, { stream: true });
          const lines = lineBuf.split("\n");
          lineBuf = lines.pop()!;
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (raw === "[DONE]" || raw === "[ERROR]") { ended = true; break; }
            const token = raw.replace(/\\n/g, "\n");
            full += token;
            setAiText(full);
            pushToken(token, msgId);
          }
        }

        // Final flush — force any remaining buffer out to TTS
        if (msgIdRef.current === msgId) {
          flushPhraseBuf(msgId, true);
          streamDone.current = true;
          // If ALL phrases have already played (short reply), go back to listening
          if (phraseCount.current === 0 && activeRef.current) {
            setS("listening");
            setTimeout(() => startListeningRef.current(), 300);
          } else if (doneCount.current >= phraseCount.current && stateRef.current === "speaking" && activeRef.current) {
            setS("listening");
            setTimeout(() => startListeningRef.current(), 300);
          }
        }

        if (full) {
          setAiText(full);
          historyRef.current = [...historyRef.current, { role: "assistant", content: full }];
          setHistory(historyRef.current.slice(-40).map((t) => ({ ...t, ts: Date.now() })));
        }
      } catch (err: any) {
        if (err?.name !== "AbortError" && activeRef.current) {
          setS("listening");
          setTimeout(() => startListeningRef.current(), 300);
        }
      }
    },
    [docFileUrl, stopAudio] // eslint-disable-line
  );

  useEffect(() => { sendToAIRef.current = sendToAI; }, [sendToAI]);

  // ── SpeechRecognition ─────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!activeRef.current || stateRef.current === "thinking") return;

    const SRCtor: any =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition);
    if (!SRCtor) { setError("Speech recognition unavailable. Use Chrome or Edge."); return; }

    setS("listening");
    setTranscript("");
    manualStopRef.current = false;

    const rec = new SRCtor();
    rec.lang           = lang;
    rec.interimResults = true;
    rec.continuous     = false;
    recRef.current     = rec;

    rec.onresult = (e: any) => {
      let interim = "", final = "";
      for (const r of Array.from(e.results as any[])) {
        if ((r as any).isFinal) final += (r as any)[0].transcript;
        else                    interim += (r as any)[0].transcript;
      }
      const text = (final || interim).trim();
      setTranscript(text);

      // Interrupt: user speaks while AI is talking or thinking
      if (stateRef.current === "speaking" || stateRef.current === "thinking" || activeNodes.current.length > 0) {
        stopAudio();
        abortRef.current?.abort();
      }

      if (silenceRef.current) clearTimeout(silenceRef.current);

      if (final && final.trim()) {
        manualStopRef.current = true;
        rec.stop();
        sendToAIRef.current(final.trim());
      } else if (text) {
        silenceRef.current = setTimeout(() => {
          if (!activeRef.current) return;
          manualStopRef.current = true;
          rec.stop();
          sendToAIRef.current(text);
        }, silenceMs);
      }
    };

    rec.onerror = (e: any) => {
      if (!activeRef.current) return;
      if (e.error === "no-speech") {
        setTimeout(() => {
          if (activeRef.current && stateRef.current === "listening") startListeningRef.current();
        }, 200);
        return;
      }
      if (e.error === "aborted") return;
      const MAP: Record<string, string> = {
        "not-allowed":  "Microphone blocked — allow access in your browser settings.",
        "not-found":    "No microphone detected.",
        "not-readable": "Microphone is in use by another app.",
      };
      setError(MAP[e.error as string] ?? `Mic error: ${e.error}`);
    };

    rec.onend = () => {
      if (manualStopRef.current || !activeRef.current) return;
      if (stateRef.current === "listening") {
        setTimeout(() => {
          if (activeRef.current && stateRef.current === "listening") startListeningRef.current();
        }, 200);
      }
    };

    rec.start();
  }, [lang, silenceMs, stopAudio]);

  useEffect(() => { startListeningRef.current = startListening; }, [startListening]);

  // ── Waveform — mic AnalyserNode ───────────────────────────────────────────
  const startWaveform = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      micStreamRef.current = stream;
      const ctx      = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
      micCtxRef.current   = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const N    = 24;
      function tick() {
        analyser.getByteFrequencyData(data);
        setWaveform(
          Array.from({ length: N }, (_, i) =>
            Math.max(data[Math.floor((i / N) * data.length)] / 255, 0.04)
          )
        );
        animRef.current = requestAnimationFrame(tick);
      }
      tick();
    } catch (err: any) {
      const msg =
        err?.name === "NotAllowedError" ? "Microphone access denied."   :
        err?.name === "NotFoundError"   ? "No microphone detected."      :
                                          "Could not access microphone.";
      setError(msg);
    }
  }, []);

  const stopWaveform = useCallback(() => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micCtxRef.current?.close().catch(() => {});
    micStreamRef.current = null;
    micCtxRef.current    = null;
    setWaveform(Array(24).fill(0));
  }, []);

  // ── Public API ────────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    if (activeRef.current) return;
    setError(null); setAiText(""); setTranscript("");
    activeRef.current = true;
    setActive(true);
    initTTS();           // must be inside user-gesture handler
    await startWaveform();
    if (activeRef.current) startListeningRef.current();
  }, [initTTS, startWaveform]);

  const stop = useCallback(() => {
    activeRef.current = false;
    setActive(false);
    setS("idle");
    setTranscript("");
    if (silenceRef.current) { clearTimeout(silenceRef.current); silenceRef.current = null; }
    recRef.current?.stop(); recRef.current = null;
    abortRef.current?.abort(); abortRef.current = null;
    stopAudio();
    stopWaveform();
    ttsCtxRef.current?.close().catch(() => {});
    ttsCtxRef.current = null;
    gainRef.current   = null;
  }, [stopAudio, stopWaveform]);

  const toggle = useCallback(() => {
    if (activeRef.current) stop(); else start();
  }, [start, stop]);

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    setHistory([]);
    setAiText("");
    setTranscript("");
  }, []);

  const changeVoice = useCallback((v: string) => {
    voiceRef.current = v;
    setVoice(v);
  }, []);

  const changeAgentMode = useCallback((m: AgentMode) => {
    agentModeRef.current = m;
    setAgentMode(m);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { stop(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    state, active, transcript, aiText, waveform, error, voice, agentMode, history,
    toggle, start, stop, clearHistory, changeVoice, changeAgentMode,
    clearError: () => setError(null),
  };
}
