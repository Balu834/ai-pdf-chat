"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── icons ──────────────────────────────────────────────────────────────────── */
const CopyIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);
const LinkIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
  </svg>
);
const XIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12"/>
  </svg>
);
const GlobeIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
  </svg>
);
const LockIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6M14 11v6"/>
  </svg>
);

/* ─── ShareModal ─────────────────────────────────────────────────────────────── */
export default function ShareModal({ doc, session, onClose }) {
  const [shareData, setShareData]   = useState(null);
  const [loading, setLoading]       = useState(false);
  const [creating, setCreating]     = useState(false);
  const [revoking, setRevoking]     = useState(false);
  const [toggling, setToggling]     = useState(false);
  const [copied, setCopied]         = useState(false);
  const [error, setError]           = useState(null);

  const appUrl = typeof window !== "undefined"
    ? `${window.location.origin}`
    : (process.env.NEXT_PUBLIC_APP_URL || "https://intellixy.vercel.app");

  // Load existing share on mount
  useEffect(() => {
    if (!doc?.id) return;
    setLoading(true);
    fetch(`/api/share?documentId=${doc.id}${session?.id ? `&sessionId=${session.id}` : ""}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.shareId) setShareData(json);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [doc?.id, session?.id]);

  async function createShare() {
    setCreating(true);
    setError(null);
    try {
      const body = { documentId: doc.id };
      if (session?.id) body.sessionId = session.id;

      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create link");
      setShareData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function togglePublic() {
    if (!shareData?.shareId) return;
    setToggling(true);
    try {
      const res = await fetch("/api/share", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId: shareData.shareId, isPublic: !shareData.isPublic }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setShareData((prev) => ({ ...prev, isPublic: json.is_public }));
    } catch (e) {
      setError(e.message);
    } finally {
      setToggling(false);
    }
  }

  async function revokeShare() {
    if (!shareData?.shareId) return;
    if (!window.confirm("Revoke this share link? Anyone with the link will lose access.")) return;
    setRevoking(true);
    try {
      const res = await fetch("/api/share", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId: shareData.shareId }),
      });
      if (!res.ok) throw new Error("Failed to revoke");
      setShareData(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setRevoking(false);
    }
  }

  function copyLink() {
    if (!shareData?.url) return;
    navigator.clipboard.writeText(shareData.url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(`Check out this AI PDF chat: ${shareData.url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  function shareTwitter() {
    const text = encodeURIComponent("Check out this AI-powered PDF chat on Intellixy 🤖📄");
    const url  = encodeURIComponent(shareData.url);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  }

  const isPublic = shareData?.isPublic !== false;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%", maxWidth: 440,
            background: "#0e0e1f", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 20, padding: "28px 28px 24px",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
            fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#a78bfa" }}>
                <LinkIcon />
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "white" }}>Share Chat</h2>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0, marginTop: 1 }}>
                  {doc?.file_name?.replace(/\.pdf$/i, "") || "Document"}
                  {session && <span style={{ color: "#a78bfa" }}> · {session.title}</span>}
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <XIcon />
            </button>
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#fca5a5" }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "28px 0", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <div style={{ width: 28, height: 28, border: "3px solid rgba(124,58,237,0.3)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 10px" }} />
              Checking share status…
            </div>
          ) : !shareData ? (
            /* No share yet — create */
            <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔗</div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: "0 0 20px", lineHeight: 1.6 }}>
                Create a shareable link so anyone can read this chat — no login required.
              </p>
              <button
                onClick={createShare}
                disabled={creating}
                style={{
                  width: "100%", padding: "13px", borderRadius: 12, border: "none",
                  background: creating ? "rgba(124,58,237,0.35)" : "linear-gradient(135deg,#7c3aed,#4f46e5)",
                  color: "white", fontWeight: 700, fontSize: 14,
                  cursor: creating ? "not-allowed" : "pointer",
                  boxShadow: creating ? "none" : "0 6px 24px rgba(124,58,237,0.4)",
                }}
              >
                {creating ? "Creating link…" : "Create share link"}
              </button>
            </div>
          ) : (
            /* Has share */
            <>
              {/* Visibility toggle */}
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: isPublic ? "#34d399" : "#f59e0b" }}>
                    {isPublic ? <GlobeIcon /> : <LockIcon />}
                  </span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "white", margin: 0 }}>
                      {isPublic ? "Public link" : "Private (link disabled)"}
                    </p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0, marginTop: 1 }}>
                      {isPublic ? "Anyone with the link can view" : "Link is paused — no one can access"}
                    </p>
                  </div>
                </div>
                {/* Toggle switch */}
                <button
                  onClick={togglePublic}
                  disabled={toggling}
                  style={{
                    width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                    background: isPublic ? "#7c3aed" : "rgba(255,255,255,0.12)",
                    position: "relative", transition: "background 0.2s", flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: "absolute", top: 3, left: isPublic ? 20 : 3,
                    width: 18, height: 18, borderRadius: "50%", background: "white",
                    transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                  }} />
                </button>
              </div>

              {/* Link input */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <div style={{
                  flex: 1, padding: "10px 14px", borderRadius: 10,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 12, color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {shareData.url}
                </div>
                <button
                  onClick={copyLink}
                  style={{
                    padding: "10px 14px", borderRadius: 10, border: "none",
                    background: copied ? "rgba(34,197,94,0.15)" : "rgba(124,58,237,0.15)",
                    border: copied ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(124,58,237,0.3)",
                    color: copied ? "#4ade80" : "#a78bfa", fontWeight: 700, fontSize: 12,
                    cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  <CopyIcon />
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              {/* Social share */}
              <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                <button
                  onClick={shareWhatsApp}
                  style={{ flex: 1, padding: "9px", borderRadius: 9, border: "1px solid rgba(37,211,102,0.2)", background: "rgba(37,211,102,0.07)", color: "#25d366", fontWeight: 600, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </button>
                <button
                  onClick={shareTwitter}
                  style={{ flex: 1, padding: "9px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  X (Twitter)
                </button>
              </div>

              {/* Revoke */}
              <button
                onClick={revokeShare}
                disabled={revoking}
                style={{ width: "100%", padding: "9px", borderRadius: 9, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)", color: "#f87171", fontWeight: 600, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.15s" }}
              >
                <TrashIcon />
                {revoking ? "Revoking…" : "Revoke link"}
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
