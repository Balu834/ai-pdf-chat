"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export default function Hero() {
  return (
    <section className="lp-hero">
      <div className="lp-hero-inner">

        {/* ── Left: text ──────────────────────────────────────────────── */}
        <div>
          <motion.div {...fadeUp(0)}>
            <div className="lp-hero-badge">
              <span className="lp-hero-badge-dot" />
              AI-Powered Document Intelligence
            </div>
          </motion.div>

          <motion.h1 className="lp-hero-h1" {...fadeUp(0.08)}>
            Chat with any<br /><em>PDF instantly.</em>
          </motion.h1>

          <motion.p className="lp-hero-sub" {...fadeUp(0.15)}>
            Upload documents and get accurate AI answers in seconds —
            no hallucinations, no guessing.
          </motion.p>

          <motion.div className="lp-hero-actions" {...fadeUp(0.22)}>
            <Link href="/login" className="lp-btn-green lp-btn-lg">
              Upload your first PDF
            </Link>
            <a href="#demo" className="lp-btn-lg-outline">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <circle cx="12" cy="12" r="10"/>
                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/>
              </svg>
              Watch Demo
            </a>
          </motion.div>

          <motion.div className="lp-hero-trust" {...fadeUp(0.28)}>
            <div className="lp-hero-avs" aria-hidden>
              {["A","R","P","S","M"].map((l, i) => (
                <div key={i} className="lp-hero-av" style={{ background: ["#d1fae5","#dbeafe","#fce7f3","#fef3c7","#f3e8ff"][i] }}>
                  {l}
                </div>
              ))}
            </div>
            <p className="lp-hero-trust-text">
              <strong>1,200+ professionals</strong> trust Intellixy daily
            </p>
          </motion.div>
        </div>

        {/* ── Right: chat card ────────────────────────────────────────── */}
        <motion.div
          className="lp-hero-visual"
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="lp-chat-card">
            {/* Header */}
            <div className="lp-chat-card-hdr">
              <div className="lp-chat-card-dots" aria-hidden>
                <span className="lp-chat-card-dot" style={{ background: "#ff5f57" }} />
                <span className="lp-chat-card-dot" style={{ background: "#febc2e" }} />
                <span className="lp-chat-card-dot" style={{ background: "#28c840" }} />
              </div>
              <div className="lp-chat-card-file">
                <FileText size={13} className="lp-chat-card-file-icon" />
                Q3_Financial_Report.pdf · 42 pages
              </div>
            </div>

            {/* Messages */}
            <div className="lp-chat-card-msgs">
              <div className="lp-chat-user-msg">
                What was Q3 revenue compared to Q2?
              </div>

              <div className="lp-chat-ai-row">
                <div className="lp-chat-ai-label">
                  <div className="lp-chat-ai-avatar" aria-hidden>AI</div>
                  Intellixy AI
                </div>
                <div className="lp-chat-ai-bubble">
                  Q3 FY24 revenue reached{" "}
                  <mark>₹423.7 crore</mark>, a{" "}
                  <mark>23.4% YoY increase</mark> and 8.9% quarter-on-quarter
                  growth. Enterprise segment drove 68.2% of total revenue.
                </div>
                <div className="lp-chat-cite-row">
                  <span className="lp-chat-cite-pill">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z"/>
                    </svg>
                    p.14, §3.2
                  </span>
                  <span className="lp-chat-cite-pill">chart 3.2.1</span>
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="lp-chat-input-row">
              <span className="lp-chat-input-placeholder">Ask anything about this PDF…</span>
              <div className="lp-chat-send-btn" aria-hidden>
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 1L1 7l4 2m8-8L7 13l-2-4"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Floating badges */}
          <div className="lp-hero-float-badge tl">
            <span className="badge-dot" />⚡ 3.4s avg. answer
          </div>
          <div className="lp-hero-float-badge br">
            <span className="badge-dot" />✓ 98% citation accuracy
          </div>
        </motion.div>

      </div>
    </section>
  );
}
