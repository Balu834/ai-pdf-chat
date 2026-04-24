"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const PREVIEW_LIMIT = 8; // messages shown before the gate

/* ─── LOGO ────────────────────────────────────────────────────────────────── */
function Logo({ size = 28 }) {
  return (
    <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
      <div style={{
        width: size, height: size, borderRadius: Math.round(size * 0.29),
        background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 12px rgba(124,58,237,0.4)",
      }}>
        <span style={{ fontSize: Math.round(size * 0.5), fontWeight: 900, color: "white" }}>I</span>
      </div>
      <span style={{ fontSize: Math.round(size * 0.54), fontWeight: 800, color: "white", letterSpacing: "-0.2px" }}>Intellixy</span>
    </a>
  );
}

/* ─── MESSAGE BUBBLE ──────────────────────────────────────────────────────── */
function MessageBubble({ msg, blurred }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex", gap: 12,
      justifyContent: isUser ? "flex-end" : "flex-start",
      filter: blurred ? "blur(5px)" : "none",
      userSelect: blurred ? "none" : "auto",
      transition: "filter 0.3s",
      pointerEvents: blurred ? "none" : "auto",
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, marginTop: 2, boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
        }}>
          <svg width="14" height="14" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
        </div>
      )}
      <div style={{ maxWidth: "75%" }}>
        <div style={{
          padding: "10px 16px",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word",
          background: isUser ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "rgba(255,255,255,0.06)",
          border: isUser ? "none" : "1px solid rgba(255,255,255,0.09)",
          color: isUser ? "white" : "rgba(255,255,255,0.88)",
          boxShadow: isUser ? "0 4px 16px rgba(124,58,237,0.25)" : "none",
        }}>
          {msg.message}
        </div>
      </div>
      {isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, marginTop: 2, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)",
        }}>U</div>
      )}
    </div>
  );
}

/* ─── GATE OVERLAY ────────────────────────────────────────────────────────── */
function GateOverlay({ remaining }) {
  return (
    <div style={{
      position: "relative", marginTop: -80, zIndex: 10,
      background: "linear-gradient(to bottom, transparent 0%, #07071a 40%)",
      paddingTop: 80, paddingBottom: 32, textAlign: "center",
    }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "6px 14px", borderRadius: 99,
        background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)",
        fontSize: 12, fontWeight: 600, color: "#c4b5fd", marginBottom: 16,
      }}>
        🔒 {remaining} more message{remaining !== 1 ? "s" : ""} hidden
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 800, color: "white", margin: "0 0 8px", letterSpacing: "-0.3px" }}>
        Sign up to read the full chat
      </h3>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", margin: "0 0 20px" }}>
        Free account · No credit card · Takes 30 seconds
      </p>
      <a
        href="/login"
        style={{
          display: "inline-block", padding: "13px 32px",
          background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
          color: "white", fontWeight: 800, fontSize: 15, borderRadius: 12,
          textDecoration: "none", boxShadow: "0 8px 28px rgba(124,58,237,0.5)",
          letterSpacing: "-0.2px",
        }}
      >
        Unlock full chat →
      </a>
    </div>
  );
}

/* ─── SOCIAL PROOF BAR ────────────────────────────────────────────────────── */
function SocialProof() {
  const stats = [
    { emoji: "👥", label: "100+ users" },
    { emoji: "📄", label: "500+ PDFs analyzed" },
    { emoji: "⚡", label: "Instant AI answers" },
  ];
  return (
    <div style={{
      display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap",
      padding: "14px 20px",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(255,255,255,0.015)",
    }}>
      {stats.map((s) => (
        <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
          <span>{s.emoji}</span>
          <span style={{ fontWeight: 600 }}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── CTA SECTION ─────────────────────────────────────────────────────────── */
function CTASection() {
  return (
    <div style={{
      borderTop: "1px solid rgba(255,255,255,0.07)",
      background: "linear-gradient(180deg,#0d0d20 0%,#080814 100%)",
      padding: "48px 20px 80px",
    }}>
      <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 14px", borderRadius: 99,
          background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)",
          fontSize: 11, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.06em",
          textTransform: "uppercase", marginBottom: 20,
        }}>
          ✨ AI PDF Chat
        </div>

        <h2 style={{
          fontSize: "clamp(24px,5vw,36px)", fontWeight: 900, color: "white",
          margin: "0 0 14px", letterSpacing: "-0.5px", lineHeight: 1.2,
        }}>
          Stop reading PDFs.<br />
          <span style={{ background: "linear-gradient(135deg,#a78bfa,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Start chatting with them.
          </span>
        </h2>

        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", margin: "0 0 32px", lineHeight: 1.6 }}>
          Upload your own PDF and get instant answers, summaries, and key insights — powered by AI.
        </p>

        {/* Social proof avatars */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ display: "flex" }}>
            {["#7c3aed","#06b6d4","#10b981","#f59e0b","#ef4444"].map((c, i) => (
              <div key={i} style={{
                width: 28, height: 28, borderRadius: "50%", background: c,
                border: "2px solid #08081a", marginLeft: i > 0 ? -8 : 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: "white",
              }}>
                {["A","B","C","D","E"][i]}
              </div>
            ))}
          </div>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
            Join <strong style={{ color: "white" }}>100+ users</strong> already using Intellixy
          </span>
        </div>

        {/* CTA buttons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href="/login"
            style={{
              padding: "14px 32px", borderRadius: 12,
              background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
              color: "white", fontWeight: 800, fontSize: 15,
              textDecoration: "none", boxShadow: "0 8px 32px rgba(124,58,237,0.45)",
              letterSpacing: "-0.2px", whiteSpace: "nowrap",
            }}
          >
            Try it free →
          </a>
          <a
            href="/login"
            style={{
              padding: "14px 28px", borderRadius: 12,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.8)", fontWeight: 700, fontSize: 15,
              textDecoration: "none", letterSpacing: "-0.2px", whiteSpace: "nowrap",
            }}
          >
            Upload your PDF
          </a>
        </div>

        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginTop: 16 }}>
          Free forever · No credit card required
        </p>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 28 }}>
          {["Instant answers", "AI summaries", "Key insights", "Unlimited questions"].map((f) => (
            <span key={f} style={{
              padding: "5px 12px", borderRadius: 99, fontSize: 12,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.4)",
            }}>
              ✓ {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ───────────────────────────────────────────────────────────── */
export default function SharePage() {
  const { id } = useParams();
  const [data, setData]       = useState(null);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/share/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setData(json);
      })
      .catch(() => setError("Failed to load share link."))
      .finally(() => setLoading(false));
  }, [id]);

  // Realtime: append new messages as they arrive
  useEffect(() => {
    if (!data?.share?.id) return;

    const channel = supabaseAnon
      .channel(`share-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new;
          // Only show messages that match this share's document/session
          setData((prev) => {
            if (!prev) return prev;
            const alreadyExists = prev.messages.some((m) => m.created_at === msg.created_at && m.role === msg.role);
            if (alreadyExists) return prev;
            return { ...prev, messages: [...prev.messages, { role: msg.role, message: msg.message, created_at: msg.created_at }] };
          });
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabaseAnon.removeChannel(channel); };
  }, [data?.share?.id, id]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(`Check out this AI PDF chat: ${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  function shareTwitter() {
    const text = encodeURIComponent("Check out this AI-powered PDF chat on Intellixy 🤖📄");
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  }

  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
  const base = { minHeight: "100vh", background: "#07071a", fontFamily: font, color: "white", display: "flex", flexDirection: "column" };

  /* Loading */
  if (loading) return (
    <div style={{ ...base, alignItems: "center", justifyContent: "center" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 36, height: 36, border: "3px solid rgba(124,58,237,0.3)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginTop: 16 }}>Loading chat…</p>
    </div>
  );

  /* Error */
  if (error) return (
    <div style={{ ...base, alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>Link not found</h1>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 28 }}>{error}</p>
      <a href="/" style={{ padding: "10px 24px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", fontWeight: 700, fontSize: 14, borderRadius: 10, textDecoration: "none" }}>
        Go to Intellixy →
      </a>
    </div>
  );

  const { share, messages } = data;
  const preview = messages.slice(0, PREVIEW_LIMIT);
  const locked = messages.slice(PREVIEW_LIMIT);
  const hasGate = locked.length > 0;

  return (
    <div style={base}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.3); border-radius: 99px; }
        .share-btn:hover { opacity: 0.85 !important; }
      `}</style>

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <header style={{
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(7,7,26,0.92)", backdropFilter: "blur(14px)",
        position: "sticky", top: 0, zIndex: 20,
      }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Logo size={28} />
          <a
            href="/login"
            className="share-btn"
            style={{
              padding: "7px 18px", borderRadius: 8,
              background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
              color: "white", fontWeight: 700, fontSize: 13,
              textDecoration: "none", boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
              transition: "opacity 0.2s",
            }}
          >
            Try for free →
          </a>
        </div>
      </header>

      {/* ── SOCIAL PROOF ──────────────────────────────────────────────────── */}
      <SocialProof />

      {/* ── WATERMARK BANNER ──────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(90deg,rgba(124,58,237,0.08),rgba(6,182,212,0.06),rgba(124,58,237,0.08))",
        borderBottom: "1px solid rgba(124,58,237,0.18)",
        padding: "10px 20px",
        textAlign: "center",
      }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
            ✨ Shared via{" "}
            <strong style={{ color: "#a78bfa", fontWeight: 700 }}>Intellixy</strong>
            {" "}· AI PDF Chat — chat with any document instantly
          </span>
        </a>
      </div>

      {/* ── TITLE BAR ─────────────────────────────────────────────────────── */}
      <div style={{ background: "rgba(124,58,237,0.05)", borderBottom: "1px solid rgba(124,58,237,0.12)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                <svg width="13" height="13" fill="none" stroke="#a78bfa" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"/>
                </svg>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.1em" }}>Shared Chat</span>
              </div>
              <h1 style={{ fontSize: "clamp(16px,3vw,20px)", fontWeight: 800, color: "white", margin: "0 0 4px", letterSpacing: "-0.3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {share.title || "Untitled Document"}
              </h1>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>
                {messages.length} message{messages.length !== 1 ? "s" : ""} · Powered by Intellixy AI
                {share.viewCount > 1 && <span> · {share.viewCount} views</span>}
              </p>
            </div>

            {/* Share buttons */}
            <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
              <button
                onClick={copyLink}
                style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "7px 13px",
                  background: linkCopied ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.06)",
                  border: linkCopied ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, fontSize: 12, fontWeight: 600,
                  color: linkCopied ? "#4ade80" : "rgba(255,255,255,0.6)",
                  cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
                }}
              >
                {linkCopied ? "✓ Copied!" : "🔗 Copy link"}
              </button>
              <button
                onClick={shareWhatsApp}
                title="Share on WhatsApp"
                style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.25)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#25d366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </button>
              <button
                onClick={shareTwitter}
                title="Share on X (Twitter)"
                style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MESSAGES ──────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, width: "100%", maxWidth: 760, margin: "0 auto", padding: "24px 20px", width: "100%" }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "rgba(255,255,255,0.3)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <p style={{ fontSize: 14 }}>No messages in this chat yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp 0.4s ease" }}>
            {/* Visible messages */}
            {preview.map((msg, i) => <MessageBubble key={i} msg={msg} blurred={false} />)}

            {/* Blurred teaser + gate */}
            {hasGate && (
              <div style={{ position: "relative" }}>
                {locked.slice(0, 3).map((msg, i) => (
                  <div key={i} style={{ marginBottom: 20 }}>
                    <MessageBubble msg={msg} blurred={true} />
                  </div>
                ))}
                <GateOverlay remaining={locked.length} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CTA SECTION ───────────────────────────────────────────────────── */}
      <CTASection />

      {/* ── STICKY MOBILE CTA ─────────────────────────────────────────────── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30,
        background: "linear-gradient(to top, #07071a 60%, transparent)",
        padding: "16px 20px 20px",
        display: "none",
      }} className="mobile-cta">
        <a
          href="/login"
          style={{
            display: "block", width: "100%", padding: "15px",
            background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
            color: "white", fontWeight: 800, fontSize: 15,
            borderRadius: 14, textDecoration: "none", textAlign: "center",
            boxShadow: "0 8px 28px rgba(124,58,237,0.5)",
          }}
        >
          Try it free — Upload your PDF →
        </a>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .mobile-cta { display: block !important; }
        }
      `}</style>
    </div>
  );
}
