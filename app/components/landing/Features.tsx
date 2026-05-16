"use client";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const PDF_SM = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z"/>
    <polyline points="15 3 15 9 21 9"/>
  </svg>
);

const CHECK_SVG = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const RELATED = [
  { section: "7.1 Confidentiality",   page: "p.18" },
  { section: "9.4 Termination",       page: "p.33" },
  { section: "11.2 Indemnification",  page: "p.41" },
];

const panel = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function Features() {
  return (
    <section className="lp-features-section" id="features">
      <div className="lp-features-inner">
        <div className="lp-feat-two-col">

          {/* Left: text */}
          <motion.div
            className="lp-feat-copy"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="lp-feat-eyebrow">Built for professionals</p>
            <h2 className="lp-feat-title">AI that understands complex documents</h2>
            <p className="lp-feat-desc">
              From financial reports to legal contracts, research papers to policy docs — Intellixy understands it all.
            </p>
            <a href="#demo" className="lp-feat-cta">
              Explore use cases <ArrowRight size={14} strokeWidth={2.5} />
            </a>
          </motion.div>

          {/* Right: 3 document analysis panels */}
          <motion.div
            className="lp-feat-panels-wrap"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
          >

            {/* Panel 1: Contract Review */}
            <motion.div className="lp-feat-doc-card" variants={panel}>
              <div className="lp-feat-contract-hdr">Contract Review</div>
              <div className="lp-feat-risk-row">
                <div className="lp-feat-risk-icon">{CHECK_SVG}</div>
                <span className="lp-feat-risk-label">Low Risk</span>
                <span className="lp-feat-risk-score">16 / 100</span>
              </div>
              <div className="lp-feat-stat-row">
                <div className="lp-feat-stat-item">
                  <span className="lp-feat-stat-label">Clauses Analyzed</span>
                  <strong className="lp-feat-stat-val">128</strong>
                </div>
                <div className="lp-feat-stat-item">
                  <span className="lp-feat-stat-label">Issues Found</span>
                  <strong className="lp-feat-stat-val">3</strong>
                </div>
              </div>
              <button className="lp-feat-view-btn">View full report →</button>
            </motion.div>

            {/* Panel 2: Document Viewer */}
            <motion.div className="lp-feat-doc-card" variants={panel}>
              <div className="lp-feat-viewer-filename">
                {PDF_SM}
                <span>Master Services Agreement.pdf</span>
              </div>
              <div className="lp-feat-viewer-meta">Page 24 of 58</div>
              <div className="lp-feat-viewer-body">
                <div className="lp-feat-clause-hdr">8.2 Limitation of Liability</div>
                <p className="lp-feat-clause-text">Neither party shall be liable for any indirect, special, consequential, or punitive damages, including loss of profits or data...</p>
                <span className="lp-feat-tag lp-feat-tag-low">LOW RISK</span>
                <div className="lp-feat-clause-divider" />
                <div className="lp-feat-clause-hdr">8.3 Data Protection</div>
                <p className="lp-feat-clause-text">Parties must comply with applicable data protection laws and regulations...</p>
                <span className="lp-feat-tag lp-feat-tag-low">LOW RISK</span>
              </div>
            </motion.div>

            {/* Panel 3: AI Suggestion */}
            <motion.div className="lp-feat-doc-card" variants={panel}>
              <div className="lp-feat-ai-hdr">AI Suggestion</div>
              <p className="lp-feat-ai-text">
                Consider adding a cap on liability to reduce potential financial exposure.
              </p>
              <button className="lp-feat-apply-btn">
                Apply suggestion <ArrowRight size={11} strokeWidth={2.5} />
              </button>
              <div className="lp-feat-related-hdr">Related Sections</div>
              <div>
                {RELATED.map((r, i) => (
                  <div key={i} className="lp-feat-related-item">
                    <span>{r.section}</span>
                    <span className="lp-feat-related-page">{r.page}</span>
                  </div>
                ))}
              </div>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}
