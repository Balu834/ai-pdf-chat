"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, FileText, MessageSquare, Plus } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease },
});

/* Files in the sidebar mockup */
const FILES = [
  { name: "Q3_Report.pdf",      active: true  },
  { name: "Contract_2024.pdf",  active: false },
  { name: "Research_AI.pdf",    active: false },
  { name: "Annual_Review.pdf",  active: false },
];

/* PDF line widths, hl = green highlight */
const PDF_LINES = [
  { w: "100%", hl: false }, { w: "86%",  hl: false },
  { w: "100%", hl: true  }, { w: "93%",  hl: true  },
  { w: "70%",  hl: true  }, { w: "100%", hl: false },
  { w: "82%",  hl: false }, { w: "100%", hl: false },
  { w: "55%",  hl: false }, { w: "100%", hl: true  },
  { w: "88%",  hl: true  }, { w: "100%", hl: false },
];

export default function Hero() {
  return (
    <section className="lp-hero">
      <div className="lp-hero-inner">

        {/* ── Left: Compact copy ───────────────────────────────────────────── */}
        <div className="lp-hero-copy">
          <motion.div {...fadeUp(0)}>
            <div className="lp-hero-eyebrow">
              <span className="lp-hero-eyebrow-dot" />
              AI Document Intelligence
            </div>
          </motion.div>

          <motion.h1 className="lp-hero-h1" {...fadeUp(0.07)}>
            Understand PDFs<br />with AI.
          </motion.h1>

          <motion.p className="lp-hero-sub" {...fadeUp(0.13)}>
            Upload documents, ask questions, generate summaries,
            and extract insights — instantly.
          </motion.p>

          <motion.div
            className="lp-hero-input-box"
            {...fadeUp(0.18)}
            role="button"
            tabIndex={0}
          >
            <Sparkles size={14} className="lp-hero-input-icon" strokeWidth={1.75} />
            <span className="lp-hero-input-placeholder">
              Ask anything about your document…
            </span>
            <div className="lp-hero-input-send" aria-hidden>
              <ArrowRight size={13} strokeWidth={2.5} />
            </div>
          </motion.div>

          <motion.div className="lp-hero-actions" {...fadeUp(0.23)}>
            <Link href="/login" className="lp-hero-cta">
              Start Free <ArrowRight size={13} strokeWidth={2.5} />
            </Link>
            <a href="#demo" className="lp-hero-cta-outline">
              Watch demo
            </a>
          </motion.div>

          <motion.p className="lp-hero-microtrust" {...fadeUp(0.28)}>
            No credit card · Free plan · Cancel anytime
          </motion.p>
        </div>

        {/* ── Right: AI Workspace ──────────────────────────────────────────── */}
        <motion.div
          className="lp-hero-workspace"
          initial={{ opacity: 0, scale: 0.97, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.15, ease }}
        >
          <div className="lp-ws">
            {/* Browser chrome */}
            <div className="lp-ws-chrome">
              <div className="lp-ws-dots">
                <div className="lp-ws-dot" style={{ background: "#FF5F57" }} />
                <div className="lp-ws-dot" style={{ background: "#FEBC2E" }} />
                <div className="lp-ws-dot" style={{ background: "#28C840" }} />
              </div>
              <div className="lp-ws-url">app.intellixy.com/viewer</div>
            </div>

            {/* 3-panel body */}
            <div className="lp-ws-body">

              {/* Sidebar */}
              <div className="lp-ws-sidebar">
                <div className="lp-ws-sidebar-head">Docs</div>
                {FILES.map(f => (
                  <div key={f.name} className={`lp-ws-file${f.active ? " active" : ""}`}>
                    <FileText size={9} strokeWidth={2} />
                    {f.name}
                  </div>
                ))}
                <hr className="lp-ws-sidebar-sep" />
                <div className="lp-ws-upload">
                  <Plus size={9} strokeWidth={2.5} /> Upload
                </div>
              </div>

              {/* PDF panel */}
              <div className="lp-ws-pdf">
                <div className="lp-ws-pdf-title">Q3_Report · Page 14 · §3.2</div>
                <div className="lp-ws-pdf-lines">
                  {PDF_LINES.map((l, i) => (
                    <div
                      key={i}
                      className={`lp-ws-pdf-line${l.hl ? " hl" : ""}`}
                      style={{ width: l.w }}
                    />
                  ))}
                </div>
              </div>

              {/* Chat panel */}
              <div className="lp-ws-chat">
                <div className="lp-ws-chat-head">
                  <MessageSquare size={8} strokeWidth={2} style={{ display: "inline", marginRight: 3 }} />
                  AI Assistant
                </div>

                <div className="lp-ws-msg-user">
                  What drove Q3 revenue growth?
                </div>

                <div className="lp-ws-msg-ai">
                  Revenue reached <mark>₹423.7 Cr</mark>, a{" "}
                  <mark>23.4% YoY</mark> increase. Enterprise drove 68%.
                  <div className="lp-ws-cite">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z"/>
                    </svg>
                    p.14 · §3.2
                  </div>
                </div>

                <div className="lp-ws-typing">
                  <span /><span /><span />
                </div>

                <div className="lp-ws-input-bar">
                  <span className="lp-ws-input-text">Ask a follow-up…</span>
                  <div className="lp-ws-send" aria-hidden>
                    <ArrowRight size={10} strokeWidth={2.5} />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
