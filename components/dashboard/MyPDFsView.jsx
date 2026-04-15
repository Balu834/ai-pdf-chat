"use client";

import { motion } from "framer-motion";
import { C, timeAgo } from "./tokens";
import { PlusIcon, TrashIcon } from "./icons";
import { Shimmer } from "./Shimmer";

export default function MyPDFsView({ docs, docsLoading, plan, onUpload, onSelectDoc, onDelete, onViewChange }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 28px 40px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Library</p>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: C.textPrimary, margin: 0, letterSpacing: "-0.5px" }}>My PDFs</h1>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onUpload}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 18px", background: "linear-gradient(135deg,rgba(124,58,237,0.7),rgba(79,70,229,0.6))", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 12, fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer" }}>
          <PlusIcon /> Upload PDF
        </motion.button>
      </div>

      {docsLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
          {[1,2,3,4].map((i) => <Shimmer key={i} w="100%" h={130} r={14} />)}
        </div>
      ) : docs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>📂</div>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary, margin: "0 0 6px" }}>No PDFs uploaded yet</p>
          <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 20px" }}>Upload a PDF to start asking questions</p>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onUpload}
            style={{ padding: "12px 24px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", fontSize: 13, fontWeight: 700, border: "none", borderRadius: 12, cursor: "pointer" }}>
            Upload your first PDF →
          </motion.button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }} className="pdf-grid">
          {docs.map((doc, i) => (
            <motion.div key={doc.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 10, position: "relative", overflow: "hidden" }}
            >
              <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.08),transparent 70%)", pointerEvents: "none" }} />
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,rgba(124,58,237,0.18),rgba(79,70,229,0.12))", border: "1px solid rgba(124,58,237,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" fill="none" stroke={C.accentLight} viewBox="0 0 24 24" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.file_name}</p>
                <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>{timeAgo(doc.created_at)}</p>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { onSelectDoc(doc); onViewChange("chat"); }}
                  style={{ flex: 1, padding: "8px 10px", background: "linear-gradient(135deg,rgba(124,58,237,0.5),rgba(79,70,229,0.4))", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 9, fontSize: 12, fontWeight: 600, color: "white", cursor: "pointer" }}>
                  Chat →
                </motion.button>
                <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                  onClick={() => onDelete(doc)}
                  title={plan !== "pro" ? "Pro only" : "Delete"}
                  style={{ width: 34, height: 34, padding: 0, background: plan !== "pro" ? "rgba(255,255,255,0.03)" : "rgba(239,68,68,0.08)", border: `1px solid ${plan !== "pro" ? "rgba(255,255,255,0.07)" : "rgba(239,68,68,0.2)"}`, borderRadius: 9, fontSize: plan !== "pro" ? 11 : undefined, color: plan !== "pro" ? C.textMuted : C.danger, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {plan !== "pro" ? "🔒" : <TrashIcon />}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
