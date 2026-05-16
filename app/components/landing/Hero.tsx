"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Zap, CreditCard } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

const LOGO_SVG = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
    <rect x="3"  y="3"  width="8" height="11" rx="1.5" fill="currentColor" opacity=".9"/>
    <rect x="13" y="3"  width="8" height="5"  rx="1.5" fill="currentColor" opacity=".5"/>
    <rect x="13" y="10" width="8" height="11" rx="1.5" fill="currentColor" opacity=".7"/>
    <rect x="3"  y="16" width="8" height="5"  rx="1.5" fill="currentColor" opacity=".4"/>
  </svg>
);

const PDF_SM = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z"/>
    <polyline points="15 3 15 9 21 9"/>
  </svg>
);

const BAR_HEIGHTS = [5, 8, 6, 11, 7, 9, 13, 8, 11, 7];

const SOURCES = [
  { name: "Q3 Financial Report.pdf",        pages: "24 pages" },
  { name: "Earnings Call Transcript.pdf",   pages: "18 pages" },
  { name: "Investor Presentation.pdf",      pages: "32 pages" },
];

const FINDINGS = [
  { text: "Revenue grew 23.4% YoY",         page: "p.14" },
  { text: "Operating expenses down 8.7%",   page: "p.22" },
  { text: "Strong cash flow increase",      page: "p.31" },
];

export default function Hero() {
  return (
    <section className="lp-hero">
      <div className="lp-hero-inner">

        {/* ── LEFT: Copy ─────────────────────────────────────────────── */}
        <motion.div
          className="lp-hero-copy"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease }}
        >
          <div className="lp-hero-eyebrow">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
            AI Document Intelligence
          </div>

          <h1 className="lp-hero-h1">
            Stop reading.<br />
            <span className="lp-hero-h1-accent">Start understanding.</span>
          </h1>

          <p className="lp-hero-sub">
            Upload any document. Ask in plain English. Intellixy returns exact, cited answers in seconds — with page and section references you can verify instantly. No hallucinations. No guessing.
          </p>

          <div className="lp-hero-actions">
            <Link href="/login" className="lp-hero-cta-primary">
              Start for free <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
            <a href="#demo" className="lp-hero-cta-ghost">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M10 8l6 4-6 4V8z" fill="currentColor"/>
              </svg>
              See live demo
            </a>
          </div>

          <div className="lp-hero-trust">
            <div className="lp-hero-trust-item">
              <Zap size={13} strokeWidth={2} />
              Answers in 3.4s avg
            </div>
            <div className="lp-hero-trust-sep" />
            <div className="lp-hero-trust-item">
              <Shield size={13} strokeWidth={2} />
              End-to-end encrypted
            </div>
            <div className="lp-hero-trust-sep" />
            <div className="lp-hero-trust-item">
              <CreditCard size={13} strokeWidth={2} />
              No credit card required
            </div>
          </div>
        </motion.div>

        {/* ── RIGHT: Multi-panel AI mockup ─────────────────────────── */}
        <motion.div
          className="lp-hero-preview"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.12, ease }}
        >
          <div className="lp-mp-wrap">

            {/* Document Insights (top-left, white panel) */}
            <motion.div
              className="lp-mp-panel lp-mp-light lp-mp-insights"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.4, ease }}
            >
              <div className="lp-mp-insights-hdr">Document Insights</div>
              <div className="lp-mp-insights-val">2.4M+</div>
              <div className="lp-mp-insights-sub">Docs analyzed</div>
              <svg width="108" height="32" viewBox="0 0 108 32" fill="none" style={{marginTop: '6px', display: 'block'}}>
                <defs>
                  <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.28"/>
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <path d="M0 30 L12 26 L24 22 L36 17 L48 13 L60 9 L72 6 L84 4 L96 2 L108 1" stroke="#F59E0B" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M0 30 L12 26 L24 22 L36 17 L48 13 L60 9 L72 6 L84 4 L96 2 L108 1 L108 32 L0 32Z" fill="url(#spark-grad)"/>
              </svg>
            </motion.div>

            {/* Intellixy AI Chat (center, large, dark) */}
            <motion.div
              className="lp-mp-panel lp-mp-dark lp-mp-chat"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.55, ease }}
            >
              <div className="lp-mp-chat-hdr">
                <div className="lp-mp-chat-logo">{LOGO_SVG}</div>
                <span className="lp-mp-chat-title">Intellixy AI</span>
                <span className="lp-mp-chat-badge">PDF Pro</span>
              </div>

              <div className="lp-mp-msgs">
                <motion.div
                  className="lp-mp-msg-user"
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.62, duration: 0.28, ease }}
                >
                  What drove Q3 revenue growth?
                </motion.div>

                <motion.div
                  className="lp-mp-msg-ai"
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.74, duration: 0.28, ease }}
                >
                  <div className="lp-mp-ai-icon">{LOGO_SVG}</div>
                  <div className="lp-mp-msg-ai-body">
                    <p>Revenue reached ₹423.7 Cr (+23.4% YoY), beating consensus by 4.2pp. Enterprise contributed 68%, led by BFSI and healthcare verticals.</p>
                    <span className="lp-mp-cite">{PDF_SM} p.14 · §3.2 · chart 3.2.1</span>
                  </div>
                </motion.div>

                <motion.div
                  className="lp-mp-msg-user"
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.86, duration: 0.28, ease }}
                >
                  What are the main risks?
                </motion.div>

                <motion.div
                  className="lp-mp-msg-ai"
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.98, duration: 0.28, ease }}
                >
                  <div className="lp-mp-ai-icon">{LOGO_SVG}</div>
                  <div className="lp-mp-msg-ai-body">
                    <p>Three key risks: margin pressure (R&D ₹42 Cr), client concentration (top 5 = 34%), and 22% USD exposure.</p>
                    <span className="lp-mp-cite">{PDF_SM} p.42 · §7.1 · Annex B</span>
                  </div>
                </motion.div>
              </div>

              <div className="lp-mp-chat-input">
                <span className="lp-mp-chat-placeholder">Ask about this document…</span>
                <button className="lp-mp-send" aria-label="Send">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <line x1="12" y1="19" x2="12" y2="5"/>
                    <polyline points="5 12 12 5 19 12"/>
                  </svg>
                </button>
              </div>
            </motion.div>

            {/* Sources (top-right, white) */}
            <motion.div
              className="lp-mp-panel lp-mp-light lp-mp-sources"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.68, duration: 0.38, ease }}
            >
              <div className="lp-mp-sources-hdr">
                <span>Sources</span>
                <span className="lp-mp-sources-close" aria-hidden>×</span>
              </div>
              {SOURCES.map((s, i) => (
                <div key={i} className="lp-mp-source-item">
                  <div className="lp-mp-source-icon">{PDF_SM}</div>
                  <div>
                    <div className="lp-mp-source-name">{s.name}</div>
                    <div className="lp-mp-source-meta">{s.pages}</div>
                  </div>
                </div>
              ))}
              <button className="lp-mp-upload-btn">+ Upload more</button>
            </motion.div>

            {/* Key Findings (bottom-left, white) */}
            <motion.div
              className="lp-mp-panel lp-mp-light lp-mp-findings"
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9, duration: 0.38, ease }}
            >
              <div className="lp-mp-findings-hdr">Key findings</div>
              {FINDINGS.map((f, i) => (
                <div key={i} className="lp-mp-finding-item">
                  <span className="lp-mp-finding-dot" />
                  <span>
                    {f.text}{" "}
                    <span className="lp-mp-finding-page">· {f.page}</span>
                  </span>
                </div>
              ))}
              <a href="#demo" className="lp-mp-findings-link">View all insights →</a>
            </motion.div>

            {/* Confidence Score (bottom-right, white) */}
            <motion.div
              className="lp-mp-panel lp-mp-light lp-mp-confidence"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.02, duration: 0.38, ease }}
            >
              <div className="lp-mp-confidence-hdr">Confidence Score</div>
              <div className="lp-mp-gauge">
                <div className="lp-mp-gauge-ring">
                  <div className="lp-mp-gauge-inner">
                    <span className="lp-mp-gauge-val">98%</span>
                  </div>
                </div>
              </div>
              <div className="lp-mp-confidence-label">High confidence</div>
              <span className="lp-mp-confidence-badge">Verified</span>
            </motion.div>

            {/* Holographic glow line */}
            <div className="lp-mp-platform" aria-hidden />

          </div>
        </motion.div>

      </div>
    </section>
  );
}
