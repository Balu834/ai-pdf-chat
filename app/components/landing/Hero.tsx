"use client";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="lp-hero">
      <div className="lp-hero-inner">

        {/* ── Left: text ──────────────────────────────────────────────── */}
        <div>
          <div className="lp-hero-badge">
            <span className="lp-hero-badge-dot" />
            AI-powered document intelligence
          </div>

          <h1 className="lp-hero-h1">
            Chat with any<br /><em>PDF instantly.</em>
          </h1>

          <p className="lp-hero-sub">
            Upload any document and get cited AI answers in seconds.
            No skimming, no guessing, no hallucinations.
          </p>

          <div className="lp-hero-actions">
            <Link href="/login" className="lp-btn-green lp-btn-lg">
              Start free — no card needed
            </Link>
            <a href="#demo" className="lp-btn-lg-outline">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="10 8 16 12 10 16 10 8"/>
              </svg>
              See it in action
            </a>
          </div>

          <div className="lp-hero-trust">
            <div className="lp-hero-avs" aria-hidden>
              {["A","B","C","D"].map(l => (
                <div key={l} className="lp-hero-av">{l}</div>
              ))}
            </div>
            <p className="lp-hero-trust-text">
              <strong>1,200+ professionals</strong> use Intellixy daily
            </p>
          </div>
        </div>

        {/* ── Right: floating mockup ───────────────────────────────────── */}
        <div className="lp-hero-visual">
          <div className="lp-hm">
            {/* Browser chrome */}
            <div className="lp-hm-chrome">
              <div className="lp-hm-dots" aria-hidden>
                <span className="lp-hm-dot" style={{ background: "#ff5f57" }} />
                <span className="lp-hm-dot" style={{ background: "#febc2e" }} />
                <span className="lp-hm-dot" style={{ background: "#28c840" }} />
              </div>
              <div className="lp-hm-url">app.intellixy.com/chat/q3-report</div>
            </div>

            {/* Two-pane */}
            <div className="lp-hm-panels">
              {/* PDF pane */}
              <div className="lp-hm-pdf">
                <div className="lp-hm-pdf-hdr">Q3 Financial Report · p.14 · §3.2</div>
                <p className="lp-hm-pdf-para">
                  The consolidated revenue for Q3 FY2024 reached{" "}
                  <mark className="lp-hm-mark">₹423.7 crore</mark>, representing a
                  year-on-year growth of <mark className="lp-hm-mark">23.4%</mark>.
                  This exceeded analyst consensus by 4.2 pp.{" "}
                  <span className="lp-hm-pill">p.14</span>
                </p>
                <p className="lp-hm-pdf-para">
                  Enterprise segment revenues surged to{" "}
                  <mark className="lp-hm-mark">₹289 crore</mark>, comprising 68.2%
                  of total revenue.{" "}
                  <span className="lp-hm-pill">chart 3.2.1</span>
                </p>
              </div>

              {/* Chat pane */}
              <div className="lp-hm-chat">
                <div className="lp-hm-chat-user">What was Q3 revenue vs Q2?</div>
                <div className="lp-hm-chat-ai">
                  Q3 revenue was <mark>₹423.7 Cr</mark> — up{" "}
                  <mark>23.4% YoY</mark> and 8.9% quarter-on-quarter.
                  <div className="lp-hm-cite">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z"/>
                    </svg>
                    p.14, §3.2 · chart 3.2.1
                  </div>
                </div>
                <div className="lp-hm-input-row">
                  <span className="lp-hm-input-text">Ask anything about this PDF…</span>
                  <div className="lp-hm-send" aria-hidden>
                    <svg width="9" height="9" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M13 1L1 7l4 2m8-8L7 13l-2-4"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating badges */}
          <div className="lp-hero-badge-float top-right">
            <span className="dot" />
            ⚡ 3.4s avg. answer
          </div>
          <div className="lp-hero-badge-float bot-left">
            <span className="dot" />
            ✓ 98% citation accuracy
          </div>
        </div>

      </div>
    </section>
  );
}
