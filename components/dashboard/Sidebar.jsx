"use client";

import { motion } from "framer-motion";
import { C, timeAgo } from "./tokens";
import { PlusIcon, LogoutIcon, TrashIcon, CrownIcon, PdfIcon, HomeIcon, FilesIcon, ChatNavIcon, BillingNavIcon, SettingsNavIcon } from "./icons";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", Icon: HomeIcon },
  { id: "pdfs",      label: "My PDFs",   Icon: FilesIcon },
  { id: "chat",      label: "Chat",       Icon: ChatNavIcon },
  { id: "billing",   label: "Billing",    Icon: BillingNavIcon },
  { id: "settings",  label: "Settings",   Icon: SettingsNavIcon },
];
import { SidebarSkeleton } from "./Shimmer";

export default function Sidebar({ user, plan, docs, docsLoading, selectedDoc, view, usage, uploading, onViewChange, onSignOut, onSelectDoc, onDelete, onUploadClick, onUpgradeClick }) {
  const userEmail = user?.email || "";
  const userInitial = userEmail.charAt(0).toUpperCase();
  const pdfLimitHit = plan !== "pro" && usage.pdfs >= usage.maxPdfs;

  return (
    <aside className="sidebar" style={{ width: 240, background: C.sidebar, backdropFilter: "blur(24px)", borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", flexShrink: 0, position: "relative", zIndex: 1 }}>

      {/* Logo row */}
      <div style={{ height: 58, display: "flex", alignItems: "center", gap: 10, padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(124,58,237,0.5)", flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: "white" }}>I</span>
        </div>
        <span style={{ fontSize: 16, fontWeight: 800, color: C.textPrimary, letterSpacing: "-0.3px" }}>Intellixy</span>
        {plan === "pro" && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700, color: C.gold, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", padding: "3px 8px", borderRadius: 99, marginLeft: "auto", flexShrink: 0 }}>
            <CrownIcon /> PRO
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ padding: "10px 8px 0", flexShrink: 0 }}>
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = view === id;
          return (
            <motion.button key={id}
              whileTap={{ scale: 0.97 }}
              onClick={() => onViewChange(id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", marginBottom: 2, borderRadius: 9, fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? C.accentLight : C.textMuted, background: isActive ? "rgba(124,58,237,0.12)" : "transparent", border: isActive ? "1px solid rgba(124,58,237,0.22)" : "1px solid transparent", cursor: "pointer", textAlign: "left", transition: "all 0.15s", backdropFilter: isActive ? "blur(8px)" : "none" }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = C.textSecondary; } }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textMuted; } }}
            >
              <span style={{ flexShrink: 0 }}><Icon /></span>
              {label}
              {id === "chat" && selectedDoc && (
                <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, color: C.accentLight, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)", padding: "2px 6px", borderRadius: 99, flexShrink: 0 }}>Active</span>
              )}
            </motion.button>
          );
        })}
      </nav>

      <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "10px 12px 8px" }} />

      {/* Upload button */}
      <div style={{ padding: "0 8px 6px", flexShrink: 0 }}>
        <motion.button
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={pdfLimitHit ? onUpgradeClick : onUploadClick}
          disabled={uploading}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px 14px", fontSize: 12, fontWeight: 600, color: "white", background: pdfLimitHit ? "rgba(239,68,68,0.1)" : "linear-gradient(135deg,rgba(124,58,237,0.65),rgba(79,70,229,0.6))", border: pdfLimitHit ? "1px solid rgba(239,68,68,0.22)" : "1px solid rgba(124,58,237,0.3)", borderRadius: 9, cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.7 : 1, backdropFilter: "blur(8px)" }}
        >
          {uploading
            ? <><div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Uploading…</>
            : pdfLimitHit ? <><span>🔒</span> PDF limit reached</>
            : <><PlusIcon /> New PDF</>
          }
        </motion.button>
      </div>

      {/* PDF list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 4px" }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "2px 4px 6px", paddingLeft: 4 }}>Recent PDFs</p>
        {docsLoading ? (
          <SidebarSkeleton />
        ) : docs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 12px" }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>📂</div>
            <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>No PDFs yet</p>
          </div>
        ) : (
          docs.map((doc) => {
            const isSel = selectedDoc?.id === doc.id;
            return (
              <motion.div key={doc.id} layout onClick={() => onSelectDoc(doc)}
                style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px", borderRadius: 9, cursor: "pointer", marginBottom: 2, background: isSel ? "rgba(124,58,237,0.14)" : "transparent", border: isSel ? "1px solid rgba(124,58,237,0.24)" : "1px solid transparent", transition: "all 0.15s" }}
                whileHover={{ backgroundColor: isSel ? undefined : "rgba(255,255,255,0.04)" }}
              >
                <span style={{ color: isSel ? C.accentLight : C.textMuted, marginTop: 1, flexShrink: 0 }}><PdfIcon /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: isSel ? "#e2d9f7" : C.textSecondary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.file_name}</p>
                  <p style={{ fontSize: 10, color: C.textMuted, margin: "2px 0 0" }}>{timeAgo(doc.created_at)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(doc); }}
                  title={plan !== "pro" ? "Pro feature — upgrade to delete" : `Delete ${doc.file_name}`}
                  style={{ background: "none", border: "none", cursor: "pointer", color: plan !== "pro" ? C.textMuted : C.danger, padding: 2, borderRadius: 5, opacity: 0, transition: "opacity 0.15s", fontSize: plan !== "pro" ? 11 : undefined, flexShrink: 0 }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "0"}>
                  {plan !== "pro" ? "🔒" : <TrashIcon />}
                </button>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Usage bars — free users only */}
      {plan !== "pro" && (
        <div style={{ margin: "0 8px 6px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 10, backdropFilter: "blur(8px)" }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>Free Plan Usage</p>
          {[
            { label: "PDFs",      used: usage.pdfs,      max: usage.maxPdfs },
            { label: "Questions", used: usage.questions,  max: usage.maxQuestions },
          ].map(({ label, used, max }) => {
            const pct    = Math.min((used / max) * 100, 100);
            const isOut  = used >= max;
            const isHigh = !isOut && pct >= 60;
            const barColor = isOut  ? "linear-gradient(90deg,#ef4444,#dc2626)"
                           : isHigh ? "linear-gradient(90deg,#f59e0b,#ea580c)"
                           :          "linear-gradient(90deg,#7c3aed,#4f46e5)";
            const labelColor = isOut ? "#f87171" : isHigh ? "#f59e0b" : C.textMuted;
            return (
              <div key={label} style={{ marginBottom: 9 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: labelColor, fontWeight: isOut || isHigh ? 700 : 400 }}>{label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: labelColor }}>{used}/{max} used</span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }}
                    style={{ height: "100%", borderRadius: 99, background: barColor }} />
                </div>
                {isOut  && <p style={{ fontSize: 10, color: "#f87171", margin: "3px 0 0", fontWeight: 600 }}>Limit reached — upgrade to continue</p>}
                {isHigh && <p style={{ fontSize: 10, color: "#f59e0b", margin: "3px 0 0" }}>Almost full — upgrade before you run out</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "8px 10px", flexShrink: 0 }}>
        {/* Upgrade CTA — free users */}
        {plan !== "pro" && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onUpgradeClick}
            style={{ width: "100%", padding: "10px 14px", marginBottom: 8, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", border: "none", borderRadius: 10, cursor: "pointer", position: "relative", overflow: "hidden" }}
          >
            <motion.div
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
              style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)", transform: "skewX(-15deg)", pointerEvents: "none" }}
            />
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <CrownIcon />
                <span style={{ fontSize: 12, fontWeight: 800, color: "white", letterSpacing: "-0.1px" }}>Upgrade to Pro</span>
              </div>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", margin: "2px 0 0", letterSpacing: "0.01em" }}>
                Limited offer · ₹299/month
              </p>
            </div>
          </motion.button>
        )}

        {/* User row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px" }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "white", flexShrink: 0 }}>{userInitial}</div>
          <p style={{ fontSize: 11, color: C.textMuted, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{userEmail}</p>
          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={onSignOut} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 4, borderRadius: 6 }}>
            <LogoutIcon />
          </motion.button>
        </div>
      </div>
    </aside>
  );
}
