import type { Metadata } from "next";
import Link from "next/link";
import "./landing.css";
import MastheadDate from "@/app/components/landing/MastheadDate";
import LandingAnimations from "@/app/components/landing/LandingAnimations";
import FaqAccordion from "@/app/components/landing/FaqAccordion";
import InteractiveDemo from "@/app/components/landing/InteractiveDemo";

export const metadata: Metadata = {
  title: "Intellixy — Chat with any PDF instantly",
  description:
    "Upload any PDF and get instant answers, summaries, and insights in seconds using AI. Free plan available — no credit card needed.",
};

const FORMATS = ["PDF", "DOCX", "XLSX", "PPTX", "EPUB", "LaTeX", "HTML", "OCR"];
const INTEGRATIONS = [
  "PDF", "DOCX", "XLSX", "PPTX", "EPUB", "HTML", "LaTeX",
  "Markdown", "TXT", "RTF", "ODP", "ODS", "ODT",
  "Scanned OCR", "Multi-column", "Handwritten",
];

export default function Page() {
  return (
    <div className="landing">
      <LandingAnimations />

      {/* ── 1. MASTHEAD ─────────────────────────────────────────────── */}
      <div className="l-masthead">
        <span>Intellixy Review · Vol. I</span>
        <span><MastheadDate /></span>
        <div className="l-masthead-live">
          <span className="l-live-dot" />
          <span>1,200+ active readers</span>
        </div>
      </div>

      {/* ── 2. NAV ──────────────────────────────────────────────────── */}
      <nav className="l-nav">
        <Link href="/" className="l-nav-logo">
          <div className="l-nav-logo-mark"><span>I</span></div>
          Intellixy
        </Link>
        <div className="l-nav-links">
          <a href="#features">Features</a>
          <a href="#demo">Demo</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className="l-nav-right">
          <Link href="/dashboard" className="l-nav-signin">Sign in</Link>
          <Link href="/dashboard" className="btn btn-dark btn-sm">Start free</Link>
        </div>
      </nav>

      {/* ── 3. HERO ─────────────────────────────────────────────────── */}
      <section>
        <div className="l-hero">
          <div>
            <div className="l-hero-eyebrow">
              <span className="l-hero-eyebrow-text">AI-Powered Document Intelligence</span>
            </div>
            <h1 className="l-hero-h1">
              <span className="l-hero-strike">Read</span>
              <br />
              every PDF.
              <br />
              Just{" "}
              <span className="l-hero-ask">
                ask.
                <svg
                  className="l-hero-scribble"
                  viewBox="0 0 200 16"
                  fill="none"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 11 C40 4, 80 15, 120 8 C160 1, 190 12, 198 9"
                    stroke="#b8552d"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </span>
            </h1>
            <p className="l-hero-sub">
              Upload any PDF. Ask anything. Get cited answers in seconds — no skimming required.
            </p>
            <div className="l-hero-ctas">
              <Link href="/dashboard" className="btn btn-dark">
                Upload your first PDF →
              </Link>
              <a href="#demo" className="l-hero-play">
                <span className="l-hero-play-icon">
                  <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor" aria-hidden="true">
                    <path d="M0 0l10 6-10 6V0z" />
                  </svg>
                </span>
                See the demo
              </a>
            </div>
            <p className="l-hero-trust">
              <span className="l-hero-trust-label">Trusted by</span>{" "}
              <span className="l-hero-trust-names">
                CAs · Law Students · Product Managers · Researchers
              </span>
            </p>
          </div>

          {/* Doc mockup */}
          <div className="l-hero-right">
            <div className="l-doc-wrap">
              <div className="l-doc-ann">
                <span className="l-ann l-ann-1">← try it live below!</span>
                <span className="l-ann l-ann-2">cited answers ✓</span>
              </div>
              <div className="l-bookmarks">
                <div className="l-bookmark l-bm-blue">§3</div>
                <div className="l-bookmark l-bm-green">§6</div>
                <div className="l-bookmark l-bm-pink">App</div>
              </div>
              <div className="l-doc-mockup">
                <div className="l-doc-stamp">Analysed</div>
                <div className="l-doc-hdr">
                  <div className="l-doc-title">Q3 Financial Report FY2024</div>
                  <div className="l-doc-meta">42 pages · PDF · uploaded just now</div>
                </div>
                <div className="l-doc-lines">
                  <div className="l-doc-line w90" />
                  <div className="l-doc-line hl w75" />
                  <div className="l-doc-line w85" />
                  <div className="l-doc-line w60" />
                  <div className="l-doc-line hl w95" />
                  <div className="l-doc-line w70" />
                  <div className="l-doc-line w85" />
                </div>
                <div className="l-doc-qa">
                  <div className="l-doc-q">"What was Q3 revenue vs Q2?"</div>
                  <div className="l-doc-a">
                    Q3 revenue reached <strong>₹423.7 Cr</strong>, up{" "}
                    <strong>8.9% QoQ</strong> from ₹389.1 Cr in Q2.
                    <span className="l-doc-cite">p.14 §3.2</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. NUMBERS ──────────────────────────────────────────────── */}
      <div className="l-numbers">
        <div className="l-numbers-grid">
          <div className="l-num-cell reveal">
            <div className="l-num-big">
              <span className="l-counter" data-target="1200">0</span>
              <span className="suffix">+</span>
            </div>
            <div className="l-num-label">Active users</div>
            <div className="l-num-sub">and growing daily</div>
          </div>
          <div className="l-num-cell reveal">
            <div className="l-num-big">
              <span className="l-counter" data-target="50">0</span>
              <span className="suffix">K+</span>
            </div>
            <div className="l-num-label">PDFs analysed</div>
            <div className="l-num-sub">across all sectors</div>
          </div>
          <div className="l-num-cell reveal">
            <div className="l-num-big">
              <span className="l-counter" data-target="98">0</span>
              <span className="suffix">%</span>
            </div>
            <div className="l-num-label">Citation accuracy</div>
            <div className="l-num-sub">independently audited</div>
          </div>
          <div className="l-num-cell reveal">
            <div className="l-num-big">
              0<span className="suffix">bits</span>
            </div>
            <div className="l-num-label">Data sold</div>
            <div className="l-num-sub">your docs stay yours</div>
          </div>
        </div>
      </div>

      {/* ── 5. INTERACTIVE DEMO ─────────────────────────────────────── */}
      <section className="l-demo-section" id="demo">
        <div className="l-demo-inner">
          <div className="l-demo-header reveal">
            <p className="section-label">Interactive demo</p>
            <h2>Try it — right now</h2>
          </div>
          <div className="reveal">
            <InteractiveDemo />
          </div>
        </div>
      </section>

      {/* ── 6. BENTO FEATURES ───────────────────────────────────────── */}
      <section className="l-features" id="features">
        <div className="l-features-inner">
          <div className="l-features-hdr reveal">
            <p className="section-label">What it does</p>
            <h2>Every tool you need to read smarter</h2>
          </div>
          <div className="l-bento">
            {/* Cited answers — span 2, dark */}
            <div className="l-bento-cell span2 dark reveal">
              <div className="l-bento-num">01 · Core</div>
              <div className="l-bento-title">Cited answers, not hallucinations</div>
              <div className="l-bento-body">
                Every answer is traced back to the exact page and paragraph. If we&apos;re
                not sure, we say so.
              </div>
              <div className="l-cite-flow">
                <span className="l-cite-pill">p.14 §3.2</span>
                <span className="l-cite-arr">→</span>
                <span className="l-cite-pill">chart 3.2.1</span>
                <span className="l-cite-arr">→</span>
                <span className="l-cite-pill">p.38 App C</span>
              </div>
            </div>

            {/* Speed */}
            <div className="l-bento-cell reveal">
              <div className="l-bento-num">02 · Speed</div>
              <div className="l-bento-title">Answers in seconds</div>
              <div className="l-bento-body">
                Not minutes. Our RAG pipeline returns answers faster than you can flip
                to the right page.
              </div>
              <div className="l-speed-bars">
                <div className="l-speed-row">
                  <span className="l-speed-label">Manual</span>
                  <div className="l-speed-wrap">
                    <div className="l-speed-bar human">
                      <span className="l-speed-bar-lbl">~12 min</span>
                    </div>
                  </div>
                </div>
                <div className="l-speed-row">
                  <span className="l-speed-label">Intellixy</span>
                  <div className="l-speed-wrap">
                    <div className="l-speed-bar us">
                      <span className="l-speed-bar-lbl">&lt;2s</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 120+ formats */}
            <div className="l-bento-cell reveal">
              <div className="l-bento-num">03 · Formats</div>
              <div className="l-bento-title">120+ file types</div>
              <div className="l-bento-body">
                PDFs, DOCX, XLSX, PPTX, EPUB, LaTeX, HTML — even scanned documents
                via OCR.
              </div>
              <div className="l-fmt-tags">
                {FORMATS.map((t, i) => (
                  <div key={t} className={`l-fmt-tag${i < 2 ? " accent" : ""}`}>
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Multi-language */}
            <div className="l-bento-cell reveal">
              <div className="l-bento-num">04 · Language</div>
              <div className="l-bento-title">Ask in any language</div>
              <div className="l-bento-body">
                Documents in Hindi? Contracts in French? Ask in English, get answers
                from anywhere.
              </div>
              <div className="l-lang-flow">
                <div className="l-lang-row">
                  English <span className="cu">→ answer</span>
                </div>
                <div className="l-lang-row dim">हिन्दी → answer</div>
                <div className="l-lang-row dim">Français → answer</div>
              </div>
            </div>

            {/* Privacy */}
            <div className="l-bento-cell dark reveal">
              <div className="l-bento-num">05 · Privacy</div>
              <div className="l-bento-title">End-to-end encrypted</div>
              <div className="l-bento-body">
                Documents processed in isolated environments. We never train on your
                data — ever.
              </div>
            </div>

            {/* Risk engine — span 2 */}
            <div className="l-bento-cell span2 reveal">
              <div className="l-bento-num">06 · Insight</div>
              <div className="l-bento-title">Risk &amp; insight engine</div>
              <div className="l-bento-body">
                Surface red flags, key clauses, hidden figures, and critical data
                points you&apos;d miss after hours of reading. Built for legal, finance,
                and research workflows.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="l-how" id="how">
        <div className="l-how-inner">
          <div className="l-how-hdr reveal">
            <p className="section-label">How it works</p>
            <h2>Three steps to a smarter read</h2>
          </div>
          <div className="l-how-grid">
            <div className="l-how-card reveal">
              <div className="l-how-badge">Step 01</div>
              <div className="l-how-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div className="l-how-title">Upload your document</div>
              <div className="l-how-body">
                Drag &amp; drop or browse. Any PDF up to 50 MB — processed in under
                10 seconds.
              </div>
              <div className="l-how-note">No sign-up needed for your first try.</div>
            </div>

            <div className="l-how-card reveal">
              <div className="l-how-badge">Step 02</div>
              <div className="l-how-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="l-how-title">Ask in plain English</div>
              <div className="l-how-body">
                No syntax. No keywords. Just type your question exactly as you&apos;d
                ask a colleague.
              </div>
              <div className="l-how-note">Try: &ldquo;What are the key risks?&rdquo;</div>
            </div>

            <div className="l-how-card reveal">
              <div className="l-how-badge">Step 03</div>
              <div className="l-how-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="l-how-title">Get cited answers</div>
              <div className="l-how-body">
                AI returns a precise answer with the exact source — page number,
                section, and excerpt.
              </div>
              <div className="l-how-note">Verify every claim yourself.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. TESTIMONIALS ─────────────────────────────────────────── */}
      <section className="l-testi" id="testimonials">
        <div className="l-testi-inner">
          <div className="l-testi-hdr reveal">
            <p className="section-label">What readers say</p>
            <h2>Loved by professionals who read for a living</h2>
          </div>
          <div className="l-testi-grid">
            {/* Featured dark card — spans 2 rows */}
            <div className="l-tcard dark reveal">
              <div className="l-tcard-qmark">&ldquo;</div>
              <div className="l-tcard-text">
                I process 20+ invoices daily. Intellixy has significantly sped up my
                review process. I just ask &lsquo;what&apos;s the GST amount?&rsquo; and it finds
                the answer instantly — with the exact line cited.
              </div>
              <div className="l-tcard-author">
                <div className="l-tcard-avatar">PS</div>
                <div>
                  <div className="l-tcard-name">Priya Sharma</div>
                  <div className="l-tcard-role">Chartered Accountant · Mumbai</div>
                </div>
              </div>
            </div>

            <div className="l-tcard reveal">
              <div className="l-tcard-qmark">&ldquo;</div>
              <div className="l-tcard-text">
                100-page case files used to take hours. Now I ask questions and get the
                key points in minutes. Absolute game changer for law school.
              </div>
              <div className="l-tcard-author">
                <div className="l-tcard-avatar">RV</div>
                <div>
                  <div className="l-tcard-name">Rahul Verma</div>
                  <div className="l-tcard-role">Law Student · NLU Delhi</div>
                </div>
              </div>
            </div>

            <div className="l-tcard reveal">
              <div className="l-tcard-qmark">&ldquo;</div>
              <div className="l-tcard-text">
                The citation feature alone is worth it. I can verify every AI answer
                against the source — that&apos;s what my team needed.
              </div>
              <div className="l-tcard-author">
                <div className="l-tcard-avatar">AI</div>
                <div>
                  <div className="l-tcard-name">Ananya Iyer</div>
                  <div className="l-tcard-role">Product Manager · Razorpay</div>
                </div>
              </div>
            </div>

            <div className="l-tcard reveal">
              <div className="l-tcard-qmark">&ldquo;</div>
              <div className="l-tcard-text">
                We use it for research papers. It surfaces the methodology and key
                findings before I even start reading. Brilliant tool.
              </div>
              <div className="l-tcard-author">
                <div className="l-tcard-avatar">MK</div>
                <div>
                  <div className="l-tcard-name">Dr. Meera Krishnan</div>
                  <div className="l-tcard-role">Researcher · IISc Bangalore</div>
                </div>
              </div>
            </div>

            <div className="l-tcard reveal">
              <div className="l-tcard-qmark">&ldquo;</div>
              <div className="l-tcard-text">
                I draft contracts. Intellixy helps me check if a specific clause
                exists without manually searching 80-page agreements.
              </div>
              <div className="l-tcard-author">
                <div className="l-tcard-avatar">SP</div>
                <div>
                  <div className="l-tcard-name">Siddharth Patel</div>
                  <div className="l-tcard-role">Corporate Lawyer · Ahmedabad</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. INTEGRATIONS ─────────────────────────────────────────── */}
      <section className="l-integrations">
        <div className="l-integrations-inner">
          <p className="section-label">Works with everything</p>
          <h2>Every format. Any workflow.</h2>
          <p>120+ document formats supported — from scanned PDFs to spreadsheets.</p>
          <div className="l-int-row reveal">
            {INTEGRATIONS.map((t) => (
              <div key={t} className="l-int-card">{t}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. PRICING ─────────────────────────────────────────────── */}
      <section className="l-pricing" id="pricing">
        <div className="l-pricing-inner">
          <div className="l-pricing-hdr reveal">
            <p className="section-label">Pricing</p>
            <h2>Simple, honest pricing</h2>
            <p style={{ fontSize: "16px", color: "var(--ink-soft)", marginTop: "10px" }}>
              Start free. No credit card required.
            </p>
          </div>
          <div className="l-pricing-grid reveal">
            {/* Free */}
            <div className="l-plan">
              <div className="l-plan-tag">Free</div>
              <div className="l-plan-name">Reader</div>
              <div className="l-plan-price">₹0</div>
              <div className="l-plan-per">forever free</div>
              <div className="l-plan-desc">
                Perfect for trying Intellixy with a few documents.
              </div>
              <div className="l-plan-feats">
                {[
                  "3 PDF uploads / month",
                  "20 questions / month",
                  "AI answers & summaries",
                  "7-day chat history",
                  "Email support",
                ].map((f) => (
                  <div key={f} className="l-plan-feat">
                    <span className="l-plan-check">✓</span>
                    {f}
                  </div>
                ))}
              </div>
              <Link
                href="/dashboard"
                className="btn btn-outline"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Start free
              </Link>
            </div>

            {/* Pro */}
            <div className="l-plan featured">
              <div className="l-plan-badge">Most popular</div>
              <div className="l-plan-tag">Pro</div>
              <div className="l-plan-name">Scholar</div>
              <div className="l-plan-price">₹299</div>
              <div className="l-plan-per">per month · cancel anytime</div>
              <div className="l-plan-desc">
                For professionals who live inside documents.
              </div>
              <div className="l-plan-feats">
                {[
                  "Unlimited PDFs",
                  "Unlimited questions",
                  "Advanced AI insights",
                  "Risk & data extraction",
                  "Voice input",
                  "Persistent history",
                  "Document comparison",
                  "Priority support",
                ].map((f) => (
                  <div key={f} className="l-plan-feat">
                    <span className="l-plan-check">✓</span>
                    {f}
                  </div>
                ))}
              </div>
              <Link
                href="/dashboard"
                className="btn btn-copper"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Get Scholar
              </Link>
            </div>

            {/* Atelier */}
            <div className="l-plan">
              <div className="l-plan-tag">Enterprise</div>
              <div className="l-plan-name">Atelier</div>
              <div className="l-plan-price talk">Let&apos;s talk</div>
              <div className="l-plan-per">custom pricing</div>
              <div className="l-plan-desc">
                For teams with large document volumes and enterprise needs.
              </div>
              <div className="l-plan-feats">
                {[
                  "Everything in Scholar",
                  "Unlimited team seats",
                  "Shared document library",
                  "SSO + admin controls",
                  "On-premise deployment",
                  "Dedicated support",
                  "SLA guarantee",
                ].map((f) => (
                  <div key={f} className="l-plan-feat">
                    <span className="l-plan-check">✓</span>
                    {f}
                  </div>
                ))}
              </div>
              <Link
                href="/dashboard"
                className="btn btn-outline"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Contact sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 11. FAQ ─────────────────────────────────────────────────── */}
      <section className="l-faq" id="faq">
        <div className="l-faq-inner">
          <div className="l-faq-aside reveal">
            <p className="section-label">FAQ</p>
            <h2>Questions worth asking</h2>
            <p>
              Can&apos;t find what you&apos;re looking for?{" "}
              <a href="mailto:hello@intellixy.com">Email us</a> — we reply fast.
            </p>
          </div>
          <div className="reveal">
            <FaqAccordion />
          </div>
        </div>
      </section>

      {/* ── 12. FINAL CTA ───────────────────────────────────────────── */}
      <section className="l-cta">
        <div className="l-cta-inner reveal">
          <p className="section-label" style={{ color: "rgba(243,237,225,.4)" }}>
            Get started
          </p>
          <h2>
            Stop reading.
            <br />
            <em>Start asking.</em>
          </h2>
          <p>Upload your first PDF free. No credit card. No dark patterns.</p>
          <div className="l-cta-btns">
            <Link href="/dashboard" className="btn btn-copper">
              Upload a PDF — it&apos;s free
            </Link>
          </div>
        </div>
      </section>

      {/* ── 13. FOOTER ──────────────────────────────────────────────── */}
      <footer className="l-footer">
        <div className="l-footer-inner">
          <div className="l-footer-grid">
            <div>
              <Link href="/" className="l-footer-logo">
                <div className="l-footer-logo-mark"><span>I</span></div>
                Intellixy
              </Link>
              <p className="l-footer-tagline">
                AI-powered document intelligence. Upload any PDF and get cited
                answers in seconds.
              </p>
            </div>
            <div className="l-footer-col">
              <h4>Product</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#demo">Demo</a></li>
                <li><a href="#faq">FAQ</a></li>
              </ul>
            </div>
            <div className="l-footer-col">
              <h4>Use cases</h4>
              <ul>
                <li><Link href="/dashboard">Legal documents</Link></li>
                <li><Link href="/dashboard">Financial reports</Link></li>
                <li><Link href="/dashboard">Research papers</Link></li>
                <li><Link href="/dashboard">Contracts</Link></li>
              </ul>
            </div>
            <div className="l-footer-col">
              <h4>Company</h4>
              <ul>
                <li><a href="#">About</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Changelog</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
            <div className="l-footer-col">
              <h4>Legal</h4>
              <ul>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Refund Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="l-footer-bottom">
            <span className="l-footer-copy">© 2025 Intellixy. All rights reserved.</span>
            <span className="l-footer-copy">Made with care · Hosted on Vercel</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
