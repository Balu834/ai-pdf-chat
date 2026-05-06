"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { C } from "./tokens";

/* ─── File size formatter ────────────────────────────────────────────────── */
function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ─── Animated dots loader ───────────────────────────────────────────────── */
function Dots() {
  return (
    <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          style={{ width: 4, height: 4, borderRadius: "50%", background: "#a78bfa", display: "inline-block" }}
        />
      ))}
    </span>
  );
}

/* ─── PDF icon ───────────────────────────────────────────────────────────── */
function PdfFileIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"/>
      <line strokeLinecap="round" strokeLinejoin="round" x1="16" y1="13" x2="8" y2="13"/>
      <line strokeLinecap="round" strokeLinejoin="round" x1="16" y1="17" x2="8" y2="17"/>
      <polyline strokeLinecap="round" strokeLinejoin="round" points="10 9 9 9 8 9"/>
    </svg>
  );
}

/* ─── Upload cloud icon ──────────────────────────────────────────────────── */
function UploadCloudIcon({ size = 40, active = false }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={active ? "#a78bfa" : "rgba(240,240,248,0.3)"} strokeWidth="1.5">
      <polyline strokeLinecap="round" strokeLinejoin="round" points="16 16 12 12 8 16"/>
      <line strokeLinecap="round" strokeLinejoin="round" x1="12" y1="12" x2="12" y2="21"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
    </svg>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────── */
export default function DragDropUploadZone({
  onFile,          // (file: File) => void
  uploading = false,
  uploadProgress = 0,
  uploadPhase = "idle",
  uploadFileName = "",
  plan = "free",
  pdfLimitHit = false,
  onUpgradeClick,
  compact = false,  // compact = small zone for "add more" header strip
}) {
  const [dragging, setDragging]           = useState(false);
  const [dragError, setDragError]         = useState(null);
  const [previewFile, setPreviewFile]     = useState(null);
  const fileInputRef                      = useRef(null);
  const dragCounter                       = useRef(0);

  /* ── Validate file before upload ── */
  function validate(file) {
    if (!file) return "No file received.";
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) return "Only PDF files are supported.";
    const maxBytes = plan === "pro" ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      return plan === "pro"
        ? `File is ${mb} MB — max allowed is 50 MB.`
        : `File is ${mb} MB — free plan supports up to 5 MB. Upgrade for 50 MB.`;
    }
    return null;
  }

  const submit = useCallback((file) => {
    const err = validate(file);
    if (err) { setDragError(err); setTimeout(() => setDragError(null), 4000); return; }
    setPreviewFile({ name: file.name, size: file.size });
    onFile(file);
    setTimeout(() => setPreviewFile(null), 2000);
  }, [onFile, plan]);

  /* ── Drag events ── */
  const onDragEnter = (e) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current++;
    if (dragCounter.current === 1) setDragging(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragging(false);
  };
  const onDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current = 0; setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) submit(file);
  };
  const onInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) submit(file);
    e.target.value = "";
  };

  /* ── COMPACT variant — thin strip for "add more" ── */
  if (compact) {
    return (
      <div
        onDragEnter={onDragEnter} onDragLeave={onDragLeave}
        onDragOver={onDragOver}  onDrop={onDrop}
        onClick={() => !uploading && !pdfLimitHit && fileInputRef.current?.click()}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 16px",
          background: dragging ? "rgba(124,58,237,0.1)" : "rgba(255,255,255,0.02)",
          border: `1px dashed ${dragging ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: 12, cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        <UploadCloudIcon size={20} active={dragging} />
        <span style={{ fontSize: 13, color: dragging ? "#a78bfa" : C.textMuted }}>
          Drop a PDF here or{" "}
          <span style={{ color: "#a78bfa", fontWeight: 600 }}>browse files</span>
        </span>
        <input ref={fileInputRef} type="file" accept=".pdf" onChange={onInputChange} style={{ display: "none" }} />
      </div>
    );
  }

  /* ── UPLOAD IN PROGRESS STATE ── */
  if (uploading) {
    const isProcessing = uploadPhase === "processing";
    const isDone       = uploadProgress === 100;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(124,58,237,0.2)",
          borderRadius: 20,
          padding: "32px 28px",
          textAlign: "center",
        }}
      >
        {/* Animated icon */}
        <div style={{ position: "relative", width: 72, height: 72, margin: "0 auto 20px" }}>
          <motion.div
            animate={{ rotate: isDone ? 0 : 360 }}
            transition={{ duration: 1.6, repeat: isDone ? 0 : Infinity, ease: "linear" }}
            style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: `conic-gradient(${isProcessing ? "#06b6d4" : "#7c3aed"} ${uploadProgress * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
            }}
          />
          <div style={{
            position: "absolute", inset: 4, borderRadius: "50%",
            background: "#07071a",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {isDone ? (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} style={{ fontSize: 22 }}>✓</motion.span>
            ) : (
              <PdfFileIcon size={24} />
            )}
          </div>
        </div>

        <p style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f8", margin: "0 0 4px" }}>
          {isDone ? "Upload complete!" : isProcessing ? "Processing document…" : "Uploading PDF…"}
        </p>
        <p style={{
          fontSize: 12, color: C.textMuted, margin: "0 0 20px",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          maxWidth: 300, marginLeft: "auto", marginRight: "auto",
        }}>
          {uploadFileName || "your file"}
        </p>

        {/* Progress bar */}
        <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden", margin: "0 auto", maxWidth: 280 }}>
          <motion.div
            animate={{ width: `${uploadProgress}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{
              height: "100%", borderRadius: 99,
              background: isDone
                ? "linear-gradient(90deg,#22c55e,#4ade80)"
                : isProcessing
                ? "linear-gradient(90deg,#06b6d4,#7c3aed)"
                : "linear-gradient(90deg,#7c3aed,#a78bfa)",
              boxShadow: isDone
                ? "0 0 10px rgba(74,222,128,0.5)"
                : isProcessing
                ? "0 0 10px rgba(6,182,212,0.5)"
                : "0 0 10px rgba(124,58,237,0.5)",
            }}
          />
        </div>

        <p style={{ fontSize: 11, color: "rgba(140,140,180,0.5)", margin: "10px 0 0" }}>
          {isProcessing
            ? "Extracting text & generating AI embeddings…"
            : isDone
            ? "Generating AI embeddings ✓"
            : "Uploading to secure storage…"}
        </p>
      </motion.div>
    );
  }

  /* ── LIMIT HIT STATE ── */
  if (pdfLimitHit) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{
          background: "rgba(239,68,68,0.05)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 20, padding: "32px 28px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 14 }}>🔒</div>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#fca5a5", margin: "0 0 6px" }}>PDF limit reached</p>
        <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 20px", lineHeight: 1.6 }}>
          Free plan supports up to 3 PDFs. Upgrade to Pro for unlimited uploads.
        </p>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={onUpgradeClick}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", fontSize: 13, fontWeight: 700, border: "none", borderRadius: 12, cursor: "pointer", boxShadow: "0 4px 20px rgba(124,58,237,0.4)" }}
        >
          👑 Upgrade to Pro
        </motion.button>
      </motion.div>
    );
  }

  /* ── DEFAULT IDLE STATE ── */
  return (
    <div>
      {/* Error banner */}
      <AnimatePresence>
        {dragError && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              marginBottom: 12, padding: "10px 16px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 12, fontSize: 13, color: "#fca5a5",
              overflow: "hidden",
            }}
          >
            ⚠️ {dragError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drop zone */}
      <motion.div
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        animate={{
          borderColor: dragging ? "rgba(124,58,237,0.7)" : "rgba(255,255,255,0.1)",
          background:  dragging ? "rgba(124,58,237,0.07)" : "rgba(255,255,255,0.02)",
          boxShadow:   dragging ? "0 0 0 4px rgba(124,58,237,0.12), inset 0 0 40px rgba(124,58,237,0.05)" : "none",
        }}
        transition={{ duration: 0.2 }}
        style={{
          border: "2px dashed rgba(255,255,255,0.1)",
          borderRadius: 20,
          padding: "48px 28px",
          textAlign: "center",
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient glow on drag */}
        <AnimatePresence>
          {dragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background: "radial-gradient(circle at 50% 50%, rgba(124,58,237,0.1) 0%, transparent 70%)",
              }}
            />
          )}
        </AnimatePresence>

        {/* Icon */}
        <motion.div
          animate={{ y: dragging ? -8 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{
            width: 80, height: 80, borderRadius: 22,
            background: dragging
              ? "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(79,70,229,0.2))"
              : "rgba(255,255,255,0.04)",
            border: `1px solid ${dragging ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.08)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: dragging ? "0 12px 36px rgba(124,58,237,0.3)" : "none",
            transition: "all 0.2s",
          }}
        >
          <UploadCloudIcon size={36} active={dragging} />
        </motion.div>

        <p style={{ fontSize: 18, fontWeight: 800, color: dragging ? "#c4b5fd" : "#f0f0f8", margin: "0 0 8px", letterSpacing: "-0.3px" }}>
          {dragging ? "Drop to upload" : "Upload your PDF"}
        </p>
        <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 24px", lineHeight: 1.6 }}>
          {dragging ? "Release to start uploading" : (
            <>Drag & drop here, or{" "}<span style={{ color: "#a78bfa", fontWeight: 600 }}>browse files</span></>
          )}
        </p>

        {/* Accepted formats */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { icon: "📄", label: "PDF files" },
            { icon: "⚡", label: "Instant processing" },
            { icon: "🔒", label: "Encrypted upload" },
          ].map((item) => (
            <span key={item.label} style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: 11, color: C.textMuted,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 99, padding: "4px 10px",
            }}>
              <span>{item.icon}</span> {item.label}
            </span>
          ))}
        </div>

        <p style={{ fontSize: 11, color: "rgba(140,140,180,0.35)", margin: "16px 0 0" }}>
          {plan === "pro" ? "Up to 50 MB per file" : "Up to 5 MB · Upgrade Pro for 50 MB"}
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={onInputChange}
          style={{ display: "none" }}
        />
      </motion.div>
    </div>
  );
}
