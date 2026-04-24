"use client";

import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

// ── Components ────────────────────────────────────────────────────────────────
import Sidebar from "@/components/dashboard/Sidebar";
import BillingView from "@/components/dashboard/BillingView";
import SettingsView from "@/components/dashboard/SettingsView";
import DashboardHomeView, { WelcomeScreen, EmptyChatState } from "@/components/dashboard/DashboardHomeView";
import MyPDFsView from "@/components/dashboard/MyPDFsView";
import InsightsPanel from "@/components/dashboard/InsightsPanel";
import ComparePanel from "@/components/dashboard/ComparePanel";
import ChatMessage from "@/components/dashboard/ChatMessage";
import VoiceConvBar from "@/components/dashboard/VoiceConvBar";
import VoiceWaveform from "@/components/dashboard/VoiceWaveform";
import SmartSuggestions from "@/components/dashboard/SmartSuggestions";
import { useVoiceConversation } from "@/hooks/useVoiceConversation";
import { useMic } from "@/hooks/useMic";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { Events, trackFirstVisit } from "@/lib/analytics";
import { UpgradePopup, UpgradeBanner } from "@/components/dashboard/UpgradePopup";
import { MessageSkeleton } from "@/components/dashboard/Shimmer";
import { C, SMART_ACTIONS } from "@/components/dashboard/tokens";
import { MenuIcon, ShareIcon, InsightIcon, CompareIcon, TrashIcon, SendIcon, MicIcon, ShieldIcon, CloseIcon, CheckIcon } from "@/components/dashboard/icons";
import OnboardingOverlay from "@/components/dashboard/OnboardingOverlay";
import ToastContainer from "@/components/ui/Toast";
import ShareModal from "@/components/dashboard/ShareModal";
import TeamView from "@/components/dashboard/TeamView";

/* ─── STREAMING STATUS BAR ───────────────────────────────────────────────── */
const STATUS_STEPS = [
  "Reading document…",
  "Analyzing context…",
  "Extracting insights…",
  "Composing answer…",
];

function StreamingStatusBar() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % STATUS_STEPS.length), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ padding: "7px 20px", background: "rgba(124,58,237,0.06)", borderTop: "1px solid rgba(124,58,237,0.12)", display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accentLight, animation: "pulse-dot 1.2s ease-in-out infinite", flexShrink: 0 }} />
      <motion.span
        key={idx}
        initial={{ opacity: 0, x: 6 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        style={{ fontSize: 11.5, color: C.accentLight, fontWeight: 600 }}
      >
        {STATUS_STEPS[idx]}
      </motion.span>
    </div>
  );
}

/* ─── QUESTION PROGRESS BAR ─────────────────────────────────────────────── */
function QuestionProgressBar({ usage, onUpgrade }) {
  const used = usage?.questions ?? 0;
  const max  = usage?.maxQuestions ?? 10;
  const pct  = Math.min(100, Math.round((used / max) * 100));
  const left = Math.max(0, max - used);
  const urgent = left <= 2;
  const warn   = left <= 4;
  const barColor = urgent ? "#ef4444" : warn ? "#f59e0b" : "#7c3aed";

  if (used === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: 740, margin: "0 auto 6px", padding: "7px 12px", background: urgent ? "rgba(239,68,68,0.06)" : "rgba(124,58,237,0.05)", border: `1px solid ${urgent ? "rgba(239,68,68,0.18)" : "rgba(124,58,237,0.12)"}`, borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}
    >
      {/* Bar */}
      <div style={{ flex: 1, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)` }}
        />
      </div>

      {/* Label */}
      <span style={{ fontSize: 11, fontWeight: 700, color: urgent ? "#f87171" : warn ? "#f59e0b" : C.textMuted, whiteSpace: "nowrap" }}>
        {urgent ? `⚠️ ${left} question${left !== 1 ? "s" : ""} left` : `${used}/${max} questions used`}
      </span>

      {/* Upgrade nudge */}
      {(urgent || warn) && (
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={onUpgrade}
          style={{ padding: "3px 10px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none", borderRadius: 6, fontSize: 10.5, fontWeight: 700, color: "white", cursor: "pointer", whiteSpace: "nowrap" }}
        >
          Upgrade →
        </motion.button>
      )}
    </motion.div>
  );
}

/* ─── HEADER BUTTON ──────────────────────────────────────────────────────── */
function HeaderBtn({ onClick, disabled, active, color = "default", children }) {
  const s = {
    default: { bg: "rgba(255,255,255,0.04)", bd: "rgba(255,255,255,0.08)", cl: "rgba(240,240,248,0.55)", aBg: "rgba(124,58,237,0.16)", aBd: "rgba(124,58,237,0.35)", aCl: "#c4b5fd" },
    purple:  { bg: "rgba(255,255,255,0.04)", bd: "rgba(255,255,255,0.08)", cl: "rgba(240,240,248,0.55)", aBg: "rgba(124,58,237,0.16)", aBd: "rgba(124,58,237,0.35)", aCl: "#c4b5fd" },
    red:     { bg: "rgba(239,68,68,0.06)",   bd: "rgba(239,68,68,0.16)",   cl: "rgba(248,113,113,0.7)",  aBg: "rgba(239,68,68,0.15)",  aBd: "rgba(239,68,68,0.35)",  aCl: "#f87171" },
    green:   { bg: "rgba(34,197,94,0.06)",   bd: "rgba(34,197,94,0.16)",   cl: "rgba(74,222,128,0.7)",   aBg: "rgba(34,197,94,0.14)",  aBd: "rgba(34,197,94,0.32)",  aCl: "#4ade80" },
  }[color] || {};
  return (
    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }} onClick={onClick} disabled={disabled}
      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 11px", background: active ? s.aBg : s.bg, border: `1px solid ${active ? s.aBd : s.bd}`, borderRadius: 9, fontSize: 12, fontWeight: 600, color: active ? s.aCl : s.cl, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, backdropFilter: "blur(8px)", transition: "all 0.15s" }}>
      {children}
    </motion.button>
  );
}

/* ─── MAIN DASHBOARD ─────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");

  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [aiStreaming, setAiStreaming] = useState(false);

  const [historyLoading, setHistoryLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);   // 0-100
  const [uploadPhase, setUploadPhase] = useState("idle");    // 'idle'|'uploading'|'processing'
  const [uploadFileName, setUploadFileName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [limitError, setLimitError] = useState(null);
  const [plan, setPlan] = useState("free");
  const [proExpiresAt, setProExpiresAt] = useState(null);
  const [graceUntil, setGraceUntil] = useState(null);
  const [isTrial, setIsTrial] = useState(false);
  const [trialEnd, setTrialEnd] = useState(null);
  const [subscriptionSource, setSubscriptionSource] = useState(null);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [subscriptionCancelled, setSubscriptionCancelled] = useState(false);
  const [usage, setUsage] = useState({ pdfs: 0, questions: 0, maxPdfs: 3, maxQuestions: 5, loading: true });

  const [showInsights, setShowInsights] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [showUpgradedToast, setShowUpgradedToast] = useState(false);
  const [upgradePopup, setUpgradePopup] = useState(null);
  const [shareUrl, setShareUrl] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const [micError, setMicError] = useState(null);
  const [replyTo,  setReplyTo]  = useState(null);

  /* ── Chat sessions ── */
  const [sessions,         setSessions]         = useState([]);
  const [sessionsLoading,  setSessionsLoading]  = useState(false);
  const [activeSession,    setActiveSession]     = useState(null);

  /* ── Smart suggestions ── */
  const [suggestions,        setSuggestions]        = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  /* ── Tracks whether current session has had its first message (for auto-title) ── */
  const isFirstMsgRef = useRef(false);

  /* ── Onboarding ── */
  const [onboardingStep, setOnboardingStep] = useState(undefined);
  const [apiError, setApiError] = useState(null);   // { msg, retryText }
  const [retryLoading, setRetryLoading] = useState(false);

  /* ── Toast notifications ── */
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = "success", duration = 4200) => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p.slice(-3), { id, message, type, duration }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), duration);
  }, []);
  const dismissToast = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  /* ── Rotating placeholder ── */
  const PLACEHOLDERS = useMemo(() => [
    "Summarize this document…",
    "What is the total amount?",
    "List the key risks…",
    "Who are the parties involved?",
    "Extract important dates…",
    "What are the main conclusions?",
    "Explain this in simple terms…",
  ], []);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [placeholderFade, setPlaceholderFade] = useState(true);

  useEffect(() => {
    if (!selectedDoc) return;
    const id = setInterval(() => {
      setPlaceholderFade(false);
      setTimeout(() => {
        setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
        setPlaceholderFade(true);
      }, 250);
    }, 3500);
    return () => clearInterval(id);
  }, [selectedDoc, PLACEHOLDERS]);

  const [autoInsights, setAutoInsights] = useState(null);
  const [autoInsightsLoading, setAutoInsightsLoading] = useState(false);

  const fileInputRef       = useRef(null);
  const messagesEndRef     = useRef(null);
  const inputRef           = useRef(null);
  const chatScrollRef      = useRef(null);
  const isNearBottomRef    = useRef(true);   // true until user scrolls up
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const micLongPressTimer  = useRef(null);
  const micLongPressFired  = useRef(false);

  /* ── Standalone mic: quick voice input → fills text field ── */
  const mic = useMic({
    onTranscript: (text) => setInput(text),
    onError: (msg) => setMicError(msg),
  });

  /* ── Voice note recorder ── */
  function handleSendVoiceNote(blob, durationMs) {
    if (!selectedDoc) return;
    const audioUrl = URL.createObjectURL(blob);
    const id = Date.now();
    setMessages((prev) => [...prev, { role: "user", type: "audio", audioUrl, durationMs, id }]);
    voiceRecorder.reset();
  }

  const voiceRecorder = useVoiceRecorder({
    onStop:  handleSendVoiceNote,
    onError: (msg) => addToast(msg, "error"),
  });

  function fmtRecordDuration(sec) {
    return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
  }

  /* ── Voice conversation ── */
  const lastAiMessage = messages.filter((m) => m.role === "assistant" && !m.streaming).at(-1)?.content ?? "";
  const voiceConv = useVoiceConversation({
    onTranscript: (text) => handleSend(null, text),
    isThinking:   aiStreaming,
    lastAiMessage,
    hasDoc:       !!selectedDoc,
  });

  /* ── Auth guard ── */
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = "/login"; }
      else { setUser(user); setLoading(false); fetchDocs(user.id); fetchPlan(user.id); fetchUsage(); trackFirstVisit(); }
    });
  }, []);

  /* ── Post-payment upgrade toast + ?view= routing ── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "1") {
      setShowUpgradedToast(true);
      window.history.replaceState({}, "", "/dashboard");
      setTimeout(() => setShowUpgradedToast(false), 6000);
    }
    const viewParam = params.get("view");
    if (viewParam && ["team", "billing", "settings", "pdfs"].includes(viewParam)) {
      setView(viewParam);
      window.history.replaceState({}, "", "/dashboard");
    }
  }, []);

  /* ── Real-time Pro sync ── */
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`user_plan_${user.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "user_plans", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new;
          if (!row) return;
          const now = new Date();
          const isActive =
            row.plan === "pro" && (
              row.subscription_status === "active" || row.subscription_status === "trial" ||
              (row.pro_expires_at && new Date(row.pro_expires_at) > now) ||
              (row.grace_until    && new Date(row.grace_until)    > now)
            );
          setPlan(isActive ? "pro" : "free");
          setProExpiresAt(row.pro_expires_at ?? null);
          setGraceUntil(row.grace_until ?? null);
          setIsTrial(row.is_trial ?? false);
          setTrialEnd(row.trial_end ?? null);
          if (row.subscription_status === "cancelled") setSubscriptionCancelled(true);
          if (row.subscription_status === "active")    setSubscriptionCancelled(false);
          if (isActive) {
            setUsage((p) => ({ ...p, maxPdfs: Infinity, maxQuestions: Infinity }));
            if (row.razorpay_subscription_id) setSubscriptionSource("razorpay");
            setShowUpgradedToast(true);
            setTimeout(() => setShowUpgradedToast(false), 6000);
          } else {
            setUsage((p) => ({ ...p, maxPdfs: 3, maxQuestions: 5 }));
            setSubscriptionSource(null);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  async function fetchPlan(userId) {
    try {
      const { data } = await supabase
        .from("user_plans")
        .select("plan, pro_expires_at, grace_until, subscription_status, is_trial, trial_end, razorpay_subscription_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (data?.plan) {
        const now = new Date();
        const isActive =
          data.plan === "pro" && (
            data.subscription_status === "active" || data.subscription_status === "trial" ||
            (data.pro_expires_at && new Date(data.pro_expires_at) > now) ||
            (data.grace_until    && new Date(data.grace_until)    > now)
          );
        setPlan(isActive ? "pro" : "free");
        setProExpiresAt(data.pro_expires_at ?? null);
        setGraceUntil(data.grace_until ?? null);
        if (data.subscription_status === "cancelled") setSubscriptionCancelled(true);
        setIsTrial(data.is_trial ?? false);
        setTrialEnd(data.trial_end ?? null);
        if (isActive) {
          setUsage((p) => ({ ...p, maxPdfs: Infinity, maxQuestions: Infinity }));
          if (data.razorpay_subscription_id) setSubscriptionSource("razorpay");
        }
      }
    } catch {}
  }

  async function fetchUsage() {
    try {
      const res = await fetch("/api/usage", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.plan) {
        const now = new Date();
        const isActive =
          data.is_pro_active === true ||
          (data.plan === "pro" && (
            data.subscription_status === "active" || data.subscription_status === "trial" ||
            (data.pro_expires_at && new Date(data.pro_expires_at) > now) ||
            (data.grace_until    && new Date(data.grace_until)    > now)
          ));
        setPlan(isActive ? "pro" : "free");
        setProExpiresAt(data.pro_expires_at ?? null);
        if (isActive) {
          setUsage({ pdfs: 0, questions: 0, maxPdfs: Infinity, maxQuestions: Infinity, loading: false });
          return;
        }
      }
      setUsage({
        pdfs:         data.pdfs?.used      ?? 0,
        questions:    data.questions?.used ?? 0,
        maxPdfs:      data.pdfs?.max       ?? 3,
        maxQuestions: data.questions?.max  ?? 5,
        loading: false,
      });
    } catch {
      setUsage((p) => ({ ...p, loading: false }));
    }
  }

  const fetchDocs = useCallback(async (userId) => {
    setDocsLoading(true);
    const { data, error } = await supabase.from("documents").select("id, file_name, file_url, created_at").eq("user_id", userId).order("created_at", { ascending: false });
    if (!error && data) setDocs(data);
    setDocsLoading(false);
    return data || [];
  }, []);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    Events.pdfUploadStart();

    // ── Auth guard ────────────────────────────────────────────────────────────
    if (!user?.id) {
      addToast("Session expired. Please refresh the page and sign in again.", "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // ── Type validation ───────────────────────────────────────────────────────
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      addToast("Only PDF files are supported.", "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // ── Size validation ───────────────────────────────────────────────────────
    const FREE_MAX = 5  * 1024 * 1024;  // 5 MB
    const PRO_MAX  = 50 * 1024 * 1024;  // 50 MB
    const maxBytes = plan === "pro" ? PRO_MAX : FREE_MAX;
    if (file.size > maxBytes) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      if (plan !== "pro") {
        // Size issue ≠ count limit — only show an informational toast, not the paywall popup
        addToast(`File is ${sizeMB} MB — free plan supports PDFs up to 5 MB. Upgrade Pro for up to 50 MB.`, "warning", 8000);
      } else {
        addToast(`File is ${sizeMB} MB — max allowed is 50 MB.`, "error");
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // ── Start upload ──────────────────────────────────────────────────────────
    setUploading(true);
    setUploadProgress(0);
    setUploadPhase("uploading");
    setUploadFileName(file.name);
    const isFirstDoc = docs.length === 0;
    let uploadSucceeded = false;

    try {
      // Step 1 — Upload file DIRECTLY to Supabase Storage from the browser.
      // File never passes through Next.js/Vercel → no server bandwidth, no
      // timeout risk, and XHR fires real onUploadProgress events (0–88 %).
      const safeName    = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${user.id}/${Date.now()}-${safeName}`;

      const { error: storageError } = await supabase.storage
        .from("pdfs")
        .upload(storagePath, file, {
          contentType: "application/pdf",
          upsert:      false,
          // onUploadProgress available in @supabase/storage-js ≥ 2.5.1
          // (bundled in supabase-js ≥ 2.39). Internally switches to XHR.
          onUploadProgress: ({ loaded, total }) => {
            // Reserve 88–100 % for the server processing phase
            setUploadProgress(Math.min(88, Math.round((loaded / total) * 88)));
          },
        });

      if (storageError) {
        const msg = storageError.message || "";
        if (msg.includes("Bucket not found") || storageError.statusCode === "404") {
          addToast("Storage bucket 'pdfs' not found. Contact support.", "error", 8000);
        } else if (msg.includes("Duplicate") || msg.includes("already exists")) {
          addToast("This file was already uploaded. Rename it and try again.", "warning");
        } else if (msg.includes("Payload too large") || storageError.statusCode === "413") {
          addToast(`File too large for storage. Please try a smaller PDF.`, "error");
        } else {
          addToast(`Storage error: ${msg || "Upload failed. Please retry."}`, "error");
        }
        return;
      }

      const { data: urlData } = supabase.storage.from("pdfs").getPublicUrl(storagePath);
      const fileUrl = urlData.publicUrl;

      // Step 2 — Switch to processing phase (server creates DB row + embeddings).
      setUploadPhase("processing");
      setUploadProgress(92);

      const processRes = await fetch("/api/process-upload", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ storagePath, fileName: file.name, fileSize: file.size, fileUrl }),
        credentials: "include",
      });

      // Guard: Vercel gateway timeouts and proxy errors return HTML, not JSON.
      // Calling .json() on HTML throws "Unexpected token <" which is a confusing
      // error. Parse safely and fall back to a plain message.
      let processData = {};
      try {
        processData = await processRes.json();
      } catch {
        processData = { error: `Server error (HTTP ${processRes.status}). Please try again.` };
      }

      if (!processRes.ok) {
        // Storage upload succeeded but server failed → remove orphaned file
        supabase.storage.from("pdfs").remove([storagePath]).catch(() => {});

        if (processData.limitExceeded) {
          // Clean up upload UI immediately before showing the paywall popup
          setUploading(false);
          setUploadProgress(0);
          setUploadPhase("idle");
          setUploadFileName("");
          setUpgradePopup("pdf");
          return;
        }
        throw new Error(processData.error || "Server processing failed");
      }

      uploadSucceeded = true;
      Events.pdfUploadSuccess(file.name, file.size / 1024);
      setUploadProgress(100);

      // Step 3 — Refresh state and show success feedback
      const newDocs = await fetchDocs(user.id);
      await fetchUsage();
      addToast(`"${file.name}" uploaded successfully!`, "success");

      /* ── First-upload onboarding: auto-select + auto-summarize ── */
      if (isFirstDoc && newDocs.length > 0) {
        const newDoc = newDocs[0];
        setSelectedDoc(newDoc); setMessages([]); setLimitError(null);
        setSidebarOpen(false); setShowCompare(false); setShareUrl(null); setShowInsights(false);
        setView("chat");
        setOnboardingStep(2);
        const summaryText = "Give me a structured summary of this document covering the main topics, key details, and any important notes.";
        setTimeout(async () => {
          const userMsgId = Date.now();
          const aiMsgId   = Date.now() + 1;
          setAiStreaming(true);
          setMessages([
            { role: "user", content: summaryText, id: userMsgId },
            { role: "assistant", content: "", id: aiMsgId, streaming: true },
          ]);
          try {
            const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: summaryText, fileUrl: newDoc.file_url }), credentials: "include" });
            if (!res.ok) { const d = await res.json(); setMessages((p) => p.map((m) => m.id === aiMsgId ? { ...m, content: d.error || "Summary failed.", streaming: false } : m)); return; }
            const reader = res.body.getReader(); const decoder = new TextDecoder(); let buf = ""; let full = "";
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += decoder.decode(value, { stream: true });
              const lines = buf.split("\n"); buf = lines.pop();
              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const raw = line.slice(6); if (raw.trim() === "[DONE]" || raw.trim() === "[ERROR]") break;
                full += raw.replace(/\\n/g, "\n");
                setMessages((p) => p.map((m) => m.id === aiMsgId ? { ...m, content: full } : m));
              }
            }
            setMessages((p) => p.map((m) => m.id === aiMsgId ? { ...m, streaming: false } : m));
          } catch { setMessages((p) => p.map((m) => m.id === aiMsgId ? { ...m, content: "Unable to summarize. Please type a question.", streaming: false } : m)); }
          finally { setAiStreaming(false); fetchUsage(); }
        }, 500);
      }
    } catch (err) {
      // Never map arbitrary errors to the paywall — only server-confirmed
      // limitExceeded responses (handled above) should show the upgrade popup.
      const msg = err.message || "Upload failed. Please try again.";
      addToast(`Upload failed: ${msg}`, "error", 6000);
    } finally {
      // Use the local uploadSucceeded flag (not async React state) to decide
      // whether to show the 100 % completion briefly before hiding the bar.
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        setUploadPhase("idle");
        setUploadFileName("");
      }, uploadSucceeded ? 900 : 0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(doc) {
    if (plan !== "pro") { setUpgradePopup("pdf"); return; }
    if (!confirm(`Delete "${doc.file_name}"?`)) return;
    try {
      const res = await fetch("/api/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: doc.id, fileUrl: doc.file_url }), credentials: "include" });
      const data = await res.json();
      if (!res.ok) { if (data.proRequired) { setUpgradePopup("pdf"); return; } throw new Error(data.error || "Delete failed"); }
      if (selectedDoc?.id === doc.id) { setSelectedDoc(null); setMessages([]); setShowInsights(false); setShowCompare(false); }
      await fetchDocs(user.id);
      addToast(`"${doc.file_name}" deleted`, "info");
    } catch (err) { addToast("Delete failed: " + (err.message || "Please try again"), "error"); }
  }

  async function selectDoc(doc) {
    setSelectedDoc(doc); setMessages([]); setLimitError(null);
    setSidebarOpen(false); setShowCompare(false); setShareUrl(null); setShowInsights(true);
    setView("chat"); setSuggestions([]); setActiveSession(null); setSessions([]);

    // Load or create chat sessions for this document
    const existingSessions = await fetchSessions(doc.id);
    let targetSession;

    if (existingSessions.length === 0) {
      targetSession = await createSession(doc.id);
      if (targetSession) setSessions([targetSession]);
    } else {
      targetSession = existingSessions[0]; // most recently updated
    }

    if (targetSession) {
      setActiveSession(targetSession);
      await loadSessionMessages(targetSession);
    } else {
      setHistoryLoading(false);
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function handleClearChat() {
    if (!selectedDoc) return;
    const target = activeSession
      ? `Clear all messages in "${activeSession.title}"?`
      : `Clear all chat history for "${selectedDoc.file_name}"?`;
    if (!confirm(target)) return;
    try {
      const param = activeSession
        ? `sessionId=${activeSession.id}`
        : `documentId=${selectedDoc.id}`;
      await fetch(`/api/messages?${param}`, { method: "DELETE", credentials: "include" });
      setMessages([]);
      setSuggestions([]);
      isFirstMsgRef.current = true;
    } catch (err) { addToast("Could not clear chat: " + (err.message || "Please try again"), "error"); }
  }

  async function handleSend(e, overrideText) {
    e?.preventDefault();
    const text = (overrideText ?? input).trim();
    if (!text || !selectedDoc || aiStreaming) return;
    setInput(""); setLimitError(null); setApiError(null); setReplyTo(null);
    setSuggestions([]); setSuggestionsLoading(false);
    const isFirst = isFirstMsgRef.current;
    if (isFirst) isFirstMsgRef.current = false;
    const userMsg = { role: "user", content: text, id: Date.now() };
    const aiMsgId = userMsg.id + 1;
    setAiStreaming(true);
    setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "", id: aiMsgId, streaming: true }]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, fileUrl: selectedDoc.file_url, sessionId: activeSession?.id }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        if (data.limitExceeded) { setLimitError(data.error); setMessages((p) => p.map((m) => m.id === aiMsgId ? { ...m, content: "", streaming: false, locked: true } : m)); setUpgradePopup("question"); }
        else { setMessages((p) => p.map((m) => m.id === aiMsgId ? { ...m, content: data.error || "Request failed.", streaming: false } : m)); }
        return;
      }
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        setMessages((p) => p.map((m) => m.id === aiMsgId ? { ...m, content: "```json\n" + JSON.stringify(data.data, null, 2) + "\n```", streaming: false } : m));
        return;
      }
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let buffer = ""; let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n"); buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6);
          const sentinel = raw.trim();
          if (sentinel === "[DONE]" || sentinel === "[ERROR]") break;
          full += raw.replace(/\\n/g, "\n");
          setMessages((p) => p.map((m) => m.id === aiMsgId ? { ...m, content: full } : m));
        }
      }
      setMessages((p) => p.map((m) => m.id === aiMsgId ? { ...m, streaming: false } : m));
      Events.aiResponseGenerated();

      // Fire post-response side-effects in background (non-blocking)
      if (full) {
        // 1. Smart suggestions for next question
        fetchSuggestions(text, full);

        // 2. Update AI memory silently
        updateMemory(text, full);

        // 3. Auto-generate session title from first message
        if (isFirst && activeSession) {
          fetch("/api/chats", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: activeSession.id, firstMessage: text }),
            credentials: "include",
          })
            .then((r) => r.ok ? r.json() : null)
            .then((updated) => {
              if (!updated) return;
              setSessions((prev) => prev.map((s) => s.id === updated.id ? updated : s));
              setActiveSession(updated);
            })
            .catch(() => {});
        }
      }
    } catch (err) {
      // Classify the error for a user-friendly message
      let errorMsg = "Something went wrong. Please try again.";
      if (err instanceof TypeError && (err.message.includes("fetch") || err.message.includes("network") || err.message.includes("Failed to fetch"))) {
        errorMsg = "⚠️ Unable to connect. Check your internet connection and try again.";
        setApiError({ msg: errorMsg, retryText: text });
      } else if (err?.name === "AbortError") {
        errorMsg = "Request timed out. Please try again.";
      } else {
        setApiError({ msg: errorMsg, retryText: text });
      }
      setMessages((p) => p.map((m) => m.id === aiMsgId ? { ...m, content: errorMsg, streaming: false, isError: true } : m));
    } finally {
      setAiStreaming(false);
      if (user) fetchUsage();
    }
  }

  async function handleRetry() {
    if (!apiError?.retryText || retryLoading) return;
    setRetryLoading(true);
    setApiError(null);
    await handleSend(null, apiError.retryText);
    setRetryLoading(false);
  }

  function handleSmartAction(prompt) { if (!selectedDoc || aiStreaming) return; handleSend(null, prompt); }

  /* ── Session helpers ─────────────────────────────────────────────────────── */

  const fetchSessions = useCallback(async (docId) => {
    setSessionsLoading(true);
    try {
      const res = await fetch(`/api/chats?documentId=${docId}`, { credentials: "include" });
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
      return Array.isArray(data) ? data : [];
    } catch {
      setSessions([]);
      return [];
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  const createSession = useCallback(async (docId, title = "New Chat") => {
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId, title }),
        credentials: "include",
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  const loadSessionMessages = useCallback(async (session) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/messages?sessionId=${session.id}`, { credentials: "include" });
      if (res.ok) {
        const history = await res.json();
        const msgs = history.map((m) => ({ id: m.id, role: m.role, content: m.message }));
        setMessages(msgs);
        isFirstMsgRef.current = msgs.length === 0;
      }
    } catch {}
    finally { setHistoryLoading(false); }
  }, []);

  async function handleNewChat() {
    if (!selectedDoc) return;
    const session = await createSession(selectedDoc.id);
    if (!session) { addToast("Could not create chat", "error"); return; }
    setSessions((prev) => [session, ...prev]);
    setActiveSession(session);
    setMessages([]);
    setLimitError(null);
    setSuggestions([]);
    isFirstMsgRef.current = true;
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  async function handleSwitchSession(session) {
    if (activeSession?.id === session.id) return;
    setActiveSession(session);
    setMessages([]);
    setSuggestions([]);
    await loadSessionMessages(session);
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  async function handleDeleteSession(session) {
    if (!confirm(`Delete chat "${session.title}"?`)) return;
    await fetch(`/api/chats?id=${session.id}`, { method: "DELETE", credentials: "include" });
    const remaining = sessions.filter((s) => s.id !== session.id);
    setSessions(remaining);
    if (activeSession?.id === session.id) {
      if (remaining.length > 0) {
        setActiveSession(remaining[0]);
        await loadSessionMessages(remaining[0]);
      } else {
        await handleNewChat();
      }
    }
  }

  async function handleRenameSession(session) {
    const newTitle = window.prompt("Rename chat:", session.title);
    if (!newTitle?.trim() || newTitle.trim() === session.title) return;
    try {
      const res = await fetch("/api/chats", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: session.id, title: newTitle.trim() }),
        credentials: "include",
      });
      if (res.ok) {
        const updated = await res.json();
        setSessions((prev) => prev.map((s) => s.id === updated.id ? updated : s));
        if (activeSession?.id === updated.id) setActiveSession(updated);
      }
    } catch {}
  }

  /* ── Smart suggestions ───────────────────────────────────────────────────── */

  const fetchSuggestions = useCallback(async (userText, aiText) => {
    setSuggestionsLoading(true);
    setSuggestions([]);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recentMessages: [
            { role: "user",      content: userText },
            { role: "assistant", content: aiText   },
          ],
        }),
        credentials: "include",
      });
      if (!res.ok) return;
      const { suggestions: s } = await res.json();
      setSuggestions(s || []);
    } catch {}
    finally { setSuggestionsLoading(false); }
  }, []);

  /* ── Update memory silently after each AI response ───────────────────────── */
  const updateMemory = useCallback((userText, aiText) => {
    fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "user",      content: userText },
          { role: "assistant", content: aiText   },
        ],
        documentTitle: selectedDoc?.file_name,
      }),
      credentials: "include",
    }).catch(() => {});
  }, [selectedDoc?.file_name]);



  async function handleCancelSubscription() {
    if (!confirm("Cancel your Pro subscription?\n\nYou'll keep Pro access until your current period ends.")) return;
    setCancellingSubscription(true);
    try {
      const res = await fetch("/api/razorpay/cancel-subscription", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) { addToast(data.error || "Could not cancel subscription", "error"); return; }
      setSubscriptionCancelled(true);
      addToast(`Subscription cancelled. Pro access continues until ${new Date(data.pro_expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}.`, "info", 8000);
    } catch { addToast("Could not cancel subscription. Please try again.", "error"); }
    finally { setCancellingSubscription(false); }
  }

  async function handleSignOut() { await supabase.auth.signOut(); window.location.href = "/login"; }

  function copyText(text) { navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }

  function shareAnswer(text) {
    const t = `${text.slice(0, 280)}${text.length > 280 ? "…" : ""}\n\n— via Intellixy`;
    if (navigator.share) { navigator.share({ text: t, url: window.location.href }).catch(() => {}); }
    else { navigator.clipboard.writeText(t).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  }

  async function handleShareChat() {
    if (!selectedDoc || shareLoading) return;
    setShareLoading(true);
    try {
      const res = await fetch("/api/share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documentId: selectedDoc.id }), credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setShareUrl(data.url);
    } catch (err) { addToast("Share failed: " + (err.message || "Please try again"), "error"); }
    finally { setShareLoading(false); }
  }

  function copyShareUrl() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setShareCopied(true); setTimeout(() => setShareCopied(false), 2500);
  }

  /* ── Scroll helpers ── */
  const scrollToBottom = useCallback((smooth = false) => {
    const el = chatScrollRef.current;
    if (!el) return;
    // Direct scrollTop assignment is more reliable than scrollIntoView:
    // scrollIntoView can scroll the page instead of the container on some browsers
    if (smooth) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    else        el.scrollTop = el.scrollHeight;
  }, []);

  /* ── Track whether user is near bottom via scroll events ── */
  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container) return;
    function onScroll() {
      const dist = container.scrollHeight - container.scrollTop - container.clientHeight;
      isNearBottomRef.current = dist < 120;
      setShowScrollBtn(dist >= 120);
    }
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Auto-scroll when messages update ── */
  // useLayoutEffect fires before paint — no visible scroll jump
  useLayoutEffect(() => {
    if (!isNearBottomRef.current) return;
    const isStreaming = !!messages[messages.length - 1]?.streaming;
    scrollToBottom(!isStreaming); // instant during streaming, smooth on completion
  }, [messages, scrollToBottom]);

  /* ── Scroll to bottom on doc switch ── */
  useLayoutEffect(() => {
    isNearBottomRef.current = true;
    setShowScrollBtn(false);
    scrollToBottom(false);
  }, [selectedDoc, scrollToBottom]);

  function handleKeyDown(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }

  /* ── Auto-load insights on doc select ── */
  useEffect(() => {
    if (!selectedDoc) { setAutoInsights(null); return; }
    setAutoInsights(null); setAutoInsightsLoading(true);
    fetch(`/api/insights?documentId=${selectedDoc.id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data?.summary) setAutoInsights(data); })
      .catch(() => {})
      .finally(() => setAutoInsightsLoading(false));
  }, [selectedDoc?.id]);

  /* ── Loading spinner ── */
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 42, height: 42, border: "3px solid rgba(124,58,237,0.18)", borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontSize: 13, color: C.textMuted }}>Loading…</p>
        </div>
      </div>
    );
  }

  const userInitial = (user?.email || "").charAt(0).toUpperCase();
  const rightPanelOpen = (showInsights && !!selectedDoc) || showCompare;
  const qLimitHit = plan !== "pro" && usage.questions >= usage.maxQuestions;

  return (
    <div className="dashboard-root" style={{ display: "flex", background: C.bg, overflow: "hidden", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>

      {/* Ambient background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "50%", height: "50%", borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "40%", height: "40%", borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)" }} />
      </div>

      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }} />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR ── */}
      <Sidebar
        user={user}
        plan={plan}
        docs={docs}
        docsLoading={docsLoading}
        selectedDoc={selectedDoc}
        view={view}
        usage={usage}
        uploading={uploading}
        sessions={sessions}
        sessionsLoading={sessionsLoading}
        activeSession={activeSession}
        onViewChange={(v) => { setView(v); setSidebarOpen(false); }}
        onSignOut={handleSignOut}
        onSelectDoc={selectDoc}
        onDelete={handleDelete}
        onUploadClick={() => fileInputRef.current?.click()}
        onUpgradeClick={() => setUpgradePopup("pdf")}
        onNewChat={handleNewChat}
        onSelectSession={handleSwitchSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
      />

      {/* ── MAIN WRAPPER ── */}
      <div className="main-wrapper" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 1 }}>

        {/* Glass header */}
        <header style={{ height: 58, display: "flex", alignItems: "center", gap: 10, padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0, background: "rgba(7,7,26,0.8)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 10 }}>
          <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={() => setSidebarOpen(true)} className="menu-btn" style={{ background: "none", border: "none", cursor: "pointer", color: C.textSecondary, padding: 6, borderRadius: 8, flexShrink: 0 }}>
            <MenuIcon />
          </motion.button>

          {view === "chat" ? (
            selectedDoc ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: 14 }}>📄</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedDoc.file_name}</span>
              </div>
            ) : (
              <span style={{ fontSize: 14, fontWeight: 500, color: C.textMuted, flex: 1 }}>Select a PDF to start chatting</span>
            )
          ) : (
            <span style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, flex: 1 }}>
              {view === "dashboard" ? "Dashboard" : view === "pdfs" ? "My PDFs" : view === "billing" ? "Billing & Plan" : "Settings"}
            </span>
          )}

          {view === "chat" && (
            <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              {selectedDoc && (
                <>
                  {messages.length > 0 && (
                    <HeaderBtn onClick={handleClearChat} color="red">
                      <TrashIcon /><span className="btn-text"> Clear</span>
                    </HeaderBtn>
                  )}
                  <HeaderBtn onClick={() => setShowShareModal(true)} active={showShareModal} color="default">
                    <ShareIcon /><span className="btn-text"> Share</span>
                  </HeaderBtn>
                  <HeaderBtn onClick={() => { setShowInsights(!showInsights); setShowCompare(false); }} active={showInsights} color="purple">
                    <InsightIcon /><span className="btn-text"> Insights</span>
                  </HeaderBtn>
                </>
              )}
              {docs.length >= 2 && (
                <HeaderBtn onClick={() => { setShowCompare(!showCompare); setShowInsights(false); }} active={showCompare} color="purple">
                  <CompareIcon /><span className="btn-text"> Compare</span>
                </HeaderBtn>
              )}
              {selectedDoc && (
                <HeaderBtn onClick={voiceConv.toggle} active={voiceConv.active} color={voiceConv.active ? "purple" : "default"}>
                  <MicIcon active={voiceConv.active} />
                  <span className="btn-text"> {voiceConv.active ? "Voice On" : "Voice"}</span>
                </HeaderBtn>
              )}
            </div>
          )}
        </header>

        {/* Content row */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* Non-chat views */}
          {view === "dashboard" && (
            <DashboardHomeView
              docs={docs} usage={usage} plan={plan} proExpiresAt={proExpiresAt}
              isTrial={isTrial} trialEnd={trialEnd}
              onUpload={() => fileInputRef.current?.click()}
              onSelectDoc={selectDoc}
              onUpgradeClick={() => setUpgradePopup("pdf")}
              user={user}
              onViewChange={setView}
            />
          )}
          {view === "pdfs" && (
            <MyPDFsView
              docs={docs} docsLoading={docsLoading} plan={plan}
              onUpload={() => fileInputRef.current?.click()}
              onSelectDoc={selectDoc}
              onDelete={handleDelete}
              onViewChange={setView}
            />
          )}
          {view === "billing" && (
            <BillingView
              plan={plan} proExpiresAt={proExpiresAt} graceUntil={graceUntil} isTrial={isTrial} trialEnd={trialEnd}
              subscriptionCancelled={subscriptionCancelled} subscriptionSource={subscriptionSource}
              onUpgradeClick={() => setUpgradePopup("pdf")}
              onCancelSubscription={handleCancelSubscription}
              cancellingSubscription={cancellingSubscription}
              user={user}
            />
          )}
          {view === "settings" && (
            <SettingsView user={user} onSignOut={handleSignOut} />
          )}
          {view === "team" && (
            <div style={{ flex: 1, overflowY: "auto" }}>
              <TeamView user={user} />
            </div>
          )}

          {/* Chat column */}
          <div style={{ flex: 1, display: view === "chat" ? "flex" : "none", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

            {/* Smart action chips */}
            <AnimatePresence>
              {selectedDoc && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="smart-bar"
                  style={{ padding: "10px 16px 6px", display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(7,7,26,0.5)", backdropFilter: "blur(12px)" }}
                >
                  {SMART_ACTIONS.map((action, i) => (
                    <motion.button key={action.label}
                      initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                      whileHover={{ scale: 1.04, backgroundColor: "rgba(124,58,237,0.14)", borderColor: "rgba(124,58,237,0.32)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSmartAction(action.prompt)} disabled={aiStreaming}
                      style={{ padding: "5px 12px", background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 99, fontSize: 12, fontWeight: 500, color: C.textSecondary, cursor: aiStreaming ? "not-allowed" : "pointer", opacity: aiStreaming ? 0.45 : 1, whiteSpace: "nowrap", backdropFilter: "blur(8px)", transition: "all 0.15s" }}>
                      {action.label}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Voice conversation status bar */}
            <AnimatePresence>
              {voiceConv.active && (
                <VoiceConvBar
                  key="voice-bar"
                  convState={voiceConv.convState}
                  onStop={voiceConv.toggle}
                  onInterrupt={voiceConv.interrupt}
                  error={voiceConv.error}
                  onClearError={voiceConv.clearError}
                />
              )}
            </AnimatePresence>

            {/* Trial banner */}
            {isTrial && trialEnd && (() => {
              const daysLeft = Math.max(0, Math.ceil((new Date(trialEnd) - Date.now()) / 86400000));
              const urgent = daysLeft <= 2;
              return (
                <div style={{ flexShrink: 0, padding: "8px 16px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, padding: "10px 16px", borderRadius: 12, background: urgent ? "rgba(239,68,68,0.08)" : "rgba(6,182,212,0.07)", border: `1px solid ${urgent ? "rgba(239,68,68,0.25)" : "rgba(6,182,212,0.2)"}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 15 }}>{urgent ? "⚠️" : "🎁"}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: urgent ? "#f87171" : "#06b6d4" }}>
                        {daysLeft === 0 ? "Your free trial ends today!" : `Free trial · ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`}
                      </span>
                    </div>
                    <button onClick={() => setUpgradePopup("pdf")} style={{ fontSize: 11, fontWeight: 700, color: "white", background: urgent ? "linear-gradient(135deg,#ef4444,#dc2626)" : "linear-gradient(135deg,#7c3aed,#06b6d4)", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", whiteSpace: "nowrap" }}>
                      Upgrade — ₹299/mo →
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Messages */}
            <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div ref={chatScrollRef} style={{ flex: 1, overflowY: "auto", padding: "20px 16px 8px" }}>
                {!selectedDoc ? (
                  <WelcomeScreen onUpload={() => fileInputRef.current?.click()} usage={usage} plan={plan} />
                ) : historyLoading ? (
                  <div style={{ maxWidth: 740, margin: "0 auto", paddingTop: 16 }}><MessageSkeleton /></div>
                ) : messages.length === 0 ? (
                  <EmptyChatState doc={selectedDoc} onSetInput={setInput} inputRef={inputRef} />
                ) : (
                  <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22, paddingBottom: 12 }}>
                    {messages.map((msg) => (
                      <ChatMessage key={msg.id} msg={msg} onCopy={copyText} onShare={shareAnswer} userInitial={userInitial} onUpgrade={() => setUpgradePopup("question")}
                        onReply={(m) => { setReplyTo(m); inputRef.current?.focus(); }}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Scroll-to-bottom button */}
              <AnimatePresence>
                {showScrollBtn && (
                  <motion.button
                    key="scroll-btn"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    onClick={() => {
                      isNearBottomRef.current = true;
                      setShowScrollBtn(false);
                      scrollToBottom(true);
                    }}
                    style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", background: "rgba(124,58,237,0.9)", border: "1px solid rgba(124,58,237,0.5)", borderRadius: 99, fontSize: 12, fontWeight: 700, color: "white", cursor: "pointer", backdropFilter: "blur(12px)", boxShadow: "0 4px 20px rgba(124,58,237,0.4)", zIndex: 10 }}
                  >
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                    Scroll to bottom
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* AI streaming status bar */}
            <AnimatePresence>
              {aiStreaming && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ flexShrink: 0, overflow: "hidden" }}
                >
                  <StreamingStatusBar />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input area */}
            <div className="input-area" style={{ padding: "8px 16px 14px", flexShrink: 0, background: "rgba(7,7,26,0.88)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.05)", position: "sticky", bottom: 0, zIndex: 5 }}>

              {/* API connection error banner */}
              <AnimatePresence>
                {apiError && !aiStreaming && (
                  <motion.div
                    key="api-error"
                    initial={{ opacity: 0, y: 4, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ maxWidth: 740, margin: "0 auto 8px", padding: "9px 14px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.22)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span style={{ fontSize: 13 }}>⚠️</span>
                    <span style={{ flex: 1, fontSize: 12, color: "#fca5a5", lineHeight: 1.4 }}>{apiError.msg}</span>
                    <motion.button
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={handleRetry}
                      disabled={retryLoading}
                      style={{ padding: "5px 12px", background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 7, fontSize: 11.5, fontWeight: 700, color: "#fca5a5", cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 5 }}
                    >
                      {retryLoading ? <div style={{ width: 10, height: 10, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fca5a5", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> : "↺"} Retry
                    </motion.button>
                    <button onClick={() => setApiError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: 14, padding: 2, lineHeight: 1 }}>×</button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Smart suggestions — appear after AI finishes responding */}
              {selectedDoc && !qLimitHit && (
                <SmartSuggestions
                  suggestions={suggestions}
                  loading={suggestionsLoading}
                  onSelect={(text) => { setSuggestions([]); setInput(text); setTimeout(() => inputRef.current?.focus(), 50); }}
                />
              )}

              {/* Question usage progress bar */}
              {plan !== "pro" && selectedDoc && !qLimitHit && (
                <QuestionProgressBar usage={usage} onUpgrade={() => setUpgradePopup("question")} />
              )}

              {!selectedDoc ? (
                <div style={{ maxWidth: 740, margin: "0 auto", padding: "12px 16px", background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 14, display: "flex", alignItems: "center", gap: 10, backdropFilter: "blur(8px)" }}>
                  <span style={{ fontSize: 16 }}>👈</span>
                  <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>Select a PDF from the sidebar to start chatting</p>
                </div>
              ) : qLimitHit ? (
                <div style={{ maxWidth: 740, margin: "0 auto" }}>
                  <UpgradeBanner type="question" onUpgrade={() => setUpgradePopup("question")} usage={usage} />
                </div>
              ) : (
                <form onSubmit={handleSend} style={{ maxWidth: 740, margin: "0 auto" }}>

                  {/* ── Recording overlay ── */}
                  <AnimatePresence>
                    {voiceRecorder.isRecording && (
                      <motion.div
                        key="recording-ui"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: "hidden", marginBottom: 8 }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)", borderRadius: 12 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", flexShrink: 0, boxShadow: "0 0 6px rgba(239,68,68,0.7)", animation: "pulseDot 1.2s ease-in-out infinite" }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#f87171", flexShrink: 0 }}>Recording</span>
                          <span style={{ fontSize: 12, color: "#f87171", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{fmtRecordDuration(voiceRecorder.duration)}</span>
                          <VoiceWaveform isActive={true} />
                          <div style={{ flex: 1 }} />
                          <motion.button type="button" whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                            onClick={() => voiceRecorder.cancel()}
                            style={{ padding: "4px 11px", background: "transparent", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 7, fontSize: 11, fontWeight: 700, color: "#f87171", cursor: "pointer" }}>
                            Cancel
                          </motion.button>
                          <motion.button type="button" whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                            onClick={() => voiceRecorder.stop()}
                            style={{ padding: "4px 11px", background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 7, fontSize: 11, fontWeight: 700, color: "white", cursor: "pointer" }}>
                            Send
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── Reply preview ── */}
                  <AnimatePresence>
                    {replyTo && (
                      <motion.div
                        key="reply-preview"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: "hidden", marginBottom: 4 }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.18)", borderRadius: 10, borderLeft: "3px solid #7c3aed" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: C.accentLight, display: "block" }}>
                              {replyTo.role === "user" ? "You" : "Intellixy AI"}
                            </span>
                            <span style={{ fontSize: 11.5, color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                              {replyTo.content?.slice(0, 90) || "Voice note"}
                            </span>
                          </div>
                          <button type="button" onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 14, lineHeight: 1, flexShrink: 0, padding: "0 2px" }}>×</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8, background: C.glass, border: "1px solid rgba(255,255,255,0.09)", borderRadius: 18, padding: "11px 13px", backdropFilter: "blur(12px)", transition: "border-color 0.2s, box-shadow 0.2s", boxShadow: "0 4px 24px rgba(0,0,0,0.35)" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.45)"; e.currentTarget.style.boxShadow = "0 4px 32px rgba(124,58,237,0.12)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.35)"; }}
                  >
                    <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                      placeholder={PLACEHOLDERS[placeholderIdx]}
                      disabled={aiStreaming} rows={1} suppressHydrationWarning
                      style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: C.textPrimary, resize: "none", lineHeight: 1.6, maxHeight: 120, minHeight: 22, fontFamily: "inherit", opacity: placeholderFade ? 1 : 0, transition: "opacity 0.25s" }}
                      onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                      disabled={voiceConv.active}
                      title={voiceConv.active ? "Stop voice conversation to use quick mic" : voiceRecorder.isRecording ? "Release to send · hold = record" : mic.isListening ? "Stop recording" : "Tap = voice input · Hold = voice note"}
                      onPointerDown={(e) => {
                        if (voiceConv.active) return;
                        e.currentTarget.setPointerCapture(e.pointerId);
                        micLongPressFired.current = false;
                        micLongPressTimer.current = setTimeout(() => {
                          micLongPressFired.current = true;
                          if (mic.isListening) mic.stop();
                          setMicError(null);
                          voiceRecorder.start();
                        }, 480);
                      }}
                      onPointerUp={() => {
                        clearTimeout(micLongPressTimer.current);
                        if (micLongPressFired.current) {
                          voiceRecorder.stop();
                        } else {
                          setMicError(null); mic.toggle();
                        }
                      }}
                      onPointerCancel={() => {
                        clearTimeout(micLongPressTimer.current);
                        if (micLongPressFired.current) voiceRecorder.cancel();
                      }}
                      onContextMenu={(e) => e.preventDefault()}
                      style={{ width: 36, height: 36, borderRadius: 10, background: voiceRecorder.isRecording ? "rgba(239,68,68,0.18)" : mic.isListening ? "rgba(124,58,237,0.18)" : "rgba(255,255,255,0.04)", border: voiceRecorder.isRecording ? "1px solid rgba(239,68,68,0.5)" : mic.isListening ? "1px solid rgba(124,58,237,0.42)" : "1px solid rgba(255,255,255,0.08)", cursor: voiceConv.active ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: voiceRecorder.isRecording ? "#f87171" : mic.isListening ? C.accentLight : C.textMuted, transition: "all 0.2s", position: "relative", opacity: voiceConv.active ? 0.4 : 1, userSelect: "none", WebkitUserSelect: "none", touchAction: "none" }}>
                      {mic.isRequesting || voiceRecorder.isRequesting
                        ? <div style={{ width: 14, height: 14, border: "2px solid rgba(167,139,250,0.3)", borderTopColor: C.accentLight, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                        : <MicIcon active={mic.isListening || voiceRecorder.isRecording} />
                      }
                      {(mic.isListening || voiceRecorder.isRecording) && <span style={{ position: "absolute", top: 7, right: 7, width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "pulseDot 1.2s ease-in-out infinite" }} />}
                    </motion.button>
                    <motion.button type="submit" disabled={!input.trim() || aiStreaming}
                      whileHover={input.trim() && !aiStreaming ? { scale: 1.08 } : {}}
                      whileTap={input.trim() && !aiStreaming ? { scale: 0.92 } : {}}
                      style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none", cursor: !input.trim() || aiStreaming ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: !input.trim() || aiStreaming ? 0.38 : 1, transition: "opacity 0.2s", color: "white", boxShadow: input.trim() && !aiStreaming ? "0 4px 16px rgba(124,58,237,0.55)" : "none" }}>
                      {aiStreaming
                        ? <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                        : <SendIcon />
                      }
                    </motion.button>
                  </div>
                  {micError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      style={{ marginTop: 8, padding: "9px 13px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.22)", borderRadius: 10, display: "flex", alignItems: "flex-start", gap: 8 }}
                    >
                      <span style={{ fontSize: 13, flexShrink: 0 }}>🎙️</span>
                      <span style={{ fontSize: 12, color: "#fca5a5", lineHeight: 1.5, flex: 1 }}>{micError}</span>
                      <button onClick={() => setMicError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: 14, padding: "0 2px", lineHeight: 1, flexShrink: 0 }}>×</button>
                    </motion.div>
                  )}
                  {/* Voice waveform — replaces the plain "Listening…" text */}
                  <VoiceWaveform isActive={mic.isListening} />
                </form>
              )}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 8, fontSize: 10, color: "rgba(240,240,248,0.18)" }}>
                <ShieldIcon />
                <span>End-to-end encrypted · Your data is never sold · Delete anytime</span>
              </div>
            </div>
          </div>

          {/* Right panels */}
          {view === "chat" && (
            <AnimatePresence>
              {rightPanelOpen && showInsights && selectedDoc && (
                <InsightsPanel key="insights" doc={selectedDoc} onClose={() => setShowInsights(false)}
                  onAskQuestion={(q) => { setShowInsights(false); setTimeout(() => handleSend(null, q), 100); }}
                  preloaded={autoInsights} preloading={autoInsightsLoading} />
              )}
              {rightPanelOpen && showCompare && (
                <ComparePanel key="compare" docs={docs} onClose={() => setShowCompare(false)} />
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleUpload} style={{ display: "none" }} />

      {/* Onboarding overlay — shown to new users */}
      <OnboardingOverlay
        step={onboardingStep}
        onUpload={() => fileInputRef.current?.click()}
        onDismiss={() => setOnboardingStep(undefined)}
        onPromptClick={(prompt) => {
          if (selectedDoc) {
            setView("chat");
            handleSend(null, prompt);
          }
        }}
      />

      {/* ── Upload progress card ────────────────────────────────────────────── */}
      {/* Fixed bottom-left, separate from top-right toasts so they never overlap */}
      <AnimatePresence>
        {uploading && (
          <motion.div
            key="upload-progress"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: 16, scale: 0.96, transition: { duration: 0.2 } }}
            style={{
              position:     "fixed",
              bottom:        24,
              left:          24,
              zIndex:        9998,
              width:         300,
              background:    "rgba(10,10,28,0.97)",
              border:        "1px solid rgba(124,58,237,0.35)",
              borderRadius:  16,
              padding:       "14px 16px",
              backdropFilter: "blur(20px)",
              boxShadow:     "0 12px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,58,237,0.1)",
            }}
          >
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              {/* Animated icon */}
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: uploadPhase === "processing" ? "rgba(6,182,212,0.15)" : "rgba(124,58,237,0.15)",
                border: `1px solid ${uploadPhase === "processing" ? "rgba(6,182,212,0.3)" : "rgba(124,58,237,0.3)"}`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {uploadProgress === 100
                  ? <span style={{ fontSize: 14 }}>✓</span>
                  : uploadPhase === "processing"
                    ? <div style={{ width: 14, height: 14, border: "2px solid rgba(6,182,212,0.3)", borderTopColor: "#06b6d4", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    : <div style={{ width: 14, height: 14, border: "2px solid rgba(124,58,237,0.3)", borderTopColor: "#a78bfa", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                }
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(240,240,255,0.92)", margin: 0, lineHeight: 1.3,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {uploadProgress === 100
                    ? "Upload complete!"
                    : uploadPhase === "processing"
                      ? "Processing document…"
                      : `Uploading…`
                  }
                </p>
                <p style={{ fontSize: 10.5, color: "rgba(160,160,200,0.65)", margin: "2px 0 0",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {uploadFileName}
                </p>
              </div>

              <span style={{ fontSize: 12, fontWeight: 800, color: uploadProgress === 100 ? "#4ade80" : "#a78bfa",
                flexShrink: 0, minWidth: 36, textAlign: "right" }}>
                {uploadProgress}%
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
              <motion.div
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                style={{
                  height: "100%",
                  borderRadius: 99,
                  background: uploadProgress === 100
                    ? "linear-gradient(90deg,#22c55e,#4ade80)"
                    : uploadPhase === "processing"
                      ? "linear-gradient(90deg,#06b6d4,#7c3aed)"
                      : "linear-gradient(90deg,#7c3aed,#a78bfa)",
                  boxShadow: uploadPhase === "processing"
                    ? "0 0 8px rgba(6,182,212,0.6)"
                    : "0 0 8px rgba(124,58,237,0.6)",
                }}
              />
            </div>

            {/* Phase label */}
            <p style={{ fontSize: 10, color: "rgba(140,140,180,0.5)", margin: "7px 0 0", textAlign: "center" }}>
              {uploadPhase === "uploading"
                ? "Uploading to secure storage…"
                : uploadProgress === 100
                  ? "Generating AI embeddings ✓"
                  : "Extracting text & generating AI embeddings…"
              }
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Upgrade popup */}
      <AnimatePresence>
        {upgradePopup && <UpgradePopup key="upgrade" reason={upgradePopup} onClose={() => setUpgradePopup(null)} user={user} usage={usage} />}
      </AnimatePresence>

      {/* Share modal */}
      <AnimatePresence>
        {showShareModal && selectedDoc && (
          <ShareModal
            key="share-modal"
            doc={selectedDoc}
            session={activeSession}
            onClose={() => setShowShareModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Copy toast */}
      <AnimatePresence>
        {copied && (
          <motion.div key="copy-toast"
            initial={{ opacity: 0, y: 14, scale: 0.93 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }}
            style={{ position: "fixed", bottom: 24, right: 24, padding: "10px 18px", background: "rgba(20,18,48,0.95)", border: "1px solid rgba(255,255,255,0.1)", color: C.textPrimary, fontSize: 13, borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 100, backdropFilter: "blur(12px)" }}>
            Copied to clipboard ✓
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgraded toast */}
      <AnimatePresence>
        {showUpgradedToast && (
          <motion.div key="pro-toast"
            initial={{ opacity: 0, y: 24, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 14 }}
            transition={{ type: "spring", damping: 20, stiffness: 260 }}
            style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", padding: "14px 22px", background: "rgba(10,26,16,0.95)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 14, boxShadow: "0 8px 36px rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", gap: 12, whiteSpace: "nowrap", backdropFilter: "blur(16px)" }}
          >
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(34,197,94,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <CheckIcon />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, margin: 0 }}>Welcome to Pro! 🎉</p>
              <p style={{ fontSize: 11, color: C.textMuted, margin: "2px 0 0" }}>Unlimited PDFs and questions — forever.</p>
            </div>
            <motion.button whileHover={{ scale: 1.15 }} onClick={() => setShowUpgradedToast(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 4, marginLeft: 4, flexShrink: 0 }}>
              <CloseIcon />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes shimmer  { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pulseDot { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.7); } }

        @media (min-width: 769px) {
          .sidebar    { position: relative !important; transform: none !important; z-index: auto !important; }
          .menu-btn   { display: none !important; }
        }
        @media (max-width: 768px) {
          .sidebar     { position: fixed; top: 0; left: 0; bottom: 0; width: 260px !important; z-index: 50; transform: ${sidebarOpen ? "translateX(0)" : "translateX(-100%)"}; transition: transform 0.3s cubic-bezier(0.4,0,0.2,1); }
          .main-wrapper{ margin-left: 0 !important; }
          .menu-btn    { display: flex !important; align-items: center; }
          .header-actions .btn-text { display: none; }
          .smart-bar   { overflow-x: auto; flex-wrap: nowrap !important; padding-bottom: 8px; -webkit-overflow-scrolling: touch; }
          .smart-bar::-webkit-scrollbar { display: none; }
          .feature-grid{ grid-template-columns: 1fr !important; max-width: 100% !important; }
          .right-panel { position: fixed !important; inset: 0 !important; width: 100% !important; z-index: 50 !important; border-left: none !important; }
          .input-area  { position: sticky; bottom: 0; }
          .stats-grid  { grid-template-columns: 1fr !important; }
          .pdf-grid    { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 500px) {
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
        }
        textarea::placeholder { color: rgba(240,240,248,0.25); }
        textarea { scrollbar-width: none; }
        textarea::-webkit-scrollbar { display: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.25); border-radius: 99px; }
      `}</style>
    </div>
  );
}
