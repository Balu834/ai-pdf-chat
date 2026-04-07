"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";

const supabase = createClient();

/* ─── ICONS ──────────────────────────────────────────────────────────────── */
const PdfIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"/>
    <line strokeLinecap="round" x1="16" y1="13" x2="8" y2="13"/>
    <line strokeLinecap="round" x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const SendIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const UploadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
    <polyline strokeLinecap="round" strokeLinejoin="round" points="17 8 12 3 7 8"/>
    <line strokeLinecap="round" x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const LogoutIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
    <polyline strokeLinecap="round" strokeLinejoin="round" points="16 17 21 12 16 7"/>
    <line strokeLinecap="round" x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const SparkleIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);
const CopyIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);
const TrashIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <polyline strokeLinecap="round" strokeLinejoin="round" points="3 6 5 6 21 6"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6M14 11v6"/>
  </svg>
);
const CrownIcon = () => (
  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2L9 9H2l5.5 4L5 20h14l-2.5-7L22 9h-7z"/>
  </svg>
);

/* ─── HELPERS ────────────────────────────────────────────────────────────── */
function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function timeAgo(ts) {
  if (!ts) return "";
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "Yesterday";
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ─── WELCOME SCREEN ────────────────────────────────────────────────────── */
function WelcomeScreen({ onUpload }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/30 mb-6">
        <PdfIcon />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Chat with your PDFs</h2>
      <p className="text-gray-400 text-sm max-w-xs mb-8">
        Upload a PDF and start asking questions. Get instant AI-powered answers from your documents.
      </p>
      <button
        onClick={onUpload}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-violet-500/30 transition-all duration-200 hover:-translate-y-0.5"
      >
        <UploadIcon />
        Upload your first PDF
      </button>
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg">
        {[
          { icon: "📄", title: "Smart Q&A", desc: "Ask anything about your document" },
          { icon: "⚡", title: "Instant answers", desc: "Powered by GPT-4o-mini" },
          { icon: "🔒", title: "Secure", desc: "Your files are private" },
        ].map((f) => (
          <div key={f.title} className="bg-white/4 border border-white/8 rounded-xl p-4 text-left">
            <div className="text-xl mb-2">{f.icon}</div>
            <p className="text-sm font-semibold text-white">{f.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── CHAT MESSAGES ─────────────────────────────────────────────────────── */
function ChatMessage({ msg, onCopy }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/30 shrink-0 mt-0.5">
          <SparkleIcon />
        </div>
      )}
      <div className={`group relative max-w-[75%] ${isUser ? "order-first" : ""}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-md shadow-lg shadow-violet-500/20"
            : "bg-white/6 border border-white/10 text-gray-100 rounded-bl-md"
        }`}>
          {msg.content}
          {msg.streaming && (
            <span className="inline-block w-1.5 h-4 ml-1 bg-violet-400 rounded-sm animate-pulse align-middle" />
          )}
        </div>
        {!isUser && !msg.streaming && (
          <button
            onClick={() => onCopy(msg.content)}
            className="absolute -bottom-5 left-0 opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-all duration-150 bg-transparent border-none cursor-pointer p-0"
          >
            <CopyIcon /> Copy
          </button>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-gray-300">
          U
        </div>
      )}
    </div>
  );
}

/* ─── MAIN DASHBOARD ─────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [aiStreaming, setAiStreaming] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [limitError, setLimitError] = useState(null);
  const [plan, setPlan] = useState("free");
  const [upgradingStripe, setUpgradingStripe] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  /* ── Auth guard ─────────────────────────────────────────────────────── */
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        window.location.href = "/login";
      } else {
        setUser(user);
        setLoading(false);
        fetchDocs(user.id);
        fetchPlan(user.id);
      }
    });
  }, []);

  /* ── Fetch user plan ────────────────────────────────────────────────── */
  async function fetchPlan(userId) {
    try {
      const { data } = await supabase
        .from("user_plans")
        .select("plan")
        .eq("user_id", userId)
        .single();
      if (data?.plan) setPlan(data.plan);
    } catch { /* free by default */ }
  }

  /* ── Fetch documents ────────────────────────────────────────────────── */
  const fetchDocs = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from("documents")
      .select("id, file_name, file_url, file_size, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error && data) setDocs(data);
  }, []);

  /* ── Upload PDF ─────────────────────────────────────────────────────── */
  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith(".pdf")) return;
    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("pdfs").upload(path, file, { upsert: false });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from("pdfs").getPublicUrl(path);
      const fileUrl = urlData.publicUrl;

      const { error: dbErr } = await supabase.from("documents").insert([{
        user_id: user.id,
        file_name: file.name,
        file_url: fileUrl,
        file_size: file.size,
      }]);
      if (dbErr) throw dbErr;

      await fetchDocs(user.id);
      // Trigger background embedding (best-effort, non-blocking)
      fetch("/api/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl }),
      }).catch(() => {});
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  /* ── Delete document ────────────────────────────────────────────────── */
  async function handleDelete(doc) {
    if (!confirm(`Delete "${doc.file_name}"?`)) return;
    try {
      const urlObj = new URL(doc.file_url);
      const pathMatch = urlObj.pathname.match(/\/object\/public\/pdfs\/(.+)$/);
      if (pathMatch) await supabase.storage.from("pdfs").remove([pathMatch[1]]);
      await supabase.from("documents").delete().eq("id", doc.id);
      if (selectedDoc?.id === doc.id) { setSelectedDoc(null); setMessages([]); }
      await fetchDocs(user.id);
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  }

  /* ── Select document ────────────────────────────────────────────────── */
  function selectDoc(doc) {
    setSelectedDoc(doc);
    setMessages([]);
    setLimitError(null);
    setSidebarOpen(false);
    inputRef.current?.focus();
  }

  /* ── Send message ───────────────────────────────────────────────────── */
  async function handleSend(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || !selectedDoc || aiStreaming) return;

    setInput("");
    setLimitError(null);
    const userMsg = { role: "user", content: text, id: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setAiStreaming(true);

    const aiMsgId = Date.now() + 1;
    setMessages((prev) => [...prev, { role: "assistant", content: "", id: aiMsgId, streaming: true }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, fileUrl: selectedDoc.file_url }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.limitExceeded) {
          setLimitError(data.error);
          setMessages((prev) => prev.filter((m) => m.id !== aiMsgId));
        } else {
          setMessages((prev) =>
            prev.map((m) => m.id === aiMsgId ? { ...m, content: data.error || "Request failed.", streaming: false } : m)
          );
        }
        return;
      }

      // Structured extraction returns JSON
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        const pretty = JSON.stringify(data.data, null, 2);
        setMessages((prev) =>
          prev.map((m) => m.id === aiMsgId ? { ...m, content: "```json\n" + pretty + "\n```", streaming: false } : m)
        );
        return;
      }

      // Streaming text
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => m.id === aiMsgId ? { ...m, content: full } : m)
        );
      }
      setMessages((prev) =>
        prev.map((m) => m.id === aiMsgId ? { ...m, streaming: false } : m)
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => m.id === aiMsgId ? { ...m, content: "Something went wrong. Please try again.", streaming: false } : m)
      );
    } finally {
      setAiStreaming(false);
    }
  }

  /* ── Stripe upgrade ─────────────────────────────────────────────────── */
  async function handleUpgrade() {
    setUpgradingStripe(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || "Checkout failed");
    } catch { alert("Checkout failed"); }
    finally { setUpgradingStripe(false); }
  }

  /* ── Copy ────────────────────────────────────────────────────────────── */
  function copyText(text) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  /* ── Sign out ────────────────────────────────────────────────────────── */
  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  /* ── Auto-scroll ─────────────────────────────────────────────────────── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Key handler ─────────────────────────────────────────────────────── */
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  /* ── Loading ─────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const userEmail = user?.email || "";
  const userInitial = userEmail.charAt(0).toUpperCase();

  return (
    <div className="flex h-screen bg-[#0d0d1a] overflow-hidden">

      {/* ── Sidebar overlay (mobile) ──────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ───────────────────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-gray-950 border-r border-white/6 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 md:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-white/6 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/30">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-sm font-bold text-white tracking-tight">AI PDF Chat</span>
        </div>

        {/* Upload button */}
        <div className="px-3 pt-3 pb-2 shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600/80 to-indigo-600/80 hover:from-violet-600 hover:to-indigo-600 border border-violet-500/30 rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            {uploading ? (
              <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Uploading…</>
            ) : (
              <><PlusIcon /> New PDF</>
            )}
          </button>
          <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleUpload} className="hidden" />
        </div>

        {/* PDF list */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          {docs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-gray-600">No PDFs yet</p>
              <p className="text-xs text-gray-700 mt-1">Upload one to get started</p>
            </div>
          ) : (
            docs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => selectDoc(doc)}
                className={`group flex items-start gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
                  selectedDoc?.id === doc.id
                    ? "bg-violet-600/20 border border-violet-500/30"
                    : "hover:bg-white/4 border border-transparent"
                }`}
              >
                <span className={`mt-0.5 ${selectedDoc?.id === doc.id ? "text-violet-400" : "text-gray-500"}`}>
                  <PdfIcon />
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${selectedDoc?.id === doc.id ? "text-violet-200" : "text-gray-300"}`}>
                    {doc.file_name}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {formatBytes(doc.file_size)} · {timeAgo(doc.created_at)}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(doc); }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-400 transition-all bg-transparent border-none cursor-pointer rounded"
                >
                  <TrashIcon />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Bottom: plan + user */}
        <div className="border-t border-white/6 p-3 space-y-2 shrink-0">
          {plan !== "pro" && (
            <button
              onClick={handleUpgrade}
              disabled={upgradingStripe}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 rounded-xl transition-all duration-200 disabled:opacity-60"
            >
              <CrownIcon />
              {upgradingStripe ? "Loading…" : "Upgrade to Pro · $9/mo"}
            </button>
          )}
          {plan === "pro" && (
            <div className="flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-amber-300">
              <CrownIcon /> Pro Plan
            </div>
          )}
          <div className="flex items-center gap-2 px-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {userInitial}
            </div>
            <p className="text-xs text-gray-400 truncate flex-1">{userEmail}</p>
            <button onClick={handleSignOut} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer rounded">
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN AREA ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className="h-14 flex items-center gap-3 px-4 border-b border-white/6 shrink-0 bg-[#0d0d1a]/95 backdrop-blur-sm">
          <button
            className="md:hidden p-1.5 text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer rounded-lg hover:bg-white/5"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon />
          </button>
          {selectedDoc ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-violet-400 shrink-0"><PdfIcon /></span>
              <span className="text-sm font-semibold text-white truncate">{selectedDoc.file_name}</span>
              {formatBytes(selectedDoc.file_size) && (
                <span className="text-xs text-gray-500 shrink-0 hidden sm:inline">{formatBytes(selectedDoc.file_size)}</span>
              )}
            </div>
          ) : (
            <h1 className="text-sm font-semibold text-gray-300">Select a PDF to start chatting</h1>
          )}
          <div className="ml-auto flex items-center gap-2">
            {plan === "pro" && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full">
                <CrownIcon /> PRO
              </span>
            )}
          </div>
        </header>

        {/* Chat body */}
        <div className="flex-1 overflow-y-auto">
          {!selectedDoc ? (
            <WelcomeScreen onUpload={() => fileInputRef.current?.click()} />
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-full px-6 text-center py-12">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 mb-4">
                <SparkleIcon />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{selectedDoc.file_name}</h3>
              <p className="text-gray-400 text-sm mb-6">Ask anything about this document</p>
              <div className="flex flex-wrap justify-center gap-2 max-w-md">
                {["Summarize this document", "What are the key points?", "List any important dates", "Extract contact information"].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/40 text-gray-300 hover:text-white rounded-lg transition-all duration-150 cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-8 pb-4">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} msg={msg} onCopy={copyText} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Limit error banner */}
        {limitError && (
          <div className="mx-4 mb-2 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3">
            <p className="text-xs text-amber-300">{limitError}</p>
            <button
              onClick={handleUpgrade}
              disabled={upgradingStripe}
              className="shrink-0 text-xs font-bold px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition-colors disabled:opacity-60 border-none cursor-pointer"
            >
              {upgradingStripe ? "…" : "Upgrade"}
            </button>
          </div>
        )}

        {/* Input bar */}
        {selectedDoc && (
          <div className="px-4 pb-4 pt-2 shrink-0">
            <form
              onSubmit={handleSend}
              className="flex items-end gap-2 bg-white/5 border border-white/10 hover:border-violet-500/30 focus-within:border-violet-500/50 rounded-2xl px-4 py-3 transition-all duration-200 max-w-3xl mx-auto"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask about ${selectedDoc.file_name}…`}
                disabled={aiStreaming}
                rows={1}
                suppressHydrationWarning
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none resize-none leading-relaxed max-h-32 disabled:opacity-60"
                style={{ minHeight: "24px" }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || aiStreaming}
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-md shadow-violet-500/25 border-none cursor-pointer"
              >
                {aiStreaming ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <SendIcon />
                )}
              </button>
            </form>
            <p className="text-center text-[10px] text-gray-700 mt-2">
              AI can make mistakes. Verify important information.
            </p>
          </div>
        )}
      </div>

      {/* Copy toast */}
      {copied && (
        <div className="fixed bottom-6 right-6 px-4 py-2.5 bg-gray-800 border border-white/10 text-white text-sm rounded-xl shadow-xl animate-fade-in z-50">
          Copied to clipboard
        </div>
      )}
    </div>
  );
}
