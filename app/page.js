"use client";

import { useState, useEffect } from "react";

/* ── NAVBAR ─────────────────────────────────────────────────────────────── */
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
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#07071a]/95 backdrop-blur-xl border-b border-white/8 shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/40">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight text-white">AI PDF Chat</span>
        </a>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8 text-sm font-medium text-white/65">
          {links.map((l) => (
            <li key={l.label}>
              <a href={l.href} className="hover:text-white transition-colors duration-200">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="/login"
            className="text-sm font-medium text-white/70 hover:text-white px-4 py-2 rounded-xl hover:bg-white/8 transition-all duration-200"
          >
            Log in
          </a>
          <a
            href="/login"
            className="text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-5 py-2.5 rounded-full shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5 transition-all duration-200"
          >
            Get Started Free
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-white/80 hover:text-white"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#0d0d24] border-t border-white/8 px-5 py-5 flex flex-col gap-4">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-white/70 hover:text-white py-1 transition-colors"
            >
              {l.label}
            </a>
          ))}
          <div className="flex gap-3 pt-3 border-t border-white/8">
            <a href="/login" className="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl border border-white/15 text-white/70 hover:text-white hover:bg-white/5 transition-all">
              Log in
            </a>
            <a href="/login" className="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
              Get Started
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ── HERO ────────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full bg-violet-600/18 blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[120px]" />
        <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] rounded-full bg-fuchsia-600/10 blur-[100px]" />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, #a78bfa 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-5 sm:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/25 rounded-full px-4 py-1.5 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-xs font-semibold text-violet-300 tracking-wide uppercase">Powered by GPT-4o</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08] mb-6">
          Chat with any{" "}
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
            PDF instantly
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload invoices, contracts, and reports. Ask questions in plain English.
          Get precise answers in seconds — no more manual searching.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a
            href="/login"
            className="w-full sm:w-auto text-center px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-full shadow-xl shadow-violet-500/35 hover:shadow-violet-500/55 hover:-translate-y-1 transition-all duration-200"
          >
            Start for free — no card needed
          </a>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto text-center px-8 py-4 text-base font-semibold text-white/80 hover:text-white border border-white/15 hover:border-white/30 rounded-full hover:bg-white/5 transition-all duration-200"
          >
            See how it works →
          </a>
        </div>

        {/* Mock UI preview */}
        <div className="relative mx-auto max-w-3xl bg-white/4 border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
          {/* Window bar */}
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/8 bg-white/3">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
            <span className="ml-3 text-[11px] text-gray-500">AI PDF Chat — dashboard</span>
          </div>
          <div className="flex h-52 sm:h-64">
            {/* Sidebar */}
            <div className="w-44 bg-white/3 border-r border-white/8 p-3 flex flex-col gap-2">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1">Your PDFs</p>
              {["Q4 Report.pdf", "Contract.pdf", "Invoice.pdf"].map((f, i) => (
                <div key={f} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-medium ${i === 0 ? "bg-violet-600/20 text-violet-300 border border-violet-500/25" : "text-gray-500 hover:bg-white/4"}`}>
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"/>
                  </svg>
                  {f}
                </div>
              ))}
            </div>
            {/* Chat */}
            <div className="flex-1 flex flex-col p-4 gap-3 justify-end">
              <div className="flex gap-2 justify-end">
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs px-3 py-2 rounded-2xl rounded-br-md max-w-[70%]">
                  What is the total revenue in Q4?
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
                </div>
                <div className="bg-white/8 border border-white/10 text-gray-200 text-xs px-3 py-2 rounded-2xl rounded-bl-md max-w-[75%]">
                  Total Q4 revenue was <strong className="text-violet-300">$4.2M</strong>, up 18% from Q3, driven by enterprise contracts in APAC.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── SOCIAL PROOF ────────────────────────────────────────────────────────── */
function SocialProof() {
  const stats = [
    { value: "50K+", label: "PDFs analyzed" },
    { value: "200K+", label: "Questions answered" },
    { value: "99.9%", label: "Uptime" },
    { value: "< 2s", label: "Response time" },
  ];
  return (
    <section className="py-16 border-y border-white/6">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-white bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── FEATURES ────────────────────────────────────────────────────────────── */
function Features() {
  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      title: "Instant Q&A",
      desc: "Ask any question in plain English and get precise answers extracted directly from your PDF content.",
      color: "from-violet-500 to-purple-600",
      glow: "shadow-violet-500/20",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      title: "Smart Extraction",
      desc: "Automatically extract invoices, resumes, contracts, and reports into clean structured JSON data.",
      color: "from-indigo-500 to-blue-600",
      glow: "shadow-indigo-500/20",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Lightning Fast",
      desc: "Vector search over your documents with semantic understanding. Get answers in under 2 seconds.",
      color: "from-fuchsia-500 to-pink-600",
      glow: "shadow-fuchsia-500/20",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: "Secure & Private",
      desc: "Your documents are encrypted in transit and at rest. Only you can access your files.",
      color: "from-emerald-500 to-teal-600",
      glow: "shadow-emerald-500/20",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      title: "Multi-Document",
      desc: "Upload and organize multiple PDFs. Switch between documents instantly in the sidebar.",
      color: "from-amber-500 to-orange-600",
      glow: "shadow-amber-500/20",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      title: "Chat History",
      desc: "Every conversation is saved. Pick up where you left off with full multi-turn context.",
      color: "from-sky-500 to-cyan-600",
      glow: "shadow-sky-500/20",
    },
  ];

  return (
    <section id="features" className="py-24">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-16">
          <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Everything you need
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            A complete AI toolkit for working with PDF documents — built for speed, accuracy, and ease of use.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="group bg-white/4 hover:bg-white/6 border border-white/8 hover:border-white/14 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-4 shadow-lg ${f.glow} group-hover:scale-105 transition-transform duration-300`}>
                {f.icon}
              </div>
              <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── HOW IT WORKS ────────────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Upload your PDF",
      desc: "Drag and drop any PDF — invoices, contracts, reports, research papers. Up to 100MB supported.",
      icon: "📄",
    },
    {
      n: "02",
      title: "Ask a question",
      desc: "Type any question in plain English. Our AI understands context and finds the exact information you need.",
      icon: "💬",
    },
    {
      n: "03",
      title: "Get precise answers",
      desc: "Receive accurate, sourced answers in seconds. Extract structured data, summaries, or specific details.",
      icon: "⚡",
    },
  ];

  return (
    <section id="how-it-works" className="py-24">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-16">
          <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Three simple steps
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            From PDF to answers in under 30 seconds.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={step.n} className="relative text-center">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[calc(50%+40px)] right-0 h-px bg-gradient-to-r from-violet-500/40 to-transparent" />
              )}
              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 text-3xl mb-5 shadow-lg">
                {step.icon}
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                  {i + 1}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── TESTIMONIALS ────────────────────────────────────────────────────────── */
function Testimonials() {
  const reviews = [
    {
      quote: "I process 50+ invoices a week. AI PDF Chat cuts that down to 10 minutes. Absolute game changer.",
      name: "Sarah K.",
      role: "Finance Manager",
      avatar: "SK",
    },
    {
      quote: "Our legal team uses it to review contracts in seconds. The accuracy is remarkable — saves us hours.",
      name: "James L.",
      role: "Legal Counsel",
      avatar: "JL",
    },
    {
      quote: "I upload research papers and just ask questions. It's like having a research assistant that never sleeps.",
      name: "Priya M.",
      role: "PhD Researcher",
      avatar: "PM",
    },
  ];

  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-16">
          <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-3">Testimonials</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Loved by thousands
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <div key={r.name} className="bg-white/4 border border-white/8 rounded-2xl p-6 flex flex-col gap-4 hover:bg-white/6 hover:border-white/12 transition-all duration-300">
              {/* Stars */}
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-gray-300 leading-relaxed flex-1">"{r.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {r.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{r.name}</p>
                  <p className="text-xs text-gray-500">{r.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── PRICING ─────────────────────────────────────────────────────────────── */
function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      desc: "Perfect to get started.",
      features: ["5 PDF uploads", "20 questions / day", "Basic Q&A", "Chat history (7 days)", "Email support"],
      cta: "Get started free",
      href: "/login",
      highlight: false,
    },
    {
      name: "Pro",
      price: "$9",
      period: "/ month",
      desc: "For power users and teams.",
      features: ["Unlimited PDFs", "Unlimited questions", "Smart extraction (JSON)", "Full chat history", "Priority support", "Early access to new features"],
      cta: "Start Pro",
      href: "/login",
      highlight: true,
      badge: "Most Popular",
    },
  ];

  return (
    <section id="pricing" className="py-24">
      <div className="max-w-4xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-16">
          <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Simple, honest pricing
          </h2>
          <p className="text-gray-400 text-lg">No hidden fees. No surprise charges. Cancel anytime.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl p-8 border flex flex-col ${
                p.highlight
                  ? "bg-gradient-to-b from-violet-600/15 to-indigo-600/10 border-violet-500/40 shadow-xl shadow-violet-500/10"
                  : "bg-white/4 border-white/8"
              }`}
            >
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg shadow-violet-500/30">
                  {p.badge}
                </div>
              )}
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-400 mb-1">{p.name}</p>
                <div className="flex items-end gap-1.5 mb-1">
                  <span className="text-4xl font-extrabold text-white">{p.price}</span>
                  <span className="text-gray-400 text-sm pb-1">{p.period}</span>
                </div>
                <p className="text-sm text-gray-500">{p.desc}</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-violet-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={p.href}
                className={`block text-center py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                  p.highlight
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5"
                    : "bg-white/8 hover:bg-white/14 text-white border border-white/10"
                }`}
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

/* ── FINAL CTA ───────────────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section className="py-24">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
        <div className="relative bg-gradient-to-br from-violet-600/20 to-indigo-600/15 border border-violet-500/25 rounded-3xl px-8 py-16 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-30%] left-[-10%] w-[400px] h-[400px] rounded-full bg-violet-600/15 blur-[80px]" />
            <div className="absolute bottom-[-30%] right-[-10%] w-[300px] h-[300px] rounded-full bg-indigo-600/15 blur-[80px]" />
          </div>
          <div className="relative">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Start chatting with your PDFs today
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of users who save hours every week. Free forever — no credit card needed.
            </p>
            <a
              href="/login"
              className="inline-block px-10 py-4 text-base font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-full shadow-xl shadow-violet-500/35 hover:shadow-violet-500/55 hover:-translate-y-1 transition-all duration-200"
            >
              Get started for free →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── FOOTER ──────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-white/6 py-10">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-sm font-bold text-white">AI PDF Chat</span>
        </div>
        <p className="text-xs text-gray-600">© {new Date().getFullYear()} AI PDF Chat. All rights reserved.</p>
        <div className="flex items-center gap-5 text-xs text-gray-600">
          <a href="#" className="hover:text-gray-400 transition-colors">Privacy</a>
          <a href="#" className="hover:text-gray-400 transition-colors">Terms</a>
          <a href="#" className="hover:text-gray-400 transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
}

/* ── PAGE ────────────────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <main className="bg-[#07071a] min-h-screen">
      <Navbar />
      <Hero />
      <SocialProof />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  );
}
