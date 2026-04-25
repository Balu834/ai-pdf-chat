"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { C } from "./tokens";

const INVITER_CREDITS  = 50;
const REFERRED_CREDITS = 20;

function ShareBtn({ icon, label, color, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, cursor: "pointer", transition: "all 0.15s" }}
    >
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: color || C.textMuted }}>{label}</span>
    </motion.button>
  );
}

export default function InviteModal({ onClose }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [copied, setCopied]     = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const fetchReferral = useCallback(async () => {
    try {
      const res = await fetch("/api/referral", { credentials: "include" });
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchReferral(); }, [fetchReferral]);

  const link = data?.link ?? "";
  const code = data?.code ?? "—";

  function copyLink() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }

  function copyCode() {
    navigator.clipboard.writeText(code).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2200);
    });
  }

  const shareMsg = encodeURIComponent(
    `🔥 I use Intellixy to chat with PDFs instantly — get AI answers, summaries & insights in seconds!\nGet ${REFERRED_CREDITS} free credits when you join: ${link}`
  );

  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${shareMsg}`, "_blank");
  }
  function shareTwitter() {
    window.open(`https://twitter.com/intent/tweet?text=${shareMsg}`, "_blank");
  }
  function shareEmail() {
    const subject = encodeURIComponent("Try this AI PDF tool — get free credits!");
    window.open(`mailto:?subject=${subject}&body=${shareMsg}`, "_blank");
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose?.()}
        style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: "100%", maxWidth: 500, background: "#0e0c1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 26, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.7)" }}
        >
          {/* Header banner */}
          <div style={{ background: "linear-gradient(135deg,#7c3aed 0%,#4f46e5 50%,#06b6d4 100%)", padding: "28px 28px 22px", position: "relative", overflow: "hidden" }}>
            {/* Decorative blobs */}
            <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
            <div style={{ position: "absolute", bottom: -20, left: 40, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

            <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", color: "white", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>

            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎁</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "white", margin: "0 0 6px", letterSpacing: "-0.5px" }}>Invite & Earn Credits</h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: 1.5 }}>
                You get <strong style={{ color: "white" }}>+{INVITER_CREDITS} credits</strong> for every friend who joins.
                They get <strong style={{ color: "white" }}>+{REFERRED_CREDITS} credits</strong> on signup.
              </p>
            </div>
          </div>

          <div style={{ padding: "22px 26px 26px" }}>

            {/* Stats row */}
            {!loading && data && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                {[
                  { label: "Invites Sent",    value: data.total_invites ?? 0, icon: "👥" },
                  { label: "Credits Earned",  value: data.total_rewards ?? 0, icon: "⚡" },
                  { label: "Your Bonus",       value: `${INVITER_CREDITS}/invite`, icon: "🎁" },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: "center", padding: "10px 8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                    <p style={{ fontSize: 16, fontWeight: 900, color: C.textPrimary, margin: "0 0 2px", letterSpacing: "-0.5px" }}>{s.value}</p>
                    <p style={{ fontSize: 10, color: C.textMuted, margin: 0 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Referral code */}
            <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Your referral code</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 12, marginBottom: 16 }}>
              {loading ? (
                <div style={{ height: 24, width: 100, background: "rgba(255,255,255,0.06)", borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
              ) : (
                <>
                  <span style={{ fontSize: 20, fontWeight: 900, color: "#a78bfa", letterSpacing: "0.1em", fontFamily: "monospace", flex: 1 }}>{code}</span>
                  <motion.button
                    whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                    onClick={copyCode}
                    style={{ padding: "5px 14px", background: codeCopied ? "rgba(74,222,128,0.12)" : "rgba(124,58,237,0.15)", border: `1px solid ${codeCopied ? "rgba(74,222,128,0.3)" : "rgba(124,58,237,0.3)"}`, borderRadius: 8, fontSize: 11, fontWeight: 700, color: codeCopied ? "#4ade80" : "#a78bfa", cursor: "pointer" }}
                  >
                    {codeCopied ? "✓ Copied!" : "Copy code"}
                  </motion.button>
                </>
              )}
            </div>

            {/* Invite link */}
            <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Invite link</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <div style={{ flex: 1, padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 12, color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {loading ? "Loading…" : link}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={copyLink}
                disabled={loading}
                style={{ flexShrink: 0, padding: "10px 16px", background: copied ? "rgba(74,222,128,0.12)" : "linear-gradient(135deg,rgba(124,58,237,0.6),rgba(79,70,229,0.5))", border: `1px solid ${copied ? "rgba(74,222,128,0.3)" : "rgba(124,58,237,0.3)"}`, borderRadius: 10, fontSize: 12, fontWeight: 700, color: copied ? "#4ade80" : "white", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                {copied ? "✓ Copied!" : "📋 Copy link"}
              </motion.button>
            </div>

            {/* Share buttons */}
            <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Share via</p>
            <div style={{ display: "flex", gap: 10 }}>
              <ShareBtn icon="💬" label="WhatsApp" color="#4ade80" onClick={shareWhatsApp} />
              <ShareBtn icon="𝕏"  label="Twitter"  color="#60a5fa" onClick={shareTwitter} />
              <ShareBtn icon="✉️" label="Email"    color="#f9a8d4" onClick={shareEmail}   />
            </div>

            {/* Recent referrals */}
            {!loading && data?.recent?.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Recent referrals</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {data.recent.slice(0, 5).map((r) => (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, fontSize: 12 }}>
                      <span style={{ color: C.textMuted }}>👤 Friend joined</span>
                      <span style={{ color: "#4ade80", fontWeight: 700 }}>+{r.inviter_credits} credits</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
