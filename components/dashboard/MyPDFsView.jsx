"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { C, timeAgo } from "./tokens";
import { TrashIcon } from "./icons";
import { Shimmer } from "./Shimmer";
import DragDropUploadZone from "./DragDropUploadZone";

const GridIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const ListIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

export default function MyPDFsView({
  docs, docsLoading, plan, onUpload, onSelectDoc, onDelete, onViewChange,
  onFileDrop,
  uploading = false, uploadProgress = 0, uploadPhase = "idle", uploadFileName = "",
  pdfLimitHit = false, onUpgradeClick,
}) {
  const [viewMode, setViewMode] = useState("grid");
  const [query,    setQuery]    = useState("");
  const [sortBy,   setSortBy]   = useState("newest");

  const filtered = useMemo(() => {
    let list = [...docs];
    if (query) list = list.filter((d) => d.file_name.toLowerCase().includes(query.toLowerCase()));
    if (sortBy === "newest") list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (sortBy === "oldest") list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    if (sortBy === "name")   list.sort((a, b) => a.file_name.localeCompare(b.file_name));
    return list;
  }, [docs, query, sortBy]);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 28px 48px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: 11.5, fontWeight: 700, color: C.textMuted, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Library</p>
          <h1 style={{ fontSize: 27, fontWeight: 900, color: C.textPrimary, margin: 0, letterSpacing: "-0.6px" }}>
            My{" "}
            <span style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6,#3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              PDFs
            </span>
          </h1>
        </div>

        {docs.length > 0 && !pdfLimitHit && (
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 8px 28px rgba(124,58,237,0.38)", y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={onUpload}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 18px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "1px solid rgba(124,58,237,0.35)", borderRadius: 12, fontSize: 13, fontWeight: 700, color: "white", cursor: "pointer", boxShadow: "0 4px 18px rgba(124,58,237,0.3)" }}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Upload PDF
          </motion.button>
        )}
      </div>

      {/* ── Upload zone / limit ── */}
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
          {[1, 2, 3, 4].map((i) => <Shimmer key={i} w="100%" h={130} r={14} />)}
        </div>

      ) : docs.length === 0 && !uploading ? (
        <DragDropUploadZone
          onFile={onFileDrop ?? (() => {})}
          uploading={false}
          plan={plan}
          pdfLimitHit={pdfLimitHit}
          onUpgradeClick={onUpgradeClick}
        />

      ) : (
        <>
          {/* Compact drop strip */}
          {!uploading && !pdfLimitHit && (
            <div style={{ marginBottom: 20 }}>
              <DragDropUploadZone onFile={onFileDrop ?? onUpload} compact plan={plan} />
            </div>
          )}

          {/* ── Toolbar ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ position: "relative", flex: "1 1 180px", minWidth: 160, maxWidth: 300 }}>
              <svg width="13" height="13" fill="none" stroke="rgba(240,240,248,0.3)" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search PDFs…"
                style={{ width: "100%", boxSizing: "border-box", paddingLeft: 32, paddingRight: 10, paddingTop: 8, paddingBottom: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, fontSize: 12.5, color: C.textSecondary, outline: "none", fontFamily: "inherit", transition: "border-color 0.15s" }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.4)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ padding: "8px 10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, fontSize: 12.5, color: C.textSecondary, outline: "none", cursor: "pointer", fontFamily: "inherit" }}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name A–Z</option>
            </select>

            {/* View toggle */}
            <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, overflow: "hidden", flexShrink: 0 }}>
              {[
                { mode: "grid", Icon: GridIcon },
                { mode: "list", Icon: ListIcon },
              ].map(({ mode, Icon }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{ padding: "7px 10px", background: viewMode === mode ? "rgba(124,58,237,0.18)" : "transparent", border: "none", cursor: "pointer", color: viewMode === mode ? C.accentLight : C.textMuted, transition: "all 0.15s", display: "flex", alignItems: "center" }}
                >
                  <Icon />
                </button>
              ))}
            </div>

            <span style={{ fontSize: 11.5, color: C.textMuted, flexShrink: 0 }}>
              {filtered.length} PDF{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* ── No results ── */}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 20px" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.textSecondary, margin: "0 0 6px" }}>No PDFs found</p>
              <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>Try a different search term</p>
            </div>
          )}

          {/* ── Grid view ── */}
          {viewMode === "grid" && filtered.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 14 }} className="pdf-grid">
              <AnimatePresence>
                {filtered.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ borderColor: "rgba(124,58,237,0.28)", boxShadow: "0 8px 32px rgba(124,58,237,0.14)", y: -2, transition: { duration: 0.2 } }}
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "20px 18px", display: "flex", flexDirection: "column", gap: 12, position: "relative", overflow: "hidden", cursor: "default" }}
                  >
                    {/* Ambient glow */}
                    <div style={{ position: "absolute", top: -30, right: -30, width: 110, height: 110, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.08),transparent 70%)", pointerEvents: "none" }} />

                    {/* File icon */}
                    <div style={{ width: 46, height: 46, borderRadius: 13, background: "linear-gradient(135deg,rgba(124,58,237,0.2),rgba(79,70,229,0.14))", border: "1px solid rgba(124,58,237,0.24)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="22" height="22" fill="none" stroke={C.accentLight} viewBox="0 0 24 24" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                      </svg>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 700, color: C.textPrimary, margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.file_name}</p>
                      <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>{timeAgo(doc.created_at)}</p>
                    </div>

                    <div style={{ display: "flex", gap: 7 }}>
                      <motion.button
                        whileHover={{ scale: 1.03, boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { onSelectDoc(doc); onViewChange("chat"); }}
                        style={{ flex: 1, padding: "9px 10px", background: "linear-gradient(135deg,rgba(124,58,237,0.55),rgba(79,70,229,0.45))", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 10, fontSize: 12.5, fontWeight: 700, color: "white", cursor: "pointer" }}
                      >
                        Chat →
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => onDelete(doc)}
                        title={plan !== "pro" ? "Pro only" : "Delete"}
                        style={{ width: 36, height: 36, padding: 0, background: plan !== "pro" ? "rgba(255,255,255,0.03)" : "rgba(239,68,68,0.08)", border: `1px solid ${plan !== "pro" ? "rgba(255,255,255,0.07)" : "rgba(239,68,68,0.2)"}`, borderRadius: 10, fontSize: plan !== "pro" ? 11 : undefined, color: plan !== "pro" ? C.textMuted : C.danger, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        {plan !== "pro" ? "🔒" : <TrashIcon />}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* ── List view ── */}
          {viewMode === "list" && filtered.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <AnimatePresence>
                {filtered.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ delay: i * 0.03 }}
                    whileHover={{ borderColor: "rgba(124,58,237,0.25)", boxShadow: "0 4px 20px rgba(124,58,237,0.1)", x: 2, transition: { duration: 0.16 } }}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, transition: "border-color 0.15s" }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,rgba(124,58,237,0.18),rgba(79,70,229,0.12))", border: "1px solid rgba(124,58,237,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="18" height="18" fill="none" stroke={C.accentLight} viewBox="0 0 24 24" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: C.textPrimary, margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.file_name}</p>
                      <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>{timeAgo(doc.created_at)}</p>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <motion.button
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        onClick={() => { onSelectDoc(doc); onViewChange("chat"); }}
                        style={{ padding: "7px 16px", background: "linear-gradient(135deg,rgba(124,58,237,0.5),rgba(79,70,229,0.4))", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 9, fontSize: 12.5, fontWeight: 700, color: "white", cursor: "pointer" }}
                      >
                        Chat →
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                        onClick={() => onDelete(doc)}
                        title={plan !== "pro" ? "Pro only" : "Delete"}
                        style={{ width: 34, height: 34, padding: 0, background: plan !== "pro" ? "rgba(255,255,255,0.03)" : "rgba(239,68,68,0.08)", border: `1px solid ${plan !== "pro" ? "rgba(255,255,255,0.07)" : "rgba(239,68,68,0.2)"}`, borderRadius: 9, fontSize: plan !== "pro" ? 11 : undefined, color: plan !== "pro" ? C.textMuted : C.danger, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        {plan !== "pro" ? "🔒" : <TrashIcon />}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  );
}
