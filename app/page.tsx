import type { Metadata } from "next";
import Link from "next/link";
import "./landing.css";
import NavbarClient from "@/app/components/landing/NavbarClient";
import HeroMockup from "@/app/components/landing/HeroMockup";
import PricingSection from "@/app/components/landing/PricingSection";
import FaqAccordion from "@/app/components/landing/FaqAccordion";
import FadeUp, { StaggerParent, StaggerChild } from "@/app/components/landing/FadeUp";
import InteractiveDemo from "@/app/components/landing/InteractiveDemo";

export const metadata: Metadata = {
  title: "Intellixy — Chat with any PDF instantly",
  description:
    "Upload any PDF and get instant answers, summaries, and insights using AI. Free plan available — no credit card needed.",
};

const LOGOS = ["McKinsey", "Deloitte", "KPMG", "IISc", "NLU Delhi", "Razorpay"];

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
    ),
    title: "Cited answers, not hallucinations",
    body: "Every answer is traced back to the exact page and paragraph. If we're not sure, we say so.",
    dark: true,
    wide: true,
    extra: (
      <div className="lv2-cite-pills">
        <span className="lv2-cite-pill">p.14 §3.2</span>
        <span className="lv2-cite-arr">→</span>
        <span className="lv2-cite-pill">chart 3.2.1</span>
        <span className="lv2-cite-arr">→</span>
        <span className="lv2-cite-pill">p.38 App C</span>
      </div>
    ),
  },
  {
    icon: (
      <svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
    ),
    title: "Answers in seconds",
    body: "Not minutes. Our RAG pipeline returns cited answers faster than you can flip to the right page.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
    ),
    title: "120+ file formats",
    body: "PDFs, DOCX, XLSX, PPTX, EPUB, HTML, LaTeX — even scanned documents via OCR.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
    ),
    title: "Ask in any language",
    body: "Documents in Hindi? Contracts in French? Ask in English, get answers from anywhere.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    ),
    title: "End-to-end encrypted",
    body: "Documents processed in isolated environments. We never train on your data — ever.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
    ),
    title: "Risk & insight engine",
    body: "Surface red flags, key clauses, and critical data points you'd miss after hours of reading.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Upload your document",
    body: "Drag & drop or browse. Any PDF up to 50 MB — processed in under 10 seconds.",
    note: "No sign-up needed for your first try.",
  },
  {
    n: "02",
    title: "Ask in plain English",
    body: "No syntax. No keywords. Just type your question exactly as you'd ask a colleague.",
    note: 'Try: "What are the key risks?"',
  },
  {
    n: "03",
    title: "Get cited answers",
    body: "AI returns a precise answer with the exact source — page number, section, and excerpt.",
    note: "Verify every claim yourself.",
  },
];

const TESTIMONIALS = [
  {
    text: "I process 20+ invoices daily. Intellixy has significantly sped up my review process. I just ask 'what's the GST amount?' and it finds the answer instantly — with the exact line cited.",
    name: "Priya Sharma",
    role: "Chartered Accountant · Mumbai",
    initials: "PS",
    color: "#c96b36",
    featured: true,
  },
  {
    text: "100-page case files used to take hours. Now I ask questions and get the key points in minutes. Absolute game changer for law school.",
    name: "Rahul Verma",
    role: "Law Student · NLU Delhi",
    initials: "RV",
    color: "#6366f1",
  },
  {
    text: "The citation feature alone is worth it. I can verify every AI answer against the source — that's what my team needed.",
    name: "Ananya Iyer",
    role: "Product Manager · Razorpay",
    initials: "AI",
    color: "#10b981",
  },
  {
    text: "We use it for research papers. It surfaces the methodology and key findings before I even start reading.",
    name: "Dr. Meera Krishnan",
    role: "Researcher · IISc Bangalore",
    initials: "MK",
    color: "#f59e0b",
  },
  {
    text: "I draft contracts. Intellixy helps me check if a specific clause exists without manually searching 80-page agreements.",
    name: "Siddharth Patel",
    role: "Corporate Lawyer · Ahmedabad",
    initials: "SP",
    color: "#8b5cf6",
  },
];

export default function Page() {
  return (
    <div className="lv2">
      {/* ── NAVBAR ────────────────────────────────────────────────────── */}
      <NavbarClient />

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="lv2-hero">
        <div className="lv2-hero-inner">
          <FadeUp>
            <div className="lv2-hero-eyebrow">
              <span className="lv2-hero-eyebrow-dot" />
              AI-Powered Document Intelligence
            </div>
            <h1 className="lv2-hero-h1">
              Chat with<br />
              any PDF.<br />
              <em>Instantly.</em>
            </h1>
            <p className="lv2-hero-sub">
              Upload any document and get cited AI answers in seconds —
              no skimming, no guessing, no hallucinations.
            </p>
            <div className="lv2-hero-ctas">
              <Link href="/dashboard" className="lv2-btn-primary">
                Upload your first PDF →
              </Link>
              <a href="#demo" className="lv2-btn-ghost">
                See it live
              </a>
            </div>
            <div className="lv2-hero-trust">
              <div className="lv2-hero-avatars">
                {["#c96b36","#6366f1","#10b981","#f59e0b"].map((c, i) => (
                  <div
                    key={i}
                    className="lv2-hero-av"
                    style={{ background: c, zIndex: 4 - i }}
                  />
                ))}
              </div>
              <span className="lv2-hero-trust-text">
                <strong>1,200+ professionals</strong> trust Intellixy
              </span>
            </div>
          </FadeUp>

          <HeroMockup />
        </div>
      </section>

      {/* ── SOCIAL PROOF ──────────────────────────────────────────────── */}
      <div className="lv2-social">
        <div className="lv2-social-inner">
          <span className="lv2-social-label">Trusted by teams at</span>
          <div className="lv2-social-divider" />
          <div className="lv2-social-logos">
            {LOGOS.map((l) => (
              <span key={l} className="lv2-social-logo">{l}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATS ─────────────────────────────────────────────────────── */}
      <div className="lv2-stats">
        <StaggerParent className="lv2-stats-inner">
          {[
            { val: "1,200", suf: "+", label: "Active users", sub: "and growing daily" },
            { val: "50", suf: "K+", label: "PDFs analysed", sub: "across all sectors" },
            { val: "98", suf: "%", label: "Citation accuracy", sub: "independently audited" },
            { val: "0", suf: " bits", label: "Data sold", sub: "your docs stay yours" },
          ].map((s) => (
            <StaggerChild key={s.label}>
              <div className="lv2-stat">
                <div className="lv2-stat-val">
                  {s.val}<span>{s.suf}</span>
                </div>
                <div className="lv2-stat-label">{s.label}</div>
                <div className="lv2-stat-sub">{s.sub}</div>
              </div>
            </StaggerChild>
          ))}
        </StaggerParent>
      </div>

      {/* ── FEATURES ──────────────────────────────────────────────────── */}
      <section className="lv2-features" id="features">
        <div className="lv2-features-inner">
          <FadeUp className="lv2-features-head">
            <div className="lv2-eyebrow">What it does</div>
            <h2 className="lv2-section-title">Every tool you need to read smarter</h2>
            <p className="lv2-section-sub">
              Purpose-built for professionals who live inside documents.
            </p>
          </FadeUp>

          <StaggerParent className="lv2-feat-grid">
            {FEATURES.map((f) => (
              <StaggerChild
                key={f.title}
                className={`lv2-feat-card${f.dark ? " lv2-feat-card--dark" : ""}${f.wide ? " lv2-feat-card--wide" : ""}`}
              >
                <div className="lv2-feat-icon">{f.icon}</div>
                <div className="lv2-feat-title">{f.title}</div>
                <div className="lv2-feat-body">{f.body}</div>
                {f.extra}
              </StaggerChild>
            ))}
          </StaggerParent>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="lv2-workflow" id="workflow">
        <div className="lv2-workflow-inner">
          <FadeUp className="lv2-workflow-head">
            <div className="lv2-eyebrow">How it works</div>
            <h2 className="lv2-section-title">Three steps to a smarter read</h2>
          </FadeUp>

          <StaggerParent className="lv2-steps">
            {STEPS.map((s) => (
              <StaggerChild key={s.n}>
                <div className="lv2-step">
                  <div className="lv2-step-num">{s.n}</div>
                  <div className="lv2-step-title">{s.title}</div>
                  <div className="lv2-step-body">{s.body}</div>
                  <div className="lv2-step-note">{s.note}</div>
                </div>
              </StaggerChild>
            ))}
          </StaggerParent>
        </div>
      </section>

      {/* ── INTERACTIVE DEMO ──────────────────────────────────────────── */}
      <section className="lv2-demo" id="demo">
        <div className="lv2-demo-inner">
          <FadeUp className="lv2-demo-head">
            <div className="lv2-eyebrow">Interactive demo</div>
            <h2 className="lv2-section-title">Try it — right now</h2>
            <p className="lv2-section-sub">
              No sign-up. Ask anything about a real financial report.
            </p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <InteractiveDemo />
          </FadeUp>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────── */}
      <section className="lv2-testi">
        <div className="lv2-testi-inner">
          <FadeUp className="lv2-testi-head">
            <div className="lv2-eyebrow">What readers say</div>
            <h2 className="lv2-section-title">Loved by professionals who read for a living</h2>
          </FadeUp>

          <StaggerParent className="lv2-testi-grid">
            {TESTIMONIALS.map((t) => (
              <StaggerChild
                key={t.name}
                className={`lv2-tcard${t.featured ? " lv2-tcard--featured" : ""}`}
              >
                <div className="lv2-tcard-stars">★★★★★</div>
                <div className="lv2-tcard-text">&ldquo;{t.text}&rdquo;</div>
                <div className="lv2-tcard-author">
                  <div
                    className="lv2-tcard-av"
                    style={{ background: t.color }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="lv2-tcard-name">{t.name}</div>
                    <div className="lv2-tcard-role">{t.role}</div>
                  </div>
                </div>
              </StaggerChild>
            ))}
          </StaggerParent>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────────── */}
      <PricingSection />

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="lv2-faq" id="faq">
        <div className="lv2-faq-inner">
          <FadeUp>
            <div className="lv2-eyebrow">FAQ</div>
            <h2 className="lv2-section-title">Questions worth asking</h2>
            <p className="lv2-faq-contact">
              Can&apos;t find what you&apos;re looking for?{" "}
              <a href="mailto:hello@intellixy.com">Email us</a> — we reply fast.
            </p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <FaqAccordion />
          </FadeUp>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="lv2-cta">
        <FadeUp>
          <div className="lv2-cta-inner">
            <div className="lv2-cta-eyebrow">Get started</div>
            <h2 className="lv2-cta-title">
              Stop reading.<br />
              <em>Start asking.</em>
            </h2>
            <p className="lv2-cta-sub">
              Upload your first PDF free. No credit card. No dark patterns.
            </p>
            <div className="lv2-cta-btns">
              <Link href="/dashboard" className="lv2-btn-accent">
                Upload a PDF — it&apos;s free
              </Link>
              <a href="#demo" className="lv2-btn-outline-white">
                See the demo first
              </a>
            </div>
            <p className="lv2-cta-fine">14-day money-back guarantee · Cancel anytime</p>
          </div>
        </FadeUp>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="lv2-footer">
        <div className="lv2-footer-inner">
          <div className="lv2-footer-grid">
            <div>
              <Link href="/" className="lv2-footer-logo">
                <div className="lv2-footer-logo-mark">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="8" height="11" rx="1.5" fill="currentColor" opacity=".9"/>
                    <rect x="13" y="3" width="8" height="5" rx="1.5" fill="currentColor" opacity=".5"/>
                    <rect x="13" y="10" width="8" height="11" rx="1.5" fill="currentColor" opacity=".7"/>
                    <rect x="3" y="16" width="8" height="5" rx="1.5" fill="currentColor" opacity=".4"/>
                  </svg>
                </div>
                Intellixy
              </Link>
              <p className="lv2-footer-tagline">
                AI-powered document intelligence. Upload any PDF and get cited answers in seconds.
              </p>
            </div>

            <div className="lv2-footer-col">
              <h4>Product</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#demo">Demo</a></li>
                <li><a href="#faq">FAQ</a></li>
              </ul>
            </div>

            <div className="lv2-footer-col">
              <h4>Use cases</h4>
              <ul>
                <li><Link href="/dashboard">Legal documents</Link></li>
                <li><Link href="/dashboard">Financial reports</Link></li>
                <li><Link href="/dashboard">Research papers</Link></li>
                <li><Link href="/dashboard">Contracts</Link></li>
              </ul>
            </div>

            <div className="lv2-footer-col">
              <h4>Company</h4>
              <ul>
                <li><a href="#">About</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Changelog</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>

            <div className="lv2-footer-col">
              <h4>Legal</h4>
              <ul>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Refund Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="lv2-footer-bottom">
            <span className="lv2-footer-copy">© 2025 Intellixy. All rights reserved.</span>
            <span className="lv2-footer-copy">Made with care · Hosted on Vercel</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
