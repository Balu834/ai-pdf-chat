"use client";

import { Suspense, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import "./viewer.css";
import { reportError } from "@/lib/reportError";
import ErrorBoundary from "@/app/components/ErrorBoundary";

const PdfViewer = dynamic(() => import("@/app/components/PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="vw-url-loading">
      <div className="vw-url-spinner" />
      <span>Loading viewer…</span>
    </div>
  ),
});

/* ── Types ──────────────────────────────────────────────────────────────── */
interface Source { page: number; }
interface MultiSource { docId: string; fileName: string; page: number | null; }
interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
  done?: boolean;
  sources?: Source[];
  multiSources?: MultiSource[];
}
interface DocItem {
  id: string;
  file_name: string;
  file_url: string;
  created_at: string;
}
interface Insights {
  summary: string;
  key_points: string[];
  suggested_questions: string[];
}
interface CompareResult {
  result: string;
  doc1: { id: string; name: string };
  doc2: { id: string; name: string };
}
interface RedlineChange {
  section: string;
  type: "added" | "removed" | "modified";
  significance: "high" | "medium" | "low";
  doc1_text: string | null;
  doc2_text: string | null;
  notes: string;
}
interface RedlineResult {
  doc1: string;
  doc2: string;
  summary: string;
  changes: RedlineChange[];
}
interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  topic: string;
}
interface Flashcard {
  id: string;
  front: string;
  back: string;
  next_review: string;
  interval_days: number;
  ease_factor: number;
  reps: number;
  doc_name?: string;
}
interface TutorMsg { role: "user" | "lexi"; text: string; }
type TutorMode = "normal" | "simple" | "eli5" | "exam" | "hinglish";

/* ── Constants ──────────────────────────────────────────────────────────── */
const CHIPS = [
  "Summarise this document",
  "What are the key numbers?",
  "Any risks mentioned?",
  "Suggest follow-up questions",
];
const EXPLAIN_PRESETS = [
  { label: "Explain simply",  prompt: "Explain the main concept of this document in simple terms a beginner would understand." },
  { label: "Give examples",   prompt: "Explain the key topics from this document with 3 real-world examples." },
  { label: "Exam answer",     prompt: "Write a model exam answer covering the most important points from this document." },
  { label: "Step by step",    prompt: "Break down the main topic from this document step by step." },
  { label: "In Hinglish",     prompt: "Explain the main topic of this document in Hinglish (mix of Hindi and English)." },
];

/* ── Markdown-lite renderer ─────────────────────────────────────────────── */
function renderMarkdown(raw: string): React.ReactNode {
  if (!raw) return null;
  const lines = raw.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { nodes.push(<br key={i} />); i++; continue; }
    if (/^[-*•]\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i])) {
        items.push(<li key={i}>{inlineRender(lines[i].replace(/^[-*•]\s/, ""))}</li>);
        i++;
      }
      nodes.push(<ul key={`ul-${i}`}>{items}</ul>);
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(<li key={i}>{inlineRender(lines[i].replace(/^\d+\.\s/, ""))}</li>);
        i++;
      }
      nodes.push(<ol key={`ol-${i}`}>{items}</ol>);
      continue;
    }
    if (line.startsWith("```")) {
      const block: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { block.push(lines[i]); i++; }
      nodes.push(<pre key={i}><code>{block.join("\n")}</code></pre>);
      i++;
      continue;
    }
    nodes.push(<p key={i}>{inlineRender(line)}</p>);
    i++;
  }
  return <>{nodes}</>;
}

function inlineRender(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i}>{part.slice(1, -1)}</code>;
    return part;
  });
}

/* ── Citation extractor ─────────────────────────────────────────────────── */
function splitCitation(text: string): { body: string; cite: string | null } {
  const patterns = [
    /\n+(?:Source|Cited from|Citation|References?):\s*(.+)$/i,
    /\n+((?:p\.\s*\d+|§\s*[\d.]+|chart\s*[\d.]+|appendix\s*\w+)[^\n]{0,120})$/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return { body: text.slice(0, m.index!).trimEnd(), cite: m[1].trim() };
  }
  return { body: text, cite: null };
}

function useAutoResize(ref: React.RefObject<HTMLTextAreaElement | null>, value: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value, ref]);
}

/* ── File icon ──────────────────────────────────────────────────────────── */
function FileIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   VIEWER CONTENT
   ══════════════════════════════════════════════════════════════════════════ */
function ViewerContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const rawUrl       = useMemo(() => searchParams.get("url") ?? "", [searchParams]);

  /* PDF state */
  const [signedUrl,   setSignedUrl]   = useState<string>("");
  const [urlLoading,  setUrlLoading]  = useState(true);
  const [fileName,    setFileName]    = useState("Document");
  const [pageInfo,    setPageInfo]    = useState({ current: 1, total: 0 });
  const [showPreview, setShowPreview] = useState(false);

  /* Chat state */
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [input,     setInput]     = useState("");
  const [streaming, setStreaming] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [limitExceeded, setLimitExceeded] = useState(false);

  /* Source citations */
  const [targetPage, setTargetPage] = useState<number | undefined>(undefined);

  /* AI Summary */
  const [summaryOpen,    setSummaryOpen]    = useState(false);
  const [summaryType,    setSummaryType]    = useState<"executive"|"insights"|"actions"|"simple">("executive");
  const [summaryText,    setSummaryText]    = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError,   setSummaryError]   = useState<string | null>(null);

  /* Multi-PDF Chat */
  const [multiMode,      setMultiMode]      = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  /* Theme */
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => { if (localStorage.getItem("lp-theme") === "dark") setDarkMode(true); }, []);
  const toggleDark = () => { const n = !darkMode; setDarkMode(n); localStorage.setItem("lp-theme", n ? "dark" : "light"); };

  /* Files sidebar */
  const [allDocs,   setAllDocs]   = useState<DocItem[]>([]);
  const [showFiles, setShowFiles] = useState(true);

  /* Right panel: insights / compare / redline / quiz / cards / tutor / risks / financials */
  const [rightTab,      setRightTab]      = useState<"insights" | "compare" | "redline" | "quiz" | "cards" | "tutor" | "risks" | "financials" | null>(null);
  const [insights,      setInsights]      = useState<Insights | null>(null);
  const [insightsLoad,  setInsightsLoad]  = useState(false);
  const [insightsErr,   setInsightsErr]   = useState<string | null>(null);
  const [compareDocId,  setCompareDocId]  = useState<string>("");
  const [compareQ,      setCompareQ]      = useState("");
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [compareLoad,   setCompareLoad]   = useState(false);
  const [compareErr,    setCompareErr]    = useState<string | null>(null);
  const [redlineDocId,  setRedlineDocId]  = useState<string>("");
  const [redlineResult, setRedlineResult] = useState<RedlineResult | null>(null);
  const [redlineLoad,   setRedlineLoad]   = useState(false);
  const [redlineErr,    setRedlineErr]    = useState<string | null>(null);

  /* Quiz state */
  const [quizQuestions,  setQuizQuestions]  = useState<QuizQuestion[]>([]);
  const [quizLoading,    setQuizLoading]    = useState(false);
  const [quizErr,        setQuizErr]        = useState<string | null>(null);
  const [quizDifficulty, setQuizDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [quizCount,      setQuizCount]      = useState(10);
  const [quizAnswers,    setQuizAnswers]    = useState<Record<number, string>>({});
  const [quizSubmitted,  setQuizSubmitted]  = useState(false);

  /* Tutor state */
  const [tutorMsgs,    setTutorMsgs]    = useState<TutorMsg[]>([]);
  const [tutorInput,   setTutorInput]   = useState("");
  const [tutorMode,    setTutorMode]    = useState<TutorMode>("normal");
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorAutoTTS, setTutorAutoTTS] = useState(true);
  const tutorEndRef = useRef<HTMLDivElement>(null);

  /* Flashcard state */
  const [fcCards,       setFcCards]       = useState<Flashcard[]>([]);
  const [fcLoading,     setFcLoading]     = useState(false);
  const [fcErr,         setFcErr]         = useState<string | null>(null);
  const [fcCount,       setFcCount]       = useState(15);
  const [fcMode,        setFcMode]        = useState<"generate" | "review">("generate");
  /* review session state */
  const [fcSession,     setFcSession]     = useState<Flashcard[]>([]); // due cards queue
  const [fcIdx,         setFcIdx]         = useState(0);               // current card index
  const [fcFlipped,     setFcFlipped]     = useState(false);           // is card flipped?
  const [fcDone,        setFcDone]        = useState(false);           // session complete

  /* Risk flags state */
  const [risks,        setRisks]        = useState<object[] | null>(null);
  const [risksLoad,    setRisksLoad]    = useState(false);
  const [risksErr,     setRisksErr]     = useState<string | null>(null);

  /* Financials state */
  const [financials,     setFinancials]     = useState<Record<string, unknown> | null>(null);
  const [financialsLoad, setFinancialsLoad] = useState(false);
  const [financialsErr,  setFinancialsErr]  = useState<string | null>(null);

  /* Export Q&A state */
  const [exportLoad, setExportLoad] = useState(false);

  /* Mic / voice input */
  const [listening, setListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  /* Copy + TTS + Share */
  const [copiedId,  setCopiedId]  = useState<number | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [sharedId,  setSharedId]  = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const shareMessage = async (id: number, text: string) => {
    if (currentDoc) {
      try {
        const res = await fetch("/api/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId: currentDoc.id }),
          credentials: "include",
        });
        const data = await res.json();
        if (data.url) {
          await navigator.clipboard.writeText(data.url);
          setSharedId(id);
          setTimeout(() => setSharedId(null), 2000);
          return;
        }
      } catch {}
    }
    const shareText = `${text}\n\n— via Intellixy AI (${window.location.host})`;
    if (navigator.share) {
      try { await navigator.share({ text: shareText }); } catch {}
    } else {
      await navigator.clipboard.writeText(shareText);
      setSharedId(id);
      setTimeout(() => setSharedId(null), 2000);
    }
  };

  const endRef      = useRef<HTMLDivElement>(null);
  const abortRef    = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useAutoResize(textareaRef, input);

  /* Derived: current doc ID from allDocs list */
  const currentDoc = useMemo(
    () => allDocs.find(d => d.file_url === rawUrl || rawUrl.includes(d.file_url)) ?? null,
    [allDocs, rawUrl]
  );

  /* Fetch all docs for sidebar */
  useEffect(() => {
    fetch("/api/docs", { credentials: "include" })
      .then(r => r.json())
      .then((data: DocItem[]) => Array.isArray(data) && setAllDocs(data))
      .catch(() => {});
  }, []);

  /* Derive file name from URL */
  useEffect(() => {
    if (!rawUrl) return;
    const raw = decodeURIComponent(rawUrl.split("/").pop()?.split("?")[0] ?? "");
    const name = raw.replace(/^\d{13}-/, "").replace(/^\d+-/, "");
    if (name) setFileName(name);
  }, [rawUrl]);

  /* Fetch signed URL */
  useEffect(() => {
    if (!rawUrl) { setUrlLoading(false); return; }
    setUrlLoading(true);
    const ctrl = new AbortController();
    fetch(`/api/pdf-signed-url?fileUrl=${encodeURIComponent(rawUrl)}`, {
      credentials: "include", signal: ctrl.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        const json = await res.json() as { signedUrl?: string; fileName?: string };
        setSignedUrl(json.signedUrl ?? rawUrl);
        if (json.fileName) setFileName(json.fileName);
      })
      .catch((err: unknown) => {
        if ((err as Error).name !== "AbortError") setSignedUrl(rawUrl);
      })
      .finally(() => setUrlLoading(false));
    return () => ctrl.abort();
  }, [rawUrl]);

  /* Auto-scroll chat */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, streaming]);

  /* Reset insights + citation state when doc changes */
  useEffect(() => {
    setInsights(null);
    setInsightsErr(null);
    setCompareResult(null);
    setCompareErr(null);
    setCompareDocId("");
    setTargetPage(undefined);
    setSummaryOpen(false);
    setSummaryText("");
    setRisks(null);
    setRisksErr(null);
    setFinancials(null);
    setFinancialsErr(null);
    setRedlineResult(null);
    setRedlineErr(null);
    setRedlineDocId("");
  }, [rawUrl]);

  /* Load insights */
  const loadInsights = useCallback(async () => {
    if (!currentDoc) { setInsightsErr("Document not found in your library."); return; }
    setInsightsLoad(true);
    setInsightsErr(null);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: currentDoc.id, fileUrl: rawUrl }),
        credentials: "include",
      });
      const data = await res.json() as Insights & { error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed");
      setInsights(data);
    } catch (e: unknown) {
      setInsightsErr((e as Error).message ?? "Could not load insights.");
    } finally {
      setInsightsLoad(false);
    }
  }, [currentDoc, rawUrl]);

  /* Load clause & risk flags */
  const loadRisks = useCallback(async () => {
    if (!currentDoc) { setRisksErr("Document not found in your library."); return; }
    setRisksLoad(true);
    setRisksErr(null);
    try {
      const res = await fetch("/api/clause-risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: currentDoc.id, fileUrl: rawUrl }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || (data as { error?: string })?.error) throw new Error((data as { error?: string })?.error ?? "Analysis failed");
      setRisks(data as object[]);
    } catch (e: unknown) {
      setRisksErr((e as Error).message ?? "Could not analyse document.");
    } finally {
      setRisksLoad(false);
    }
  }, [currentDoc, rawUrl]);

  /* Load financial data */
  const loadFinancials = useCallback(async () => {
    if (!currentDoc) { setFinancialsErr("Document not found in your library."); return; }
    setFinancialsLoad(true);
    setFinancialsErr(null);
    try {
      const res = await fetch("/api/financials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: currentDoc.id, fileUrl: rawUrl }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || (data as { error?: string })?.error) throw new Error((data as { error?: string })?.error ?? "Extraction failed");
      setFinancials(data as Record<string, unknown>);
    } catch (e: unknown) {
      setFinancialsErr((e as Error).message ?? "Could not extract financials.");
    } finally {
      setFinancialsLoad(false);
    }
  }, [currentDoc, rawUrl]);

  /* Run compare */
  const runCompare = useCallback(async () => {
    if (!currentDoc || !compareDocId) return;
    setCompareLoad(true);
    setCompareErr(null);
    setCompareResult(null);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc1Id: currentDoc.id, doc2Id: compareDocId, question: compareQ.trim() || undefined }),
        credentials: "include",
      });
      const data = await res.json() as CompareResult & { error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed");
      setCompareResult(data);
    } catch (e: unknown) {
      setCompareErr((e as Error).message ?? "Comparison failed.");
    } finally {
      setCompareLoad(false);
    }
  }, [currentDoc, compareDocId, compareQ]);

  /* Run redline */
  const runRedline = useCallback(async () => {
    if (!currentDoc || !redlineDocId) return;
    setRedlineLoad(true);
    setRedlineErr(null);
    setRedlineResult(null);
    try {
      const res = await fetch("/api/redline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc1Id: currentDoc.id, doc2Id: redlineDocId }),
        credentials: "include",
      });
      const data = await res.json() as RedlineResult & { error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed");
      setRedlineResult(data);
    } catch (e: unknown) {
      setRedlineErr((e as Error).message ?? "Redline failed.");
    } finally {
      setRedlineLoad(false);
    }
  }, [currentDoc, redlineDocId]);

  /* Tutor: send message and get AI response with auto-TTS */
  const sendToTutor = useCallback(async (overrideMsg?: string) => {
    const msg = (overrideMsg ?? tutorInput).trim();
    if (!msg || tutorLoading) return;
    setTutorInput("");
    const userMsg: TutorMsg = { role: "user", text: msg };
    setTutorMsgs(prev => [...prev, userMsg]);
    setTutorLoading(true);
    try {
      // Build history for context (last 8 messages as OpenAI format)
      const history = tutorMsgs.slice(-8).map(m => ({
        role: m.role === "lexi" ? "assistant" : "user",
        content: m.text,
      }));
      const res = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, fileUrl: rawUrl, documentId: currentDoc?.id, history, mode: tutorMode }),
        credentials: "include",
      });
      const data = await res.json() as { text?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed");
      const lexiMsg: TutorMsg = { role: "lexi", text: data.text ?? "" };
      setTutorMsgs(prev => [...prev, lexiMsg]);
      // Auto-TTS
      if (tutorAutoTTS && data.text) {
        fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: data.text, voice: "nova", model: "tts-1" }),
          credentials: "include",
        }).then(async r => {
          if (!r.ok) return;
          const blob = await r.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.onended = () => URL.revokeObjectURL(url);
          audio.play().catch(() => {});
        }).catch(() => {});
      }
    } catch {
      setTutorMsgs(prev => [...prev, { role: "lexi", text: "Sorry, I couldn't respond. Please try again." }]);
    } finally {
      setTutorLoading(false);
    }
  }, [tutorInput, tutorLoading, tutorMsgs, rawUrl, currentDoc, tutorMode, tutorAutoTTS]);

  /* Auto-scroll tutor chat */
  useEffect(() => {
    tutorEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [tutorMsgs]);

  /* Flashcard: generate from current doc */
  const generateCards = useCallback(async () => {
    if (!currentDoc) { setFcErr("Document not found in your library."); return; }
    setFcLoading(true); setFcErr(null); setFcCards([]);
    try {
      const res = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: currentDoc.id, fileUrl: rawUrl, count: fcCount }),
        credentials: "include",
      });
      const data = await res.json() as { flashcards?: Flashcard[]; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed");
      setFcCards(data.flashcards ?? []);
    } catch (e: unknown) {
      setFcErr((e as Error).message ?? "Generation failed.");
    } finally {
      setFcLoading(false);
    }
  }, [currentDoc, rawUrl, fcCount]);

  /* Flashcard: load due cards for review */
  const loadDueCards = useCallback(async () => {
    setFcLoading(true); setFcErr(null);
    try {
      const res = await fetch("/api/flashcards?due=true", { credentials: "include" });
      const data = await res.json() as { flashcards?: Flashcard[]; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed");
      const due = data.flashcards ?? [];
      setFcSession(due);
      setFcIdx(0); setFcFlipped(false); setFcDone(due.length === 0);
    } catch (e: unknown) {
      setFcErr((e as Error).message ?? "Could not load cards.");
    } finally {
      setFcLoading(false);
    }
  }, []);

  /* Flashcard: submit review rating and advance to next card */
  const reviewCard = useCallback(async (quality: 0 | 2 | 4 | 5) => {
    const card = fcSession[fcIdx];
    if (!card) return;
    // Fire-and-forget — don't block UI
    fetch("/api/flashcards/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: card.id, quality }),
      credentials: "include",
    }).catch(() => {});
    const next = fcIdx + 1;
    if (next >= fcSession.length) {
      setFcDone(true);
    } else {
      setFcIdx(next);
      setFcFlipped(false);
    }
  }, [fcSession, fcIdx]);

  /* Generate quiz */
  const loadQuiz = useCallback(async () => {
    if (!currentDoc) { setQuizErr("Document not found in your library."); return; }
    setQuizLoading(true);
    setQuizErr(null);
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizSubmitted(false);
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: currentDoc.id, fileUrl: rawUrl, difficulty: quizDifficulty, count: quizCount }),
        credentials: "include",
      });
      const data = await res.json() as { questions?: QuizQuestion[]; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed");
      setQuizQuestions(data.questions ?? []);
    } catch (e: unknown) {
      setQuizErr((e as Error).message ?? "Quiz generation failed.");
    } finally {
      setQuizLoading(false);
    }
  }, [currentDoc, rawUrl, quizDifficulty, quizCount]);

  /* Send chat message */
  const toggleMic = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) { alert("Voice input is not supported in this browser."); return; }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript as string;
      setInput(prev => prev ? `${prev} ${transcript}` : transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    rec.start();
    setListening(true);
  }, [listening]);

  const copyMessage = useCallback((id: number, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {});
  }, []);

  const playTTS = useCallback(async (id: number, text: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    audioRef.current = null;
    setPlayingId(id);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "nova", model: "tts-1-hd" }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setPlayingId(null); URL.revokeObjectURL(url); };
      audio.onerror = () => { setPlayingId(null); URL.revokeObjectURL(url); };
      await audio.play();
    } catch {
      setPlayingId(null);
    }
  }, [playingId]);

  const send = useCallback(async (question?: string) => {
    const q = (question ?? input).trim();
    if (!q || streaming || !rawUrl) return;
    setInput(""); setChatError(null); setLimitExceeded(false);
    const uid = Date.now();
    setMessages(m => [...m, { id: uid, role: "user", text: q, done: true }]);
    setStreaming(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const aiId = uid + 1;
    try {
      const isMulti = multiMode && selectedDocIds.length > 0;
      const res = await fetch(isMulti ? "/api/multi-chat" : "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isMulti
            ? { message: q, documentIds: selectedDocIds }
            : { message: q, fileUrl: rawUrl }
        ),
        credentials: "include",
        signal: abortRef.current.signal,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string; limitExceeded?: boolean };
        if (data.limitExceeded) { setLimitExceeded(true); setStreaming(false); setMessages(m => m.filter(msg => msg.id !== uid)); return; }
        throw new Error(data.error ?? `Server error ${res.status}`);
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";
      let doneSignal = false;
      let sseBuffer = "";
      setMessages(m => [...m, { id: aiId, role: "ai", text: "", done: false }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split("\n");
        // Keep the last (potentially incomplete) line in the buffer
        sseBuffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") {
            doneSignal = true;
            setMessages(m => {
              const copy = [...m];
              const idx = copy.findLastIndex(msg => msg.id === aiId);
              if (idx >= 0) copy[idx] = { ...copy[idx], done: true };
              return copy;
            });
            continue;
          }
          if (doneSignal && payload.startsWith("[SOURCES]")) {
            try {
              const raw = JSON.parse(payload.slice(9));
              if (Array.isArray(raw) && raw.length > 0) {
                if (typeof raw[0] === "number") {
                  // Single-PDF: array of page numbers
                  const sources: Source[] = (raw as number[]).map(p => ({ page: p }));
                  setMessages(m => {
                    const copy = [...m];
                    const idx = copy.findLastIndex(msg => msg.id === aiId);
                    if (idx >= 0) copy[idx] = { ...copy[idx], sources };
                    return copy;
                  });
                } else {
                  // Multi-PDF: array of { docId, fileName, page }
                  const multiSources = raw as MultiSource[];
                  setMessages(m => {
                    const copy = [...m];
                    const idx = copy.findLastIndex(msg => msg.id === aiId);
                    if (idx >= 0) copy[idx] = { ...copy[idx], multiSources };
                    return copy;
                  });
                }
              }
            } catch { /* malformed — ignore */ }
            continue;
          }
          if (!doneSignal) {
            full += payload.replace(/\\n/g, "\n");
            setMessages(m => {
              const copy = [...m];
              const idx = copy.findLastIndex(msg => msg.id === aiId);
              if (idx >= 0) copy[idx] = { ...copy[idx], text: full };
              return copy;
            });
          }
        }
      }
      if (full && currentDoc) {
        fetch("/api/memory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", text: q }, { role: "ai", text: full }],
            documentTitle: currentDoc.file_name,
          }),
          credentials: "include",
        }).catch(() => {});
      }
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? "Unknown error";
      if (msg === "AbortError" || (err as Error)?.name === "AbortError") return;
      setChatError(msg);
      reportError({ type: "chat", message: msg, page: "/viewer" });
      setMessages(m => m.filter(msg => msg.id !== aiId));
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, rawUrl, multiMode, selectedDocIds, showPreview]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }, [send]);

  /* Open right tab and auto-load data */
  const openRightTab = useCallback((tab: "insights" | "compare" | "quiz" | "cards" | "tutor" | "risks" | "financials") => {
    setRightTab(prev => prev === tab ? null : tab);
    if (tab === "insights" && !insights && !insightsLoad) loadInsights();
    if (tab === "risks" && !risks && !risksLoad) loadRisks();
    if (tab === "financials" && !financials && !financialsLoad) loadFinancials();
  }, [insights, insightsLoad, loadInsights, risks, risksLoad, loadRisks, financials, financialsLoad, loadFinancials]);

  /* Export chat Q&A as Word document */
  const handleExport = useCallback(async () => {
    if (exportLoad) return;
    setExportLoad(true);
    try {
      const exportMessages = messages.filter(m => m.done).map(m => ({ role: m.role, text: m.text }));
      const res = await fetch("/api/export-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: fileName.replace(/\.pdf$/i, ""), messages: exportMessages }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName.replace(/\.pdf$/i, "")}-qa.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      alert((e as Error).message ?? "Export failed");
    } finally {
      setExportLoad(false);
    }
  }, [exportLoad, messages, fileName]);

  /* ── No URL ─────────────────────────────────────────────────────────────── */
  if (!rawUrl) {
    return (
      <div className="vw-root">
        <div className="vw-no-url">
          <div className="vw-no-url-icon"><FileIcon size={28} /></div>
          <div className="vw-no-url-title">No document selected</div>
          <div className="vw-no-url-sub">Open a PDF from your dashboard to start chatting with it.</div>
          <button className="vw-no-url-btn" onClick={() => router.push("/dashboard")}>Go to Dashboard</button>
        </div>
      </div>
    );
  }

  const otherDocs = allDocs.filter(d => d.id !== currentDoc?.id);

  /* ── Main viewer ─────────────────────────────────────────────────────────── */
  return (
    <div className={`vw-root${darkMode ? " dark" : ""}`}>

      {/* ── TOP BAR ────────────────────────────────────────────────────────── */}
      <div className="vw-topbar">
        {/* Left controls */}
        <button className="vw-back-btn" onClick={() => router.push("/dashboard")}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M9 3L5 7.5 9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Dashboard
        </button>

        {/* Files toggle */}
        <button
          className={`vw-topbar-btn${showFiles ? " vw-topbar-btn-active" : ""}`}
          onClick={() => setShowFiles(v => !v)}
          title="Toggle files panel"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <line x1="8" y1="4" x2="8" y2="20"/>
          </svg>
          Files {allDocs.length > 0 && <span className="vw-files-count">{allDocs.length}</span>}
        </button>

        <div className="vw-topbar-title">{fileName}</div>

        <div className="vw-topbar-actions">
          {showPreview && pageInfo.total > 0 && (
            <span style={{ fontSize: 12, color: "var(--text-3)", marginRight: 4 }}>
              p.{pageInfo.current}/{pageInfo.total}
            </span>
          )}
          <button
            className={`vw-topbar-btn vw-preview-toggle${showPreview ? " active" : ""}`}
            onClick={() => setShowPreview(v => !v)}
            title={showPreview ? "Hide PDF preview" : "Show PDF preview"}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
            <span>{showPreview ? "Hide PDF" : "View PDF"}</span>
          </button>

          {/* Multi-PDF button */}
          <button
            className={`vw-topbar-btn${multiMode ? " vw-topbar-btn-active" : ""}`}
            onClick={() => {
              setMultiMode(m => !m);
              if (!multiMode) setSelectedDocIds([]);
            }}
            title="Chat across multiple PDFs"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="12" x2="12" y2="18"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            Multi-PDF
          </button>

          {/* Insights button */}
          <button
            className={`vw-topbar-btn${rightTab === "insights" ? " vw-topbar-btn-active" : ""}`}
            onClick={() => openRightTab("insights")}
            title="AI Insights"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Insights
          </button>

          {/* Compare button */}
          <button
            className={`vw-topbar-btn${rightTab === "compare" ? " vw-topbar-btn-active" : ""}`}
            onClick={() => openRightTab("compare")}
            title="Compare with another document"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="18" rx="1"/>
              <rect x="14" y="3" width="7" height="18" rx="1"/>
            </svg>
            Compare
          </button>

          {/* Redline button */}
          <button
            className={`vw-topbar-btn${rightTab === "redline" ? " vw-topbar-btn-active" : ""}`}
            onClick={() => setRightTab(prev => prev === "redline" ? null : "redline")}
            title="Contract redline — clause-by-clause diff"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Redline
          </button>

          {/* Quiz button */}
          <button
            className={`vw-topbar-btn vw-quiz-btn${rightTab === "quiz" ? " vw-topbar-btn-active" : ""}`}
            onClick={() => openRightTab("quiz")}
            title="Generate AI Quiz"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Quiz
          </button>

          {/* Flashcards button */}
          <button
            className={`vw-topbar-btn vw-cards-btn${rightTab === "cards" ? " vw-topbar-btn-active" : ""}`}
            onClick={() => openRightTab("cards")}
            title="AI Flashcards"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/>
              <line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
            Cards
          </button>

          {/* Voice Tutor button */}
          <button
            className={`vw-topbar-btn vw-tutor-btn${rightTab === "tutor" ? " vw-topbar-btn-active" : ""}`}
            onClick={() => openRightTab("tutor")}
            title="AI Voice Tutor"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
              <line x1="8" y1="22" x2="16" y2="22"/>
            </svg>
            Tutor
          </button>

          {/* Risk Flags button */}
          <button
            className={`vw-topbar-btn${rightTab === "risks" ? " vw-topbar-btn-active" : ""}`}
            onClick={() => openRightTab("risks")}
            title="Clause & Risk Analysis"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Risks
          </button>

          {/* Financials button */}
          <button
            className={`vw-topbar-btn${rightTab === "financials" ? " vw-topbar-btn-active" : ""}`}
            onClick={() => openRightTab("financials")}
            title="Financial Data Extraction"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            Financials
          </button>

          {/* Export Q&A button */}
          <button
            className="vw-topbar-btn"
            onClick={handleExport}
            disabled={exportLoad || messages.length === 0}
            title="Export Q&A as Word document"
          >
            {exportLoad ? (
              <div className="vw-url-spinner" style={{ width: 12, height: 12 }} />
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
            )}
            Export
          </button>

          <a className="vw-topbar-btn" href={rawUrl} target="_blank" rel="noreferrer" download>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1v8M3.5 6l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 10.5h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            Download
          </a>
          <button className="vw-topbar-btn" onClick={toggleDark} aria-label="Toggle theme" style={{ color: darkMode ? "var(--accent)" : undefined }}>
            {darkMode
              ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>
        </div>
      </div>

      {/* ── PANELS ─────────────────────────────────────────────────────────── */}
      <div className="vw-panels">

        {/* ── LEFT: FILES SIDEBAR ──────────────────────────────────────────── */}
        {showFiles && (
          <div className="vw-files-panel">
            <div className="vw-files-header">
              <span>Your Files</span>
              <span className="vw-files-count-badge">{allDocs.length}</span>
            </div>
            <div className="vw-files-list">
              {allDocs.length === 0 && (
                <div className="vw-files-empty">No documents yet</div>
              )}
              {allDocs.map(doc => {
                const isActive = doc.file_url === rawUrl;
                const cleanName = doc.file_name.replace(/\.pdf$/i, "");
                return (
                  <button
                    key={doc.id}
                    className={`vw-file-item${isActive ? " active" : ""}`}
                    onClick={() => !isActive && router.push(`/viewer?url=${encodeURIComponent(doc.file_url)}`)}
                    title={cleanName}
                  >
                    <span className="vw-file-item-icon"><FileIcon size={13} /></span>
                    <span className="vw-file-item-name">{cleanName}</span>
                    {isActive && <span className="vw-file-item-dot" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CENTER: PDF + CHAT ───────────────────────────────────────────── */}
        <div className={`vw-center${showPreview ? "" : " vw-center-chat-only"}${rightTab ? " vw-center-with-right" : ""}`}>

          {/* PDF preview */}
          {showPreview && (
            <div className="vw-pdf-panel">
              {urlLoading ? (
                <div className="vw-url-loading">
                  <div className="vw-url-spinner" />
                  <span>Preparing document…</span>
                </div>
              ) : (
                <PdfViewer
                  url={signedUrl || rawUrl}
                  onPageChange={(cur, tot) => setPageInfo({ current: cur, total: tot })}
                  targetPage={targetPage}
                />
              )}
            </div>
          )}

          {/* Chat */}
          <div className="vw-chat-panel">
            <div className="ch-header">
              <div className="ch-header-left">
                <div className="ch-header-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div>
                  <div className="ch-header-title">Ask this document</div>
                  {messages.length > 0 && (
                    <div className="ch-header-sub">{messages.length} message{messages.length > 1 ? "s" : ""}</div>
                  )}
                </div>
              </div>
              {messages.length > 0 && (
                <button className="ch-clear-btn" onClick={() => { setMessages([]); setChatError(null); }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Clear
                </button>
              )}
            </div>

            <div className="ch-messages">
              {messages.length === 0 && !streaming && (
                <div className="ch-empty">
                  <div className="ch-empty-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 12h6M9 16h4M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/>
                    </svg>
                  </div>
                  <div className="ch-empty-title">Ready to answer</div>
                  <div className="ch-empty-sub">Ask anything — summaries, key figures, risk analysis, or specific clauses. Every answer is cited.</div>
                </div>
              )}

              {messages.map(msg => {
                if (msg.role === "user") {
                  return (
                    <div key={msg.id} className="ch-msg ch-msg-user">
                      <div className="ch-msg-label">You</div>
                      <div className="ch-bubble">{msg.text}</div>
                    </div>
                  );
                }
                const { body, cite } = splitCitation(msg.text);
                const isStreaming = !msg.done && streaming;
                return (
                  <div key={msg.id} className="ch-msg ch-msg-ai">
                    <div className="ch-msg-label">Intellixy AI</div>
                    <div className="ch-bubble">
                      {renderMarkdown(body)}
                      {isStreaming && !body && <span style={{ color: "var(--text-3)", fontStyle: "italic" }}>Thinking…</span>}
                      {isStreaming && <span className="ch-cursor" />}
                      {cite && msg.done && (
                        <div className="ch-citation">
                          <span className="ch-citation-icon">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z"/>
                              <polyline points="15 3 15 9 21 9"/>
                            </svg>
                          </span>
                          <span>Cited from {cite}</span>
                        </div>
                      )}
                      {msg.done && msg.sources && msg.sources.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                          <span style={{ fontSize: 11, color: "var(--text-3)", alignSelf: "center" }}>Sources:</span>
                          {msg.sources.map(s => (
                            <button
                              key={s.page}
                              onClick={() => { setTargetPage(s.page); if (!showPreview) setShowPreview(true); }}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                padding: "3px 9px", borderRadius: 99, border: "1px solid rgba(99,102,241,0.4)",
                                background: "rgba(99,102,241,0.1)", color: "rgba(165,180,252,0.9)",
                                fontSize: 11, fontWeight: 600, cursor: "pointer",
                              }}
                              title={`Jump to page ${s.page}`}
                            >
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z"/>
                                <polyline points="15 3 15 9 21 9"/>
                              </svg>
                              p.{s.page}
                            </button>
                          ))}
                        </div>
                      )}
                      {msg.done && msg.multiSources && msg.multiSources.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                          <span style={{ fontSize: 11, color: "var(--text-3)", alignSelf: "center" }}>Sources:</span>
                          {msg.multiSources.map((s, i) => (
                            <span
                              key={i}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                padding: "3px 9px", borderRadius: 99, border: "1px solid rgba(99,102,241,0.35)",
                                background: "rgba(99,102,241,0.08)", color: "rgba(165,180,252,0.85)",
                                fontSize: 11, fontWeight: 600,
                              }}
                            >
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z"/>
                                <polyline points="15 3 15 9 21 9"/>
                              </svg>
                              {s.fileName}{s.page ? ` · p.${s.page}` : ""}
                            </span>
                          ))}
                        </div>
                      )}
                      {msg.done && body && (
                        <div className="ch-msg-actions">
                          <button
                            className={`ch-action-btn${copiedId === msg.id ? " ch-action-copied" : ""}`}
                            onClick={() => copyMessage(msg.id, body)}
                            title="Copy response"
                            aria-label="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            ) : (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                              </svg>
                            )}
                            <span>{copiedId === msg.id ? "Copied!" : "Copy"}</span>
                          </button>
                          <button
                            className={`ch-action-btn${playingId === msg.id ? " ch-action-playing" : ""}`}
                            onClick={() => playTTS(msg.id, body)}
                            title={playingId === msg.id ? "Stop playback" : "Play HD voice"}
                            aria-label={playingId === msg.id ? "Stop playback" : "Play HD voice"}
                          >
                            {playingId === msg.id ? (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="6" y="4" width="4" height="16" rx="1"/>
                                <rect x="14" y="4" width="4" height="16" rx="1"/>
                              </svg>
                            ) : (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                              </svg>
                            )}
                            <span>{playingId === msg.id ? "Stop" : "HD Voice"}</span>
                          </button>
                          <button
                            className={`ch-action-btn${sharedId === msg.id ? " ch-action-copied" : ""}`}
                            onClick={() => shareMessage(msg.id, body)}
                            title="Share response"
                            aria-label="Share response"
                          >
                            {sharedId === msg.id ? (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            ) : (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                              </svg>
                            )}
                            <span>{sharedId === msg.id ? "Shared!" : "Share"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {streaming && messages[messages.length - 1]?.role !== "ai" && (
                <div className="ch-typing">
                  <span className="ch-dot" /><span className="ch-dot" /><span className="ch-dot" />
                </div>
              )}

              {limitExceeded && (
                <div style={{ margin: "4px 0", padding: "16px", borderRadius: 14, background: "linear-gradient(135deg,#FFFBF0,#FFF3DC)", border: "1.5px solid rgba(245,158,11,0.35)", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 20 }}>🚀</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#92400E" }}>You&apos;ve used all your free questions</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#B45309", marginTop: 2 }}>Upgrade to Pro for unlimited AI questions, OCR &amp; more.</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <a href="/login?upgrade=1" style={{ flex: 1, padding: "9px 14px", borderRadius: 9, background: "linear-gradient(135deg,#F59E0B,#F97316)", color: "#0A0A0A", fontSize: 13, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>
                      Upgrade to Pro →
                    </a>
                    <button onClick={() => setLimitExceeded(false)} style={{ padding: "9px 12px", borderRadius: 9, background: "none", border: "1px solid rgba(245,158,11,0.30)", color: "#B45309", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {chatError && (
                <div className="ch-error-bubble">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {chatError}
                  <button className="ch-error-retry" onClick={() => setChatError(null)}>Dismiss</button>
                </div>
              )}

              <div ref={endRef} />
            </div>

            {messages.length === 0 && (
              <div className="ch-chips">
                {CHIPS.map(c => (
                  <button key={c} className="ch-chip" onClick={() => send(c)} disabled={streaming}>{c}</button>
                ))}
              </div>
            )}

            {/* ── Quick Actions: AI Summary ─────────────────────────────── */}
            <div style={{ padding: "6px 16px 0", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 500 }}>Quick:</span>
              {([
                { key: "executive", label: "Summary" },
                { key: "insights",  label: "Key Insights" },
                { key: "actions",   label: "Action Items" },
                { key: "simple",    label: "Explain Simply" },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  disabled={summaryLoading}
                  onClick={async () => {
                    setSummaryOpen(true);
                    setSummaryType(key);
                    setSummaryText("");
                    setSummaryError(null);
                    setSummaryLoading(true);
                    try {
                      const res = await fetch("/api/summarize", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ fileUrl: rawUrl, type: key }),
                        credentials: "include",
                      });
                      if (!res.ok) {
                        const d = await res.json().catch(() => ({})) as { error?: string };
                        throw new Error(d.error ?? "Failed");
                      }
                      const reader2 = res.body!.getReader();
                      const dec2 = new TextDecoder();
                      let txt = "";
                      while (true) {
                        const { done: d2, value: v2 } = await reader2.read();
                        if (d2) break;
                        const ch2 = dec2.decode(v2, { stream: true });
                        for (const ln of ch2.split("\n")) {
                          if (!ln.startsWith("data: ")) continue;
                          const p2 = ln.slice(6);
                          if (p2 === "[DONE]") break;
                          if (p2 === "[ERROR]") throw new Error("Summarization failed");
                          txt += p2.replace(/\\n/g, "\n");
                          setSummaryText(txt);
                        }
                      }
                    } catch (e: unknown) {
                      setSummaryError((e as Error).message ?? "Failed");
                    } finally {
                      setSummaryLoading(false);
                    }
                  }}
                  style={{
                    padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    border: "1px solid rgba(99,102,241,0.35)", background: "rgba(99,102,241,0.08)",
                    color: "rgba(165,180,252,0.85)", transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Summary panel */}
            {summaryOpen && (
              <div style={{
                margin: "8px 16px", borderRadius: 10, padding: "12px 14px",
                background: "var(--surface-2, rgba(255,255,255,0.04))",
                border: "1px solid rgba(99,102,241,0.2)", maxHeight: 320, overflowY: "auto",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(165,180,252,0.9)" }}>
                    {summaryType === "executive" ? "Executive Summary" : summaryType === "insights" ? "Key Insights" : summaryType === "actions" ? "Action Items" : "Simple Explanation"}
                  </span>
                  <button onClick={() => setSummaryOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 16, lineHeight: 1 }}>×</button>
                </div>
                {summaryLoading && !summaryText && (
                  <div style={{ color: "var(--text-3)", fontSize: 12, fontStyle: "italic" }}>Generating…</div>
                )}
                {summaryError && (
                  <div style={{ color: "#f87171", fontSize: 12 }}>{summaryError}</div>
                )}
                {summaryText && (
                  <div style={{ fontSize: 13, color: "var(--text-1)", lineHeight: 1.65 }}>
                    {renderMarkdown(summaryText)}
                    {summaryLoading && <span className="ch-cursor" />}
                  </div>
                )}
              </div>
            )}

            {/* ── Multi-PDF selector ───────────────────────────────────── */}
            {multiMode && (
              <div style={{
                margin: "6px 16px 2px", padding: "10px 12px", borderRadius: 10,
                border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.06)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(165,180,252,0.9)", marginBottom: 8 }}>
                  Select documents to query ({selectedDocIds.length} selected)
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {allDocs.map(doc => {
                    const selected = selectedDocIds.includes(doc.id);
                    return (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDocIds(prev =>
                          selected ? prev.filter(id => id !== doc.id) : [...prev, doc.id]
                        )}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 500, cursor: "pointer",
                          border: selected ? "1px solid rgba(99,102,241,0.7)" : "1px solid rgba(255,255,255,0.1)",
                          background: selected ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                          color: selected ? "rgba(165,180,252,1)" : "var(--text-2)",
                          transition: "all 0.15s",
                        }}
                      >
                        {selected && (
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                        {doc.file_name?.replace(/\.pdf$/i, "").slice(0, 28) ?? "Untitled"}
                      </button>
                    );
                  })}
                </div>
                {allDocs.length === 0 && (
                  <div style={{ fontSize: 11, color: "var(--text-3)" }}>No other documents found. Upload more PDFs from the dashboard.</div>
                )}
              </div>
            )}

            {/* Explain Like preset buttons */}
            <div className="ch-explain-row">
              <span className="ch-explain-label">Explain as:</span>
              {EXPLAIN_PRESETS.map(p => (
                <button
                  key={p.label}
                  className="ch-explain-btn"
                  onClick={() => send(p.prompt)}
                  disabled={streaming}
                  title={p.prompt}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="ch-input-area">
              <div className="ch-input-row">
                <textarea
                  ref={textareaRef}
                  className="ch-textarea"
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={listening ? "Listening…" : multiMode ? `Ask across ${selectedDocIds.length || "selected"} documents…` : "Ask about this document…"}
                  disabled={streaming}
                  autoComplete="off"
                />
                {/* Mic button */}
                <button
                  className={`ch-mic-btn${listening ? " ch-mic-active" : ""}`}
                  onClick={toggleMic}
                  disabled={streaming}
                  aria-label={listening ? "Stop recording" : "Voice input"}
                  title={listening ? "Stop recording" : "Voice input"}
                >
                  {listening ? (
                    /* Stop / wave animation */
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="6" width="12" height="12" rx="2"/>
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="2" width="6" height="12" rx="3"/>
                      <path d="M5 10a7 7 0 0 0 14 0"/>
                      <line x1="12" y1="19" x2="12" y2="22"/>
                      <line x1="9" y1="22" x2="15" y2="22"/>
                    </svg>
                  )}
                </button>
                {/* Send button */}
                <button className="ch-send-btn" onClick={() => send()} disabled={streaming || !input.trim()} aria-label="Send">
                  {streaming ? (
                    <div style={{ width: 14, height: 14, border: "2.5px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "pvw-spin .7s linear infinite" }} />
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>{/* end vw-center */}

        {/* ── RIGHT: INSIGHTS / COMPARE / QUIZ ─────────────────────────────── */}
        {rightTab && (
          <div className="vw-right-panel">
            {/* Tabs */}
            <div className="vw-right-tabs">
              <button
                className={`vw-right-tab${rightTab === "insights" ? " active" : ""}`}
                onClick={() => { setRightTab("insights"); if (!insights && !insightsLoad) loadInsights(); }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Insights
              </button>
              <button
                className={`vw-right-tab${rightTab === "compare" ? " active" : ""}`}
                onClick={() => setRightTab("compare")}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/>
                </svg>
                Compare
              </button>
              <button
                className={`vw-right-tab${rightTab === "redline" ? " active" : ""}`}
                onClick={() => setRightTab("redline")}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                Redline
              </button>
              <button
                className={`vw-right-tab${rightTab === "quiz" ? " active" : ""}`}
                onClick={() => setRightTab("quiz")}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Quiz
              </button>
              <button
                className={`vw-right-tab${rightTab === "cards" ? " active" : ""}`}
                onClick={() => setRightTab("cards")}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                </svg>
                Cards
              </button>
              <button
                className={`vw-right-tab${rightTab === "tutor" ? " active" : ""}`}
                onClick={() => setRightTab("tutor")}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                </svg>
                Tutor
              </button>
              <button
                className={`vw-right-tab${rightTab === "risks" ? " active" : ""}`}
                onClick={() => { setRightTab("risks"); if (!risks && !risksLoad) loadRisks(); }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                </svg>
                Risks
              </button>
              <button
                className={`vw-right-tab${rightTab === "financials" ? " active" : ""}`}
                onClick={() => { setRightTab("financials"); if (!financials && !financialsLoad) loadFinancials(); }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                Financials
              </button>
              <button className="vw-right-close" onClick={() => setRightTab(null)} title="Close">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* ── Insights tab ─────────────────────────────────── */}
            {rightTab === "insights" && (
              <div className="vw-right-body">
                {insightsLoad && (
                  <div className="vw-right-loading">
                    <div className="vw-url-spinner" />
                    <span>Analysing document…</span>
                  </div>
                )}
                {insightsErr && !insightsLoad && (
                  <div className="vw-right-err">
                    {insightsErr}
                    <button className="vw-right-retry" onClick={loadInsights}>Retry</button>
                  </div>
                )}
                {!insights && !insightsLoad && !insightsErr && (
                  <div className="vw-right-loading">
                    <div className="vw-url-spinner" />
                    <span>Generating insights…</span>
                  </div>
                )}
                {insights && (
                  <>
                    <div className="vw-right-section">
                      <div className="vw-right-section-label">Summary</div>
                      <p className="vw-right-summary">{insights.summary}</p>
                    </div>
                    {insights.key_points?.length > 0 && (
                      <div className="vw-right-section">
                        <div className="vw-right-section-label">Key Points</div>
                        <ul className="vw-right-list">
                          {insights.key_points.map((pt, i) => (
                            <li key={i} className="vw-right-list-item">{pt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {insights.suggested_questions?.length > 0 && (
                      <div className="vw-right-section">
                        <div className="vw-right-section-label">Ask the AI</div>
                        <div className="vw-right-chips">
                          {insights.suggested_questions.map((q, i) => (
                            <button
                              key={i}
                              className="vw-right-chip"
                              onClick={() => { send(q); }}
                              disabled={streaming}
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Compare tab ──────────────────────────────────── */}
            {rightTab === "compare" && (
              <div className="vw-right-body">
                <div className="vw-right-section">
                  <div className="vw-right-section-label">Current document</div>
                  <div className="vw-compare-current">
                    <FileIcon size={12} />
                    <span>{fileName.replace(/\.pdf$/i, "")}</span>
                  </div>
                </div>

                <div className="vw-right-section">
                  <div className="vw-right-section-label">Compare with</div>
                  {otherDocs.length === 0 ? (
                    <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5 }}>
                      Upload another document to enable comparison.
                    </p>
                  ) : (
                    <div className="vw-compare-list">
                      {otherDocs.map(doc => (
                        <button
                          key={doc.id}
                          className={`vw-compare-doc${compareDocId === doc.id ? " selected" : ""}`}
                          onClick={() => setCompareDocId(doc.id)}
                        >
                          <FileIcon size={12} />
                          <span>{doc.file_name.replace(/\.pdf$/i, "")}</span>
                          {compareDocId === doc.id && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: "auto", flexShrink: 0 }}>
                              <path d="M2 6l3 3 5-5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {compareDocId && (
                  <div className="vw-right-section">
                    <div className="vw-right-section-label">Question (optional)</div>
                    <input
                      className="vw-compare-input"
                      value={compareQ}
                      onChange={e => setCompareQ(e.target.value)}
                      placeholder="e.g. Compare the financial figures"
                    />
                    <button
                      className="vw-compare-btn"
                      onClick={runCompare}
                      disabled={compareLoad}
                    >
                      {compareLoad ? "Comparing…" : "Compare documents"}
                    </button>
                  </div>
                )}

                {compareErr && (
                  <div className="vw-right-err">{compareErr}</div>
                )}

                {compareResult && (
                  <div className="vw-right-section">
                    <div className="vw-right-section-label">
                      {compareResult.doc1.name} vs {compareResult.doc2.name}
                    </div>
                    <div className="vw-compare-result">
                      {renderMarkdown(compareResult.result)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Tutor tab ────────────────────────────────────── */}
            {rightTab === "tutor" && (
              <div className="vw-right-body tutor-panel">
                {/* Mode selector */}
                <div className="tutor-modes">
                  {([
                    { key: "normal",   label: "Lexi",     emoji: "🎓" },
                    { key: "simple",   label: "Simple",   emoji: "💡" },
                    { key: "eli5",     label: "ELI-5",    emoji: "🎈" },
                    { key: "exam",     label: "Exam",     emoji: "📝" },
                    { key: "hinglish", label: "Hinglish", emoji: "🇮🇳" },
                  ] as { key: TutorMode; label: string; emoji: string }[]).map(m => (
                    <button
                      key={m.key}
                      className={`tutor-mode-pill${tutorMode === m.key ? " active" : ""}`}
                      onClick={() => setTutorMode(m.key)}
                    >{m.emoji} {m.label}</button>
                  ))}
                </div>

                {/* Auto-TTS toggle */}
                <div className="tutor-tts-row">
                  <span className="tutor-tts-label">🔊 Auto-speak</span>
                  <button
                    className={`tutor-tts-toggle${tutorAutoTTS ? " on" : ""}`}
                    onClick={() => setTutorAutoTTS(v => !v)}
                  >{tutorAutoTTS ? "On" : "Off"}</button>
                </div>

                {/* Chat messages */}
                <div className="tutor-messages">
                  {tutorMsgs.length === 0 && (
                    <div className="tutor-empty">
                      <div className="tutor-avatar">🎓</div>
                      <div className="tutor-empty-title">Hi, I&apos;m Lexi!</div>
                      <div className="tutor-empty-sub">Your AI study tutor. Ask me anything about this document and I&apos;ll explain it clearly.</div>
                      <div className="tutor-starters">
                        {["Explain the main concept", "What are the key points?", "Give me an example", "What might be asked in exams?"].map(s => (
                          <button key={s} className="tutor-starter" onClick={() => sendToTutor(s)}>{s}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {tutorMsgs.map((m, i) => (
                    <div key={i} className={`tutor-msg tutor-msg-${m.role}`}>
                      {m.role === "lexi" && <div className="tutor-msg-avatar">🎓</div>}
                      <div className="tutor-msg-bubble">{m.text}</div>
                    </div>
                  ))}
                  {tutorLoading && (
                    <div className="tutor-msg tutor-msg-lexi">
                      <div className="tutor-msg-avatar">🎓</div>
                      <div className="tutor-msg-bubble tutor-typing">
                        <span className="ch-dot"/><span className="ch-dot"/><span className="ch-dot"/>
                      </div>
                    </div>
                  )}
                  <div ref={tutorEndRef} />
                </div>

                {/* Input */}
                <div className="tutor-input-area">
                  <input
                    className="tutor-input"
                    value={tutorInput}
                    onChange={e => setTutorInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendToTutor(); }}}
                    placeholder="Ask Lexi anything…"
                    disabled={tutorLoading}
                  />
                  <button
                    className="tutor-send-btn"
                    onClick={() => sendToTutor()}
                    disabled={tutorLoading || !tutorInput.trim()}
                  >
                    {tutorLoading
                      ? <div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "pvw-spin .7s linear infinite" }}/>
                      : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    }
                  </button>
                </div>
              </div>
            )}

            {/* ── Cards tab ────────────────────────────────────── */}
            {rightTab === "cards" && (
              <div className="vw-right-body">
                {/* Sub-mode toggle */}
                <div className="fc-mode-toggle">
                  <button
                    className={`fc-mode-btn${fcMode === "generate" ? " active" : ""}`}
                    onClick={() => { setFcMode("generate"); setFcErr(null); }}
                  >Generate</button>
                  <button
                    className={`fc-mode-btn${fcMode === "review" ? " active" : ""}`}
                    onClick={() => { setFcMode("review"); setFcErr(null); if (!fcLoading) loadDueCards(); }}
                  >Review</button>
                </div>

                {/* ── GENERATE MODE ── */}
                {fcMode === "generate" && (
                  <>
                    {fcCards.length === 0 && !fcLoading && (
                      <div className="vw-quiz-config">
                        <div className="vw-quiz-config-title">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                          </svg>
                          AI Flashcards
                        </div>
                        <p className="vw-quiz-config-sub">Generate memorisation cards from this document</p>

                        <div className="vw-quiz-field">
                          <div className="vw-quiz-field-label">Number of cards</div>
                          <div className="vw-quiz-count-row">
                            {[10, 15, 20].map(n => (
                              <button
                                key={n}
                                className={`vw-quiz-count-btn${fcCount === n ? " active" : ""}`}
                                onClick={() => setFcCount(n)}
                              >{n}</button>
                            ))}
                          </div>
                        </div>

                        {fcErr && <div className="vw-right-err" style={{ marginBottom: 12 }}>{fcErr}</div>}

                        <button className="vw-quiz-generate-btn" onClick={generateCards}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                          </svg>
                          Generate Flashcards
                        </button>
                      </div>
                    )}

                    {fcLoading && (
                      <div className="vw-right-loading">
                        <div className="vw-url-spinner" />
                        <span>Creating {fcCount} flashcards…</span>
                      </div>
                    )}

                    {fcCards.length > 0 && !fcLoading && (
                      <div className="fc-browse">
                        <div className="fc-browse-header">
                          <span className="fc-browse-count">{fcCards.length} cards generated</span>
                          <button className="fc-regen-btn" onClick={() => setFcCards([])}>New set</button>
                        </div>
                        {fcCards.map((card, i) => (
                          <div key={card.id} className="fc-browse-card">
                            <div className="fc-browse-num">#{i + 1}</div>
                            <div className="fc-browse-front">{card.front}</div>
                            <div className="fc-browse-sep" />
                            <div className="fc-browse-back">{card.back}</div>
                          </div>
                        ))}
                        <button
                          className="vw-quiz-generate-btn"
                          style={{ marginTop: 8 }}
                          onClick={() => { setFcMode("review"); loadDueCards(); }}
                        >
                          Start Review Session →
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* ── REVIEW MODE ── */}
                {fcMode === "review" && (
                  <>
                    {fcLoading && (
                      <div className="vw-right-loading">
                        <div className="vw-url-spinner" />
                        <span>Loading due cards…</span>
                      </div>
                    )}

                    {fcErr && !fcLoading && (
                      <div className="vw-right-err">{fcErr}<button className="vw-right-retry" onClick={loadDueCards}>Retry</button></div>
                    )}

                    {/* No cards due */}
                    {!fcLoading && !fcErr && fcDone && fcSession.length === 0 && (
                      <div className="fc-done-state">
                        <div className="fc-done-icon">🎉</div>
                        <div className="fc-done-title">All caught up!</div>
                        <div className="fc-done-sub">No cards due right now. Come back tomorrow to keep your streak.</div>
                        <button className="fc-mode-btn active" style={{ marginTop: 16 }} onClick={() => setFcMode("generate")}>
                          Generate more cards
                        </button>
                      </div>
                    )}

                    {/* Session complete */}
                    {!fcLoading && !fcErr && fcDone && fcSession.length > 0 && (
                      <div className="fc-done-state">
                        <div className="fc-done-icon">✅</div>
                        <div className="fc-done-title">Session complete!</div>
                        <div className="fc-done-sub">You reviewed {fcSession.length} card{fcSession.length !== 1 ? "s" : ""}. Cards will reappear based on how well you knew them.</div>
                        <button className="vw-quiz-generate-btn" style={{ marginTop: 16 }} onClick={loadDueCards}>
                          Review again
                        </button>
                      </div>
                    )}

                    {/* Active review card */}
                    {!fcLoading && !fcErr && !fcDone && fcSession.length > 0 && (
                      <div className="fc-session">
                        {/* Progress bar */}
                        <div className="fc-progress-bar">
                          <div className="fc-progress-fill" style={{ width: `${(fcIdx / fcSession.length) * 100}%` }} />
                        </div>
                        <div className="fc-progress-label">{fcIdx + 1} / {fcSession.length}</div>

                        {/* Flip card */}
                        <div
                          className={`fc-card${fcFlipped ? " flipped" : ""}`}
                          onClick={() => !fcFlipped && setFcFlipped(true)}
                        >
                          <div className="fc-card-inner">
                            <div className="fc-card-front">
                              <div className="fc-card-label">Question</div>
                              <div className="fc-card-text">{fcSession[fcIdx].front}</div>
                              <div className="fc-card-hint">Tap to reveal answer</div>
                            </div>
                            <div className="fc-card-back">
                              <div className="fc-card-label">Answer</div>
                              <div className="fc-card-text">{fcSession[fcIdx].back}</div>
                            </div>
                          </div>
                        </div>

                        {/* Rating buttons — only after flip */}
                        {fcFlipped && (
                          <div className="fc-ratings">
                            <div className="fc-ratings-label">How well did you know this?</div>
                            <div className="fc-ratings-row">
                              <button className="fc-rate-btn fc-rate-again" onClick={() => reviewCard(0)}>
                                <span>Again</span><span className="fc-rate-sub">≤1d</span>
                              </button>
                              <button className="fc-rate-btn fc-rate-hard" onClick={() => reviewCard(2)}>
                                <span>Hard</span><span className="fc-rate-sub">~1d</span>
                              </button>
                              <button className="fc-rate-btn fc-rate-good" onClick={() => reviewCard(4)}>
                                <span>Good</span><span className="fc-rate-sub">~{Math.round((fcSession[fcIdx].interval_days || 1) * 2.5)}d</span>
                              </button>
                              <button className="fc-rate-btn fc-rate-easy" onClick={() => reviewCard(5)}>
                                <span>Easy</span><span className="fc-rate-sub">~{Math.round((fcSession[fcIdx].interval_days || 1) * 3.5)}d</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Quiz tab ─────────────────────────────────────── */}
            {rightTab === "quiz" && (
              <div className="vw-right-body">
                {/* Config panel — shown when no questions yet */}
                {quizQuestions.length === 0 && !quizLoading && (
                  <div className="vw-quiz-config">
                    <div className="vw-quiz-config-title">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                      AI Quiz Generator
                    </div>
                    <p className="vw-quiz-config-sub">Generate exam-ready questions from this document</p>

                    <div className="vw-quiz-field">
                      <div className="vw-quiz-field-label">Difficulty</div>
                      <div className="vw-quiz-diff-row">
                        {(["easy", "medium", "hard"] as const).map(d => (
                          <button
                            key={d}
                            className={`vw-quiz-diff-btn${quizDifficulty === d ? " active" : ""} vw-quiz-diff-${d}`}
                            onClick={() => setQuizDifficulty(d)}
                          >
                            {d.charAt(0).toUpperCase() + d.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="vw-quiz-field">
                      <div className="vw-quiz-field-label">Number of questions</div>
                      <div className="vw-quiz-count-row">
                        {[5, 10, 15].map(n => (
                          <button
                            key={n}
                            className={`vw-quiz-count-btn${quizCount === n ? " active" : ""}`}
                            onClick={() => setQuizCount(n)}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    {quizErr && <div className="vw-right-err" style={{ marginBottom: 12 }}>{quizErr}</div>}

                    <button className="vw-quiz-generate-btn" onClick={loadQuiz}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                      </svg>
                      Generate Quiz
                    </button>
                  </div>
                )}

                {/* Loading */}
                {quizLoading && (
                  <div className="vw-right-loading">
                    <div className="vw-url-spinner" />
                    <span>Generating {quizCount} questions…</span>
                  </div>
                )}

                {/* Quiz questions */}
                {quizQuestions.length > 0 && (
                  <div className="vw-quiz-questions">
                    {/* Header */}
                    <div className="vw-quiz-header">
                      <div className="vw-quiz-header-info">
                        <span className={`vw-quiz-badge vw-quiz-badge-${quizDifficulty}`}>
                          {quizDifficulty.charAt(0).toUpperCase() + quizDifficulty.slice(1)}
                        </span>
                        <span className="vw-quiz-header-count">{quizQuestions.length} questions</span>
                      </div>
                      {quizSubmitted && (
                        <div className="vw-quiz-score">
                          {quizQuestions.filter((q, i) => quizAnswers[i] === q.answer).length}
                          <span>/{quizQuestions.length}</span>
                        </div>
                      )}
                    </div>

                    {quizQuestions.map((q, qi) => {
                      const selected = quizAnswers[qi];
                      const isCorrect = selected === q.answer;
                      return (
                        <div key={qi} className={`vw-quiz-card${quizSubmitted ? (isCorrect ? " correct" : " wrong") : ""}`}>
                          <div className="vw-quiz-q-num">Q{qi + 1} · <span className="vw-quiz-topic">{q.topic}</span></div>
                          <div className="vw-quiz-q-text">{q.question}</div>
                          <div className="vw-quiz-options">
                            {q.options.map((opt, oi) => {
                              const isSelected = selected === opt;
                              const isAnswer = opt === q.answer;
                              let cls = "vw-quiz-option";
                              if (quizSubmitted) {
                                if (isAnswer) cls += " vw-quiz-option-correct";
                                else if (isSelected) cls += " vw-quiz-option-wrong";
                              } else if (isSelected) {
                                cls += " vw-quiz-option-selected";
                              }
                              return (
                                <button
                                  key={oi}
                                  className={cls}
                                  onClick={() => !quizSubmitted && setQuizAnswers(prev => ({ ...prev, [qi]: opt }))}
                                  disabled={quizSubmitted}
                                >
                                  <span className="vw-quiz-option-letter">{String.fromCharCode(65 + oi)}</span>
                                  <span>{opt.replace(/^[A-D]\)\s*/, "")}</span>
                                  {quizSubmitted && isAnswer && (
                                    <svg className="vw-quiz-option-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                  )}
                                  {quizSubmitted && isSelected && !isAnswer && (
                                    <svg className="vw-quiz-option-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          {quizSubmitted && (
                            <div className="vw-quiz-explanation">
                              <span className="vw-quiz-explanation-label">Explanation:</span> {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Actions */}
                    <div className="vw-quiz-actions">
                      {!quizSubmitted ? (
                        <button
                          className="vw-quiz-submit-btn"
                          onClick={() => setQuizSubmitted(true)}
                          disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                        >
                          Submit Quiz ({Object.keys(quizAnswers).length}/{quizQuestions.length} answered)
                        </button>
                      ) : (
                        <button
                          className="vw-quiz-retry-btn"
                          onClick={() => { setQuizQuestions([]); setQuizAnswers({}); setQuizSubmitted(false); setQuizErr(null); }}
                        >
                          Generate New Quiz
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Redline tab ────────────────────────────────── */}
            {rightTab === "redline" && (
              <div className="vw-right-body">
                <div className="vw-right-section">
                  <div className="vw-right-section-label">Base document (v1)</div>
                  <div className="vw-compare-current">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span>{fileName.replace(/\.pdf$/i, "")}</span>
                  </div>
                </div>
                <div className="vw-right-section">
                  <div className="vw-right-section-label">Compare against (v2)</div>
                  {otherDocs.length === 0 ? (
                    <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5 }}>Upload another document version to redline.</p>
                  ) : (
                    <div className="vw-compare-list">
                      {otherDocs.map(doc => (
                        <button
                          key={doc.id}
                          className={`vw-compare-doc${redlineDocId === doc.id ? " selected" : ""}`}
                          onClick={() => setRedlineDocId(doc.id)}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          <span>{doc.file_name.replace(/\.pdf$/i, "")}</span>
                          {redlineDocId === doc.id && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: "auto", flexShrink: 0 }}>
                              <path d="M2 6l3 3 5-5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {redlineDocId && (
                  <div className="vw-right-section">
                    <button className="vw-compare-btn" onClick={runRedline} disabled={redlineLoad}>
                      {redlineLoad ? "Analysing…" : "Run redline"}
                    </button>
                  </div>
                )}
                {redlineErr && <div className="vw-right-err">{redlineErr}</div>}
                {redlineResult && (
                  <div className="vw-right-section">
                    <div className="vw-right-section-label" style={{ marginBottom: 6 }}>
                      {redlineResult.doc1.replace(/\.pdf$/i, "")} → {redlineResult.doc2.replace(/\.pdf$/i, "")}
                    </div>
                    {redlineResult.summary && (
                      <p style={{ fontSize: 12, color: "var(--text-2)", margin: "0 0 12px", lineHeight: 1.5 }}>{redlineResult.summary}</p>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {redlineResult.changes.map((c, i) => (
                        <div key={i} style={{
                          borderRadius: 7,
                          border: `1px solid ${c.type === "added" ? "rgba(34,197,94,0.3)" : c.type === "removed" ? "rgba(239,68,68,0.3)" : "rgba(234,179,8,0.3)"}`,
                          background: c.type === "added" ? "rgba(34,197,94,0.06)" : c.type === "removed" ? "rgba(239,68,68,0.06)" : "rgba(234,179,8,0.06)",
                          padding: "9px 11px",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, textTransform: "uppercase",
                              background: c.type === "added" ? "rgba(34,197,94,0.15)" : c.type === "removed" ? "rgba(239,68,68,0.15)" : "rgba(234,179,8,0.15)",
                              color: c.type === "added" ? "#22c55e" : c.type === "removed" ? "#ef4444" : "#eab308",
                            }}>{c.type}</span>
                            {c.significance === "high" && (
                              <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 600 }}>● HIGH</span>
                            )}
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)", flex: 1 }}>{c.section}</span>
                          </div>
                          {c.notes && <p style={{ fontSize: 11.5, color: "var(--text-2)", margin: 0, lineHeight: 1.5 }}>{c.notes}</p>}
                          {c.doc1_text && c.type === "modified" && (
                            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 5, padding: "4px 6px", background: "rgba(239,68,68,0.06)", borderRadius: 4, textDecoration: "line-through" }}>
                              {c.doc1_text.slice(0, 120)}{c.doc1_text.length > 120 ? "…" : ""}
                            </div>
                          )}
                          {c.doc2_text && c.type === "modified" && (
                            <div style={{ fontSize: 11, color: "var(--text-2)", marginTop: 4, padding: "4px 6px", background: "rgba(34,197,94,0.06)", borderRadius: 4 }}>
                              {c.doc2_text.slice(0, 120)}{c.doc2_text.length > 120 ? "…" : ""}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Risks tab ──────────────────────────────────── */}
            {rightTab === "risks" && (
              <div className="vw-right-body">
                {risksLoad && (
                  <div className="vw-right-loading">
                    <div className="vw-url-spinner" />
                    <span>Analysing clauses &amp; risks…</span>
                  </div>
                )}
                {risksErr && !risksLoad && (
                  <div className="vw-right-err">
                    {risksErr}
                    <button className="vw-right-retry" onClick={loadRisks}>Retry</button>
                  </div>
                )}
                {!risks && !risksLoad && !risksErr && (
                  <div className="vw-right-loading">
                    <div className="vw-url-spinner" />
                    <span>Analysing clauses &amp; risks…</span>
                  </div>
                )}
                {risks && risks.length === 0 && (
                  <div className="vw-right-loading" style={{ flexDirection: "column", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--text-2)" }}>No significant risks found.</span>
                    <span style={{ fontSize: 11, color: "var(--text-3)" }}>This may not be a legal or contractual document.</span>
                  </div>
                )}
                {risks && risks.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 14px" }}>
                    {(risks as Array<{ title: string; severity: string; type: string; description: string; suggestion: string }>).map((flag, i) => (
                      <div
                        key={i}
                        style={{
                          borderRadius: 8,
                          border: `1px solid ${flag.severity === "high" ? "rgba(239,68,68,0.3)" : flag.severity === "medium" ? "rgba(245,158,11,0.3)" : "rgba(107,114,128,0.25)"}`,
                          background: flag.severity === "high" ? "rgba(239,68,68,0.06)" : flag.severity === "medium" ? "rgba(245,158,11,0.06)" : "rgba(107,114,128,0.04)",
                          padding: "10px 12px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4,
                            textTransform: "uppercase", letterSpacing: "0.5px",
                            background: flag.severity === "high" ? "rgba(239,68,68,0.15)" : flag.severity === "medium" ? "rgba(245,158,11,0.15)" : "rgba(107,114,128,0.12)",
                            color: flag.severity === "high" ? "#ef4444" : flag.severity === "medium" ? "#f59e0b" : "var(--text-3)",
                          }}>
                            {flag.severity}
                          </span>
                          <span style={{ fontSize: 10, color: "var(--text-3)", textTransform: "capitalize" }}>{flag.type}</span>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 12, color: "var(--text-1)", marginBottom: 4 }}>{flag.title}</div>
                        <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 6 }}>{flag.description}</div>
                        <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.4 }}>
                          <span style={{ fontWeight: 600, color: "var(--accent)" }}>Suggestion: </span>{flag.suggestion}
                        </div>
                      </div>
                    ))}
                    <p style={{ fontSize: 10, color: "var(--text-3)", textAlign: "center", margin: "4px 0 8px" }}>
                      ⚠️ Not legal advice. Consult a qualified lawyer.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Financials tab ─────────────────────────────── */}
            {rightTab === "financials" && (
              <div className="vw-right-body">
                {financialsLoad && (
                  <div className="vw-right-loading">
                    <div className="vw-url-spinner" />
                    <span>Extracting financial data…</span>
                  </div>
                )}
                {financialsErr && !financialsLoad && (
                  <div className="vw-right-err">
                    {financialsErr}
                    <button className="vw-right-retry" onClick={loadFinancials}>Retry</button>
                  </div>
                )}
                {!financials && !financialsLoad && !financialsErr && (
                  <div className="vw-right-loading">
                    <div className="vw-url-spinner" />
                    <span>Extracting financial data…</span>
                  </div>
                )}
                {financials && (
                  <div style={{ padding: "12px 14px" }}>
                    {Object.entries(financials).map(([key, val]) => {
                      if (key === "document_type" || val === null || val === undefined) return null;
                      const label = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                      if (Array.isArray(val)) {
                        if (val.length === 0) return null;
                        return (
                          <div key={key} className="vw-right-section">
                            <div className="vw-right-section-label">{label}</div>
                            {(val as Array<Record<string, unknown>>).map((item, i) => (
                              <div key={i} style={{ fontSize: 12, color: "var(--text-2)", padding: "4px 0", borderBottom: "1px solid var(--border)", lineHeight: 1.5 }}>
                                {typeof item === "object" && item !== null
                                  ? Object.entries(item).filter(([, v]) => v !== null).map(([k, v]) => (
                                      <span key={k} style={{ marginRight: 10 }}>
                                        <span style={{ color: "var(--text-3)" }}>{k.replace(/_/g, " ")}: </span>
                                        <strong>{String(v)}</strong>
                                      </span>
                                    ))
                                  : String(item)
                                }
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return (
                        <div key={key} className="vw-right-section" style={{ paddingBottom: 8 }}>
                          <div className="vw-right-section-label">{label}</div>
                          <p style={{ fontSize: 12, color: "var(--text-2)", margin: 0, lineHeight: 1.5 }}>{String(val)}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>{/* end vw-panels */}
    </div>
  );
}

export default function ViewerPage() {
  return (
    <ErrorBoundary route="viewer">
      <Suspense
        fallback={
          <div className="vw-root" style={{ alignItems: "center", justifyContent: "center" }}>
            <div className="vw-url-loading">
              <div className="vw-url-spinner" />
              <span>Opening document…</span>
            </div>
          </div>
        }
      >
        <ViewerContent />
      </Suspense>
    </ErrorBoundary>
  );
}
