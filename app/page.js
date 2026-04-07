"use client";

import { useState, useEffect } from "react";

/* ─── NAVBAR ─────────────────────────────────────────────────────────────── */
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
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: "all 0.3s",
        background: scrolled ? "rgba(7,7,26,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 shrink-0 no-underline">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 4px 16px rgba(124,58,237,0.4)" }}
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="font-bold text-lg text-white tracking-tight">AI PDF Chat</span>
        </a>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8 list-none m-0 p-0">
          {links.map((l) => (
            <li key={l.label}>
              <a href={l.href} className="text-sm font-medium no-underline" style={{ color: "rgba(255,255,255,0.6)", transition: "color 0.2s" }}
                onMouseEnter={e => (e.target.style.color = "white")}
                onMouseLeave={e => (e.target.style.color = "rgba(255,255,255,0.6)")}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <a href="/login" className="text-sm font-medium no-underline px-4 py-2 rounded-xl transition-all"
            style={{ color: "rgba(255,255,255,0.7)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "white"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; e.currentTarget.style.background = "transparent"; }}
          >
            Log in
          </a>
          <a
            href="/login"
            className="text-sm font-bold no-underline px-5 py-2 rounded-full text-white"
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 4px 20px rgba(124,58,237,0.35)", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(124,58,237,0.55)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(124,58,237,0.35)"; }}
          >
            Get Started Free
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 bg-transparent border-none cursor-pointer"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{ background: "#0d0d24", borderTop: "1px solid rgba(255,255,255,0.08)" }} className="md:hidden px-5 py-5 flex flex-col gap-4">
          {links.map((l) => (
            <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="text-sm font-medium no-underline py-1" style={{ color: "rgba(255,255,255,0.7)" }}>
              {l.label}
            </a>
          ))}
          <div className="flex gap-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <a href="/login" className="flex-1 text-center text-sm font-semibold no-underline py-2 rounded-xl text-white" style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
              Log in
            </a>
            <a href="/login" className="flex-1 text-center text-sm font-semibold no-underline py-2 rounded-xl text-white" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
              Get Started
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ─── HERO ───────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ paddingTop: "64px" }}>
      {/* Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.22),transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,70,229,0.18),transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", top: "40%", left: "35%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(192,38,211,0.12),transparent 70%)", filter: "blur(50px)" }} />
        {/* Dot grid */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "radial-gradient(circle, #a78bfa 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      </div>

      <div className="relative w-full max-w-5xl mx-auto px-5 sm:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full" style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400" style={{ animation: "pulse 2s infinite" }} />
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#c4b5fd" }}>Powered by GPT-4o</span>
        </div>

        {/* Headline */}
        <h1 className="font-extrabold tracking-tight text-white mb-6" style={{ fontSize: "clamp(2.5rem,6vw,4.5rem)", lineHeight: 1.08 }}>
          Chat with any{" "}
          <span style={{ background: "linear-gradient(135deg,#c084fc,#e879f9,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            PDF instantly
          </span>
        </h1>

        <p className="text-lg sm:text-xl mb-10 mx-auto max-w-2xl" style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
          Upload invoices, contracts, and reports. Ask questions in plain English.
          Get precise answers in seconds — no more manual searching.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a
            href="/login"
            className="w-full sm:w-auto text-center no-underline px-8 py-4 text-base font-bold text-white rounded-full"
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 8px 32px rgba(124,58,237,0.4)", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(124,58,237,0.6)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(124,58,237,0.4)"; }}
          >
            Start for free — no card needed
          </a>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto text-center no-underline px-8 py-4 text-base font-semibold rounded-full"
            style={{ color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.color = "white"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
          >
            See how it works →
          </a>
        </div>

        {/* Mock UI */}
        <div className="mx-auto max-w-3xl rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 40px 80px rgba(0,0,0,0.5)" }}>
          {/* Title bar */}
          <div className="flex items-center gap-1.5 px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="w-3 h-3 rounded-full" style={{ background: "rgba(239,68,68,0.6)" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "rgba(234,179,8,0.6)" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "rgba(34,197,94,0.6)" }} />
            <span className="ml-3 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>AI PDF Chat — dashboard</span>
          </div>
          <div className="flex" style={{ height: 220 }}>
            {/* Sidebar */}
            <div className="flex flex-col gap-2 p-3 w-44" style={{ background: "rgba(255,255,255,0.02)", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Your PDFs</p>
              {[
                { name: "Q4 Report.pdf", active: true },
                { name: "Contract.pdf", active: false },
                { name: "Invoice.pdf", active: false },
              ].map((f) => (
                <div key={f.name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium"
                  style={f.active
                    ? { background: "rgba(124,58,237,0.2)", color: "#c4b5fd", border: "1px solid rgba(124,58,237,0.3)" }
                    : { color: "rgba(255,255,255,0.35)" }
                  }>
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"/>
                  </svg>
                  {f.name}
                </div>
              ))}
            </div>
            {/* Chat */}
            <div className="flex-1 flex flex-col justify-end gap-3 p-4">
              <div className="flex justify-end">
                <div className="text-xs text-white px-3 py-2 rounded-2xl" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", maxWidth: "70%" }}>
                  What is the total revenue in Q4?
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
                </div>
                <div className="text-xs px-3 py-2 rounded-2xl" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)", maxWidth: "75%" }}>
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

/* ─── STATS ──────────────────────────────────────────────────────────────── */
function Stats() {
  const stats = [
    { value: "50K+", label: "PDFs analyzed" },
    { value: "200K+", label: "Questions answered" },
    { value: "99.9%", label: "Uptime" },
    { value: "< 2s", label: "Response time" },
  ];
  return (
    <section style={{ borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "64px 0" }}>
      <div className="max-w-5xl mx-auto px-5 sm:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-3xl font-extrabold mb-1" style={{ background: "linear-gradient(135deg,#c084fc,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {s.value}
            </p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── FEATURES ───────────────────────────────────────────────────────────── */
function Features() {
  const features = [
    {
      icon: "💬", title: "Instant Q&A",
      desc: "Ask any question in plain English and get precise answers extracted directly from your PDF content.",
      color: "#7c3aed",
    },
    {
      icon: "📋", title: "Smart Extraction",
      desc: "Automatically extract invoices, resumes, contracts into clean structured JSON data.",
      color: "#4f46e5",
    },
    {
      icon: "⚡", title: "Lightning Fast",
      desc: "Vector search with semantic understanding. Get answers in under 2 seconds.",
      color: "#c026d3",
    },
    {
      icon: "🔒", title: "Secure & Private",
      desc: "Your documents are encrypted in transit and at rest. Only you can access your files.",
      color: "#059669",
    },
    {
      icon: "📁", title: "Multi-Document",
      desc: "Upload and organize multiple PDFs. Switch between documents instantly in the sidebar.",
      color: "#d97706",
    },
    {
      icon: "🕘", title: "Chat History",
      desc: "Every conversation is saved. Pick up where you left off with full multi-turn context.",
      color: "#0284c7",
    },
  ];

  return (
    <section id="features" style={{ padding: "96px 0" }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#a78bfa" }}>Features</p>
          <h2 className="font-extrabold tracking-tight text-white mb-4" style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>
            Everything you need
          </h2>
          <p className="text-lg mx-auto max-w-xl" style={{ color: "rgba(255,255,255,0.45)" }}>
            A complete AI toolkit for working with PDF documents.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-6 transition-all duration-300 cursor-default"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.055)"; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.13)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4" style={{ background: `${f.color}22`, border: `1px solid ${f.color}44` }}>
                {f.icon}
              </div>
              <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── HOW IT WORKS ───────────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    { n: 1, icon: "📄", title: "Upload your PDF", desc: "Drag and drop any PDF — invoices, contracts, research papers. Up to 100MB supported." },
    { n: 2, icon: "💬", title: "Ask a question", desc: "Type any question in plain English. AI understands context and finds exact information." },
    { n: 3, icon: "⚡", title: "Get precise answers", desc: "Receive accurate answers in seconds. Extract structured data, summaries, or specific details." },
  ];

  return (
    <section id="how-it-works" style={{ padding: "96px 0" }}>
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#a78bfa" }}>How it works</p>
          <h2 className="font-extrabold tracking-tight text-white mb-4" style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>
            Three simple steps
          </h2>
          <p className="text-lg" style={{ color: "rgba(255,255,255,0.45)" }}>From PDF to answers in under 30 seconds.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {steps.map((s) => (
            <div key={s.n} className="text-center">
              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl text-3xl mb-5"
                style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" }}>
                {s.icon}
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 2px 8px rgba(124,58,237,0.5)" }}>
                  {s.n}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── TESTIMONIALS ───────────────────────────────────────────────────────── */
function Testimonials() {
  const reviews = [
    { quote: "I process 50+ invoices a week. AI PDF Chat cuts that to 10 minutes. Absolute game changer.", name: "Sarah K.", role: "Finance Manager", avatar: "SK" },
    { quote: "Our legal team uses it to review contracts in seconds. The accuracy is remarkable.", name: "James L.", role: "Legal Counsel", avatar: "JL" },
    { quote: "I upload research papers and just ask questions. Like a research assistant that never sleeps.", name: "Priya M.", role: "PhD Researcher", avatar: "PM" },
  ];

  return (
    <section style={{ padding: "96px 0" }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#a78bfa" }}>Testimonials</p>
          <h2 className="font-extrabold tracking-tight text-white" style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>
            Loved by thousands
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <div key={r.name} className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4" fill="#fbbf24" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>
              <p className="text-sm leading-relaxed flex-1" style={{ color: "rgba(255,255,255,0.6)" }}>"{r.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                  {r.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{r.name}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{r.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── PRICING ────────────────────────────────────────────────────────────── */
function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      desc: "Perfect to get started.",
      features: ["5 PDF uploads", "20 questions / day", "Basic Q&A", "Chat history (7 days)", "Email support"],
      cta: "Get started free",
      highlight: false,
    },
    {
      name: "Pro",
      price: "$9",
      period: "/ month",
      desc: "For power users and teams.",
      features: ["Unlimited PDFs", "Unlimited questions", "Smart extraction (JSON)", "Full chat history", "Priority support", "Early access to new features"],
      cta: "Start Pro",
      badge: "Most Popular",
      highlight: true,
    },
  ];

  return (
    <section id="pricing" style={{ padding: "96px 0" }}>
      <div className="max-w-4xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#a78bfa" }}>Pricing</p>
          <h2 className="font-extrabold tracking-tight text-white mb-4" style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>
            Simple, honest pricing
          </h2>
          <p className="text-lg" style={{ color: "rgba(255,255,255,0.45)" }}>No hidden fees. Cancel anytime.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {plans.map((p) => (
            <div key={p.name} className="relative rounded-2xl p-8 flex flex-col"
              style={p.highlight
                ? { background: "linear-gradient(135deg,rgba(124,58,237,0.15),rgba(79,70,229,0.1))", border: "1px solid rgba(124,58,237,0.4)", boxShadow: "0 20px 60px rgba(124,58,237,0.15)" }
                : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }
              }
            >
              {p.badge && (
                <div className="absolute text-xs font-bold text-white px-4 py-1 rounded-full"
                  style={{ top: -14, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 4px 16px rgba(124,58,237,0.4)", whiteSpace: "nowrap" }}>
                  {p.badge}
                </div>
              )}
              <div className="mb-6">
                <p className="text-sm font-semibold mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>{p.name}</p>
                <div className="flex items-end gap-1.5 mb-1">
                  <span className="text-4xl font-extrabold text-white">{p.price}</span>
                  <span className="text-sm pb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{p.period}</span>
                </div>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>{p.desc}</p>
              </div>
              <ul className="flex flex-col gap-3 mb-8 flex-1" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="#a78bfa" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="/login"
                className="block text-center no-underline py-3 rounded-xl text-sm font-bold text-white"
                style={p.highlight
                  ? { background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 4px 20px rgba(124,58,237,0.35)", transition: "all 0.2s" }
                  : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", transition: "all 0.2s" }
                }
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {p.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FINAL CTA ──────────────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section style={{ padding: "96px 0" }}>
      <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
        <div className="relative rounded-3xl px-8 py-16 overflow-hidden"
          style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.18),rgba(79,70,229,0.12))", border: "1px solid rgba(124,58,237,0.25)" }}>
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div style={{ position: "absolute", top: "-40%", left: "-10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.18),transparent 70%)", filter: "blur(50px)" }} />
            <div style={{ position: "absolute", bottom: "-40%", right: "-10%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,70,229,0.18),transparent 70%)", filter: "blur(50px)" }} />
          </div>
          <div className="relative">
            <h2 className="font-extrabold tracking-tight text-white mb-4" style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)" }}>
              Start chatting with your PDFs today
            </h2>
            <p className="text-lg mb-8 mx-auto max-w-xl" style={{ color: "rgba(255,255,255,0.5)" }}>
              Join thousands of users who save hours every week. Free forever — no credit card needed.
            </p>
            <a
              href="/login"
              className="inline-block no-underline px-10 py-4 text-base font-bold text-white rounded-full"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 8px 32px rgba(124,58,237,0.4)", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(124,58,237,0.6)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(124,58,237,0.4)"; }}
            >
              Get started for free →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ─────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "40px 0" }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-sm font-bold text-white">AI PDF Chat</span>
        </div>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
          © {new Date().getFullYear()} AI PDF Chat. All rights reserved.
        </p>
        <div className="flex items-center gap-5">
          {["Privacy", "Terms", "Contact"].map((l) => (
            <a key={l} href="#" className="text-xs no-underline" style={{ color: "rgba(255,255,255,0.3)", transition: "color 0.2s" }}
              onMouseEnter={e => (e.target.style.color = "rgba(255,255,255,0.7)")}
              onMouseLeave={e => (e.target.style.color = "rgba(255,255,255,0.3)")}
            >
              {l}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

/* ─── PAGE ───────────────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <div style={{ background: "#07071a", minHeight: "100vh", color: "white" }}>
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  );
}
