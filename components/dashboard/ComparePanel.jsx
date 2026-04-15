"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { C } from "./tokens";
import { CompareIcon, CloseIcon } from "./icons";

export default function ComparePanel({ docs, onClose }) {
  const [doc1Id, setDoc1Id] = useState(docs[0]?.id || "");
  const [doc2Id, setDoc2Id] = useState(docs[1]?.id || "");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleCompare() {
    if (!doc1Id || !doc2Id) { setError("Select two PDFs."); return; }
    if (doc1Id === doc2Id) { setError("Select two different PDFs."); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/compare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ doc1Id, doc2Id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Comparison failed");
      setResult(data.result);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const selStyle = { width: "100%", padding: "10px 12px", background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 9, fontSize: 13, color: C.textPrimary, outline: "none", cursor: "pointer" };

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
      transition={{ duration: 0.26, ease: [0.4,0,0.2,1] }}
      className="right-panel"
      style={{ width: 340, borderLeft: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,10,26,0.9)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}
    >
      <div style={{ height: 57, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: C.accentLight }}><CompareIcon /></span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>Compare PDFs</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 4 }}><CloseIcon /></button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
        {docs.length < 2 ? (
          <div style={{ textAlign: "center", paddingTop: 32 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
            <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>Upload at least <strong style={{ color: C.textPrimary }}>2 PDFs</strong> to compare.</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, margin: "0 0 6px" }}>Document 1</p>
              <select value={doc1Id} onChange={(e) => { setDoc1Id(e.target.value); setResult(null); setError(null); }} style={selStyle}>
                <option value="" style={{ background: "#0d0d1a" }}>Select PDF…</option>
                {docs.map((d) => <option key={d.id} value={d.id} style={{ background: "#0d0d1a" }}>{d.file_name}</option>)}
              </select>
            </div>
            <div style={{ textAlign: "center", margin: "6px 0", color: C.textMuted, fontSize: 12 }}>vs</div>
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, margin: "0 0 6px" }}>Document 2</p>
              <select value={doc2Id} onChange={(e) => { setDoc2Id(e.target.value); setResult(null); setError(null); }} style={selStyle}>
                <option value="" style={{ background: "#0d0d1a" }}>Select PDF…</option>
                {docs.map((d) => <option key={d.id} value={d.id} style={{ background: "#0d0d1a" }}>{d.file_name}</option>)}
              </select>
            </div>
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleCompare} disabled={loading || !doc1Id || !doc2Id}
              style={{ width: "100%", padding: "11px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 10, cursor: loading || !doc1Id || !doc2Id ? "not-allowed" : "pointer", opacity: loading || !doc1Id || !doc2Id ? 0.6 : 1, marginBottom: 14 }}>
              {loading ? "Comparing…" : "Compare Documents"}
            </motion.button>
            {loading && <div style={{ textAlign: "center", padding: "12px 0" }}><div style={{ width: 30, height: 30, border: "3px solid rgba(124,58,237,0.22)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 8px" }} /><p style={{ fontSize: 12, color: C.textMuted }}>Analyzing…</p></div>}
            {error && <div style={{ padding: "10px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 8, marginBottom: 10 }}><p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>{error}</p></div>}
            {result && (
              <div style={{ background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 12, padding: 16 }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: C.accentLight, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>Comparison Result</p>
                <div style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {result.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
                    part.startsWith("**") && part.endsWith("**")
                      ? <strong key={i} style={{ color: C.textPrimary, display: "block", marginTop: i > 0 ? 10 : 0 }}>{part.slice(2,-2)}</strong>
                      : <span key={i}>{part}</span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
