"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { C } from "./tokens";
import { InsightIcon, CloseIcon, CheckIcon } from "./icons";
import { Shimmer } from "./Shimmer";

export default function InsightsPanel({ doc, onClose, onAskQuestion, preloaded, preloading }) {
  const [insights, setInsights] = useState(preloaded || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { if (preloaded) setInsights(preloaded); }, [preloaded]);

  useEffect(() => {
    if (!doc) return;
    if (preloaded) { setInsights(preloaded); return; }
    setInsights(null); setError(null);
    fetch(`/api/insights?documentId=${doc.id}`)
      .then((r) => r.json())
      .then((data) => { if (data?.summary) setInsights(data); })
      .catch(() => {});
  }, [doc?.id]);

  async function generateInsights() {
    if (!doc) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/insights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documentId: doc.id, fileUrl: doc.file_url }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setInsights(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
      transition={{ duration: 0.26, ease: [0.4,0,0.2,1] }}
      className="right-panel"
      style={{ width: 300, borderLeft: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,10,26,0.9)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}
    >
      <div style={{ height: 57, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: C.accentLight }}><InsightIcon /></span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>AI Insights</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 4 }}>
          <CloseIcon />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
        {(loading || preloading) && !insights && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 4 }}>
            <div style={{ background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.14)", borderRadius: 12, padding: 14 }}>
              <Shimmer h={9} r={5} style={{ width: "35%", marginBottom: 10 }} />
              <Shimmer h={12} r={5} style={{ marginBottom: 6 }} />
              <Shimmer h={12} r={5} style={{ width: "85%", marginBottom: 6 }} />
              <Shimmer h={12} r={5} style={{ width: "70%" }} />
            </div>
            <div style={{ background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 12, padding: 14 }}>
              <Shimmer h={9} r={5} style={{ width: "40%", marginBottom: 12 }} />
              {[0,1,2].map((j) => <div key={j} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}><Shimmer w={13} h={13} r={99} /><Shimmer h={11} r={5} /></div>)}
            </div>
          </div>
        )}

        {!insights && !loading && !preloading && (
          <div style={{ textAlign: "center", paddingTop: 28 }}>
            <div style={{ fontSize: 34, marginBottom: 12 }}>✨</div>
            <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 18, lineHeight: 1.55 }}>
              Generate AI insights for <strong style={{ color: C.textPrimary }}>{doc?.file_name}</strong>
            </p>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={generateInsights}
              style={{ padding: "11px 20px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 10, cursor: "pointer", width: "100%" }}>
              Generate Insights
            </motion.button>
            {error && <p style={{ fontSize: 12, color: "#f87171", marginTop: 10 }}>{error}</p>}
          </div>
        )}

        {insights && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)", borderRadius: 12, padding: 14 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: C.accentLight, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>Summary</p>
              <p style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.65, margin: 0 }}>{insights.summary}</p>
            </div>
            {insights.key_points?.length > 0 && (
              <div style={{ background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 12, padding: 14 }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: C.accentLight, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>Key Points</p>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                  {insights.key_points.map((pt, i) => (
                    <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ color: C.accent, flexShrink: 0, marginTop: 1 }}><CheckIcon /></span>
                      <span style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.55 }}>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {insights.suggested_questions?.length > 0 && (
              <div style={{ background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 12, padding: 14 }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: C.accentLight, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>Try asking</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {insights.suggested_questions.map((q, i) => (
                    <motion.button key={i} whileHover={{ scale: 1.01 }} onClick={() => onAskQuestion(q)}
                      style={{ padding: "8px 11px", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)", borderRadius: 8, fontSize: 12, color: C.accentLight, cursor: "pointer", textAlign: "left", lineHeight: 1.4, transition: "all 0.15s" }}>
                      {q}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
            <button onClick={generateInsights} style={{ padding: "8px", background: "transparent", border: `1px solid ${C.glassBorder}`, borderRadius: 8, fontSize: 12, color: C.textMuted, cursor: "pointer" }}>
              Regenerate
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
