"use client";

// THIS PAGE IS PUBLIC — zero auth checks, zero redirects
// Loads at "/" for all visitors

import { useState, useEffect } from "react";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links = [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
  ];

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      background: scrolled ? "rgba(7,7,26,0.96)" : "transparent",
      backdropFilter: scrolled ? "blur(20px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "none",
      transition: "all 0.3s",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(124,58,237,0.4)" }}>
            <svg width="16" height="16" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 17, color: "white", letterSpacing: "-0.3px" }}>AI PDF Chat</span>
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {links.map(l => (
            <a key={l.label} href={l.href} style={{ display: "none", fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.6)", textDecoration: "none", padding: "6px 14px", borderRadius: 8 }}
              className="nav-link">{l.label}</a>
          ))}
          <a href="/login" style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.7)", textDecoration: "none", padding: "8px 16px", borderRadius: 10 }}>
            Log in
          </a>
          <a href="/login" style={{ fontSize: 14, fontWeight: 700, color: "white", textDecoration: "none", padding: "9px 20px", borderRadius: 50, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 4px 20px rgba(124,58,237,0.4)" }}>
            Get Started Free
          </a>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", paddingTop: 64 }}>
      {/* Blobs */}
      <div style={{ position: "absolute", top: "-20%", left: "-10%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.22),transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,70,229,0.18),transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "radial-gradient(circle,#a78bfa 1px,transparent 1px)", backgroundSize: "32px 32px", pointerEvents: "none" }} />

      <div style={{ position: "relative", maxWidth: 900, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 50, padding: "6px 16px", marginBottom: 32 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", display: "inline-block" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#c4b5fd", textTransform: "uppercase", letterSpacing: "0.1em" }}>Powered by GPT-4o</span>
        </div>

        <h1 style={{ fontSize: "clamp(2.8rem,6vw,4.5rem)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-1px", color: "white", margin: "0 0 24px" }}>
          Chat with any{" "}
          <span style={{ background: "linear-gradient(135deg,#c084fc,#e879f9,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            PDF instantly
          </span>
        </h1>

        <p style={{ fontSize: "clamp(1rem,2.5vw,1.2rem)", color: "rgba(255,255,255,0.5)", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 40px" }}>
          Upload invoices, contracts, and reports. Ask questions in plain English.
          Get precise answers in seconds — no more manual searching.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 64 }}>
          <a href="/login" style={{ fontSize: 15, fontWeight: 700, color: "white", textDecoration: "none", padding: "14px 32px", borderRadius: 50, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 8px 32px rgba(124,58,237,0.4)" }}>
            Start for free — no card needed
          </a>
          <a href="#how-it-works" style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.7)", textDecoration: "none", padding: "14px 32px", borderRadius: 50, border: "1px solid rgba(255,255,255,0.15)" }}>
            See how it works →
          </a>
        </div>

        {/* Mock UI */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.5)", maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "rgba(239,68,68,0.6)" }} />
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "rgba(234,179,8,0.6)" }} />
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "rgba(34,197,94,0.6)" }} />
            <span style={{ marginLeft: 8, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>AI PDF Chat — dashboard</span>
          </div>
          <div style={{ display: "flex", height: 200 }}>
            <div style={{ width: 160, background: "rgba(255,255,255,0.02)", borderRight: "1px solid rgba(255,255,255,0.07)", padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>Your PDFs</p>
              {[{ n: "Q4 Report.pdf", a: true }, { n: "Contract.pdf", a: false }, { n: "Invoice.pdf", a: false }].map(f => (
                <div key={f.n} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: 8, fontSize: 11, fontWeight: 500, background: f.a ? "rgba(124,58,237,0.2)" : "transparent", color: f.a ? "#c4b5fd" : "rgba(255,255,255,0.35)", border: f.a ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent" }}>
                  📄 {f.n}
                </div>
              ))}
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 10, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", fontSize: 12, padding: "8px 12px", borderRadius: 14, maxWidth: "70%" }}>
                  What is the total revenue in Q4?
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  ✦
                </div>
                <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)", fontSize: 12, padding: "8px 12px", borderRadius: 14, maxWidth: "75%" }}>
                  Total Q4 revenue was <strong style={{ color: "#c4b5fd" }}>$4.2M</strong>, up 18% from Q3, driven by enterprise contracts in APAC.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: "💬", title: "Instant Q&A", desc: "Ask anything in plain English and get precise answers from your PDF." },
    { icon: "📋", title: "Smart Extraction", desc: "Extract invoices, resumes, and contracts into structured JSON." },
    { icon: "⚡", title: "Lightning Fast", desc: "Semantic vector search delivers answers in under 2 seconds." },
    { icon: "🔒", title: "Secure & Private", desc: "Files encrypted in transit and at rest. Only you have access." },
    { icon: "📁", title: "Multi-Document", desc: "Upload multiple PDFs and switch between them instantly." },
    { icon: "🕘", title: "Chat History", desc: "Every conversation saved with full multi-turn context." },
  ];
  return (
    <section id="features" style={{ padding: "96px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Features</p>
          <h2 style={{ fontSize: "clamp(2rem,4vw,2.8rem)", fontWeight: 900, color: "white", letterSpacing: "-0.5px", margin: "0 0 16px" }}>Everything you need</h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.45)", maxWidth: 480, margin: "0 auto" }}>A complete AI toolkit for working with PDF documents.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
          {items.map(f => (
            <div key={f.title} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "white", margin: "0 0 8px" }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: 1, icon: "📄", title: "Upload your PDF", desc: "Drag and drop any PDF — invoices, contracts, research papers." },
    { n: 2, icon: "💬", title: "Ask a question", desc: "Type any question in plain English. AI finds the exact info." },
    { n: 3, icon: "⚡", title: "Get precise answers", desc: "Accurate answers in seconds. Summaries, data, specific details." },
  ];
  return (
    <section id="how-it-works" style={{ padding: "96px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>How it works</p>
          <h2 style={{ fontSize: "clamp(2rem,4vw,2.8rem)", fontWeight: 900, color: "white", letterSpacing: "-0.5px", margin: "0 0 16px" }}>Three simple steps</h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.45)" }}>From PDF to answers in under 30 seconds.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 32 }}>
          {steps.map(s => (
            <div key={s.n} style={{ textAlign: "center" }}>
              <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 72, height: 72, borderRadius: 16, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", fontSize: 28, marginBottom: 20 }}>
                {s.icon}
                <span style={{ position: "absolute", top: -8, right: -8, width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(124,58,237,0.5)" }}>{s.n}</span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "white", margin: "0 0 10px" }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: "Free", price: "$0", period: "forever",
      features: ["5 PDF uploads", "20 questions / day", "Basic Q&A", "7-day chat history"],
      cta: "Get started free", highlight: false,
    },
    {
      name: "Pro", price: "$9", period: "/ month", badge: "Most Popular",
      features: ["Unlimited PDFs", "Unlimited questions", "Smart extraction (JSON)", "Full chat history", "Priority support"],
      cta: "Start Pro", highlight: true,
    },
  ];
  return (
    <section id="pricing" style={{ padding: "96px 24px" }}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Pricing</p>
          <h2 style={{ fontSize: "clamp(2rem,4vw,2.8rem)", fontWeight: 900, color: "white", letterSpacing: "-0.5px", margin: "0 0 16px" }}>Simple, honest pricing</h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.45)" }}>No hidden fees. Cancel anytime.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
          {plans.map(p => (
            <div key={p.name} style={{ position: "relative", background: p.highlight ? "linear-gradient(135deg,rgba(124,58,237,0.15),rgba(79,70,229,0.1))" : "rgba(255,255,255,0.03)", border: p.highlight ? "1px solid rgba(124,58,237,0.4)" : "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 32, display: "flex", flexDirection: "column" }}>
              {p.badge && (
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 50, whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(124,58,237,0.4)" }}>
                  {p.badge}
                </div>
              )}
              <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.45)", margin: "0 0 8px" }}>{p.name}</p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 24 }}>
                <span style={{ fontSize: 40, fontWeight: 900, color: "white" }}>{p.price}</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", paddingBottom: 6 }}>{p.period}</span>
              </div>
              <ul style={{ listStyle: "none", margin: "0 0 28px", padding: 0, display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                {p.features.map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
                    <svg width="16" height="16" fill="none" stroke="#a78bfa" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <a href="/login" style={{ display: "block", textAlign: "center", textDecoration: "none", fontSize: 14, fontWeight: 700, color: "white", padding: "12px", borderRadius: 12, background: p.highlight ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "rgba(255,255,255,0.07)", border: p.highlight ? "none" : "1px solid rgba(255,255,255,0.1)", boxShadow: p.highlight ? "0 4px 20px rgba(124,58,237,0.35)" : "none" }}>
                {p.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "40px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="12" height="12" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "white" }}>AI PDF Chat</span>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0 }}>© {new Date().getFullYear()} AI PDF Chat. All rights reserved.</p>
        <div style={{ display: "flex", gap: 20 }}>
          {["Privacy", "Terms", "Contact"].map(l => (
            <a key={l} href="#" style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>{l}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ─── PUBLIC HOME PAGE — NO REDIRECTS ────────────────────────────────────────
export default function HomePage() {
  return (
    <div style={{ background: "#07071a", minHeight: "100vh", color: "white" }}>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Footer />
    </div>
  );
}
