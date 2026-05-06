"use client";

import { motion } from "framer-motion";
import { C, timeAgo } from "./tokens";
import { TrashIcon } from "./icons";
import { Shimmer } from "./Shimmer";
import DragDropUploadZone from "./DragDropUploadZone";

export default function MyPDFsView({
  docs, docsLoading, plan, onUpload, onSelectDoc, onDelete, onViewChange,
  onFileDrop,
  uploading = false, uploadProgress = 0, uploadPhase = "idle", uploadFileName = "",
  pdfLimitHit = false, onUpgradeClick,
}) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 28px 40px" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Library</p>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: C.textPrimary, margin: 0, letterSpacing: "-0.5px" }}>My PDFs</h1>
        </div>
        {docs.length > 0 && !pdfLimitHit && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={onUpload}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 18px", background: "linear-gradient(135deg,rgba(124,58,237,0.7),rgba(79,70,229,0.6))", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 12, fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer" }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Upload PDF
          </motion.button>
        )}
      </div>

      {/* ── Upload in progress (full zone) or limit hit ── */}
      {(uploading || pdfLimitHit) && (
        <div style={{ marginBottom: 24 }}>
          <DragDropUploadZone
            onFile={onFileDrop ?? (() => {})}
            uploading={uploading}
            uploadProgress={uploadProgress}
            uploadPhase={uploadPhase}
            uploadFileName={uploadFileName}
            plan={plan}
            pdfLimitHit={pdfLimitHit}
            onUpgradeClick={onUpgradeClick}
          />
        </div>
      )}

      {docsLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
          {[1,2,3,4].map((i) => <Shimmer key={i} w="100%" h={130} r={14} />)}
        </div>
      ) : docs.length === 0 && !uploading ? (
        /* ── Empty state — full drag-and-drop zone ── */
        <DragDropUploadZone
          onFile={onFileDrop ?? (() => {})}
          uploading={false}
          plan={plan}
          pdfLimitHit={pdfLimitHit}
          onUpgradeClick={onUpgradeClick}
        />
      ) : (
        <>
          {/* ── Compact drop strip when docs exist ── */}
          {!uploading && !pdfLimitHit && (
            <div style={{ marginBottom: 18 }}>
              <DragDropUploadZone
                onFile={onFileDrop ?? onUpload}
                compact
                plan={plan}
              />
            </div>
          )}

          {/* ── PDF grid ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }} className="pdf-grid">
            {docs.map((doc, i) => (
              <motion.div key={doc.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 10, position: "relative", overflow: "hidden" }}
                whileHover={{ borderColor: "rgba(124,58,237,0.25)", boxShadow: "0 4px 24px rgba(124,58,237,0.12)", transition: { duration: 0.18 } }}
              >
                {/* Ambient glow top-right */}
                <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.08),transparent 70%)", pointerEvents: "none" }} />

                {/* File type icon */}
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
        </>
      )}
    </div>
  );
}
