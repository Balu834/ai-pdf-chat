"use client";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

export default function HeroMockup() {
  return (
    <div className="hm-root">
      {/* Glow orb */}
      <div className="hm-glow" aria-hidden="true" />

      {/* Main card */}
      <motion.div
        className="hm-card"
        initial={{ opacity: 0, y: 48, scale: 0.96 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        transition={{ duration: 0.9, delay: 0.25, ease }}
      >
        {/* Chrome bar */}
        <div className="hm-chrome">
          <div className="hm-dots">
            <span className="hm-dot" style={{ background: "#ff5f57" }} />
            <span className="hm-dot" style={{ background: "#febc2e" }} />
            <span className="hm-dot" style={{ background: "#28c840" }} />
          </div>
          <div className="hm-url">intellixy.com / Q3_Report.pdf</div>
        </div>

        {/* PDF strip */}
        <div className="hm-pdf-strip">
          <div className="hm-pdf-icon">📄</div>
          <div className="hm-pdf-info">
            <div className="hm-pdf-name">Q3_Financial_Report.pdf</div>
            <div className="hm-pdf-meta">42 pages · indexed in 1.2s</div>
          </div>
          <div className="hm-pdf-badge">Ready</div>
        </div>

        {/* Chat messages */}
        <div className="hm-messages">
          <div className="hm-msg-user">What were the key revenue drivers?</div>

          <div className="hm-msg-ai">
            <div className="hm-ai-header">
              <div className="hm-ai-dot" />
              <span className="hm-ai-name">Intellixy</span>
            </div>
            <div className="hm-ai-text">
              Q3 revenue reached{" "}
              <mark className="hm-mark">₹423.7 crore</mark>, up <mark className="hm-mark">23.4% YoY</mark>.
              Key drivers:
            </div>
            <ul className="hm-ai-list">
              <li>Enterprise segment — <mark className="hm-mark">68.2%</mark> of total revenue</li>
              <li>Customer retention hit <mark className="hm-mark">94.7%</mark> (all-time high)</li>
            </ul>
            <div className="hm-citation">
              <span>📎</span>
              <span>p.14, §3.2 · chart 3.2.1 · p.22</span>
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div className="hm-input-row">
          <div className="hm-input-placeholder">Ask anything about this document…</div>
          <button className="hm-send" aria-label="Send">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M13 1L1 7l4 2m8-8L7 13l-2-4m8-8L5 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </motion.div>

      {/* Badge — AI speed */}
      <motion.div
        className="hm-badge hm-badge-speed"
        initial={{ opacity: 0, x: -24, y: 8 }}
        animate={{ opacity: 1, x: 0,   y: 0 }}
        transition={{ duration: 0.6, delay: 0.9, ease }}
      >
        <div className="hm-pulse-ring">
          <div className="hm-pulse-dot" />
        </div>
        <div>
          <div className="hm-badge-val">0.3s</div>
          <div className="hm-badge-lbl">Avg. answer time</div>
        </div>
      </motion.div>

      {/* Badge — citation accuracy */}
      <motion.div
        className="hm-badge hm-badge-acc"
        initial={{ opacity: 0, x: 24, y: 8 }}
        animate={{ opacity: 1, x: 0,  y: 0 }}
        transition={{ duration: 0.6, delay: 1.05, ease }}
      >
        <div className="hm-check-icon">✓</div>
        <div>
          <div className="hm-badge-val">98%</div>
          <div className="hm-badge-lbl">Citation accuracy</div>
        </div>
      </motion.div>

      {/* Badge — users */}
      <motion.div
        className="hm-badge hm-badge-users"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.6, delay: 1.2, ease }}
      >
        <div className="hm-avatars">
          {["#c96b36","#6366f1","#10b981","#f59e0b"].map((c, i) => (
            <div key={i} className="hm-avatar" style={{ background: c, zIndex: 4 - i }} />
          ))}
        </div>
        <span className="hm-users-text">1,200+ teams</span>
      </motion.div>
    </div>
  );
}
