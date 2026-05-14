"use client";
import { motion } from "framer-motion";
import { FileText, MessageCircle, LayoutDashboard } from "lucide-react";

export default function Showcase() {
  return (
    <section className="lp-showcase-section">
      <div className="lp-showcase-inner">
        <motion.div
          className="lp-section-head"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="lp-section-eyebrow">Product</p>
          <h2 className="lp-section-title">Your entire library, always searchable</h2>
          <p className="lp-section-sub">
            Upload once. Ask forever. Every answer traces back to the source.
          </p>
        </motion.div>

        <motion.div
          className="lp-showcase-browser"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Chrome bar */}
          <div className="lp-showcase-chrome">
            <div className="lp-showcase-dots" aria-hidden>
              <span className="lp-showcase-dot" style={{ background: "#ff5f57" }} />
              <span className="lp-showcase-dot" style={{ background: "#febc2e" }} />
              <span className="lp-showcase-dot" style={{ background: "#28c840" }} />
            </div>
            <div className="lp-showcase-url">app.intellixy.com/dashboard</div>
          </div>

          {/* Body */}
          <div className="lp-showcase-body">
            {/* Sidebar */}
            <div className="lp-showcase-sidebar" aria-hidden>
              <div className="lp-showcase-nav-item active">
                <LayoutDashboard size={13} /> Overview
              </div>
              <div className="lp-showcase-nav-item">
                <FileText size={13} /> Documents
              </div>
              <div className="lp-showcase-nav-item">
                <MessageCircle size={13} /> Conversations
              </div>
            </div>

            {/* PDF panel */}
            <div className="lp-showcase-pdf" aria-hidden>
              <div className="lp-showcase-pdf-title">Q3 Financial Report.pdf · p.14 · §3.2</div>
              {[92,78,85,70].map((w, i) => (
                <div key={i} className="lp-showcase-pdf-line" style={{ width: `${w}%` }} />
              ))}
              <div className="lp-showcase-pdf-line hl" />
              <div className="lp-showcase-pdf-line hl" style={{ width: "88%" }} />
              <div className="lp-showcase-pdf-line hl sm" />
              {[65,80,55,72].map((w, i) => (
                <div key={i} className="lp-showcase-pdf-line" style={{ width: `${w}%` }} />
              ))}
            </div>

            {/* Chat panel */}
            <div className="lp-showcase-chat">
              <div className="lp-showcase-msg-user">What were the key risks in Q3?</div>
              <div className="lp-showcase-msg-ai">
                Three main risks identified: (1) currency exposure to USD (22%), (2) client
                concentration — top 5 = 34% of revenue, (3) pending DPDPA compliance review.
                <div className="lp-showcase-cite">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z"/>
                  </svg>
                  p.31, §6.1 · p.38 App. C
                </div>
              </div>
              <div className="lp-showcase-input">Ask a follow-up question…</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
