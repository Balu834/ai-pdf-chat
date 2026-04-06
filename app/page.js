"use client";

import { useState, useEffect } from "react";

/* ── NAVBAR ──────────────────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 18);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links = [
    { label: "Features",    href: "#features" },
    { label: "How it works",href: "#how-it-works" },
    { label: "Pricing",     href: "#pricing" },
  ];

  return (
    <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/35">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className={`font-bold text-lg tracking-tight transition-colors duration-300 ${scrolled ? "text-gray-900" : "text-white"}`}>
            AI PDF Chat
          </span>
        </a>

        {/* Desktop nav links */}
        <ul className={`hidden md:flex items-center gap-7 text-sm font-medium transition-colors duration-300 ${scrolled ? "text-gray-600" : "text-white/75"}`}>
          {links.map(l => (
            <li key={l.label}>
              <a href={l.href} className="hover:text-violet-500 transition-colors duration-200">{l.label}</a>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a href="/login"
            className={`text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200 ${scrolled ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100" : "text-white/80 hover:text-white hover:bg-white/10"}`}>
            Log in
          </a>
          <a href="/dashboard"
            className="text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-full shadow-lg shadow-violet-500/25 hover:shadow-violet-500/45 hover:-translate-y-0.5 transition-all duration-200">
            Get Started Free
          </a>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2 -mr-1" onClick={() => setOpen(v => !v)} aria-label="Toggle menu">
          <svg className="w-6 h-6" fill="none" stroke={scrolled ? "#111827" : "white"} viewBox="0 0 24 24" strokeWidth="2">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-xl px-5 py-5 flex flex-col gap-4">
          {links.map(l => (
            <a key={l.label} href={l.href} onClick={() => setOpen(false)}
              className="text-sm font-medium text-gray-700 hover:text-violet-600 transition-colors py-1">
              {l.label}
            </a>
          ))}
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <a href="/login"     className="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">Log in</a>
            <a href="/dashboard" className="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white">Get Started</a>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ── HERO ────────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#07071a]">
      {/* Background blobs */}
      <div className="absolute -top-56 -right-56 w-[680px] h-[680px] rounded-full bg-violet-700/20 blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-56 -left-56 w-[680px] h-[680px] rounded-full bg-indigo-700/20 blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-fuchsia-700/8 blur-[110px] pointer-events-none" />

      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.022]"
        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.75) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-24 pb-16 flex flex-col lg:flex-row items-center gap-16">

        {/* ── Text side ── */}
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/25 text-violet-300 text-xs font-semibold px-4 py-2 rounded-full mb-8 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            Powered by GPT-4 · Answers in seconds
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-[76px] font-extrabold text-white leading-[1.05] tracking-tight mb-6">
            Chat with any{" "}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
              PDF
            </span>
            {" "}instantly
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed">
            Upload any document and get precise answers in seconds. Extract insights, summarize chapters, and find information — without reading a single page.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <a href="/dashboard"
              className="group inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold px-8 py-4 rounded-full shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-1 transition-all duration-200">
              Get Started Free
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 text-gray-300 font-semibold px-8 py-4 rounded-full border border-gray-700 hover:border-gray-500 hover:text-white transition-all duration-200">
              <svg className="w-5 h-5 text-violet-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              See how it works
            </a>
          </div>

          <p className="mt-6 text-sm text-gray-600">No credit card required · Free plan available · 12,000+ users</p>
        </div>

        {/* ── Mock UI side ── */}
        <div className="flex-1 w-full max-w-lg">
          <MockChatUI />
        </div>
      </div>
    </section>
  );
}

function MockChatUI() {
  const messages = [
    { role: "user", text: "What is the main conclusion of this paper?" },
    { role: "ai",   text: "The paper concludes that transformer-based models outperform traditional NLP methods by 34% on long-document tasks, validated across 5 benchmarks." },
    { role: "user", text: "Summarize section 3 briefly." },
    { role: "ai",   text: "Section 3 covers the fine-tuning methodology — the model was trained on 50k domain-specific documents using a custom RLHF pipeline..." },
  ];

  return (
    <div className="relative select-none">
      {/* Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-600/28 to-indigo-600/28 rounded-3xl blur-2xl scale-[1.07]" />

      <div className="relative bg-gray-900/85 backdrop-blur-sm border border-gray-700/60 rounded-3xl overflow-hidden shadow-2xl">
        {/* Window bar */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-700/50 bg-gray-900/60">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
          <div className="ml-3 flex-1 bg-gray-800/80 rounded-lg px-3 py-1.5 text-[11px] text-gray-500 font-mono tracking-tight">
            aipdfchat.app/dashboard
          </div>
        </div>

        <div className="flex" style={{ height: 400 }}>
          {/* Sidebar */}
          <div className="w-40 bg-gray-950/80 border-r border-gray-800 p-3 flex flex-col gap-1.5">
            <p className="text-[11px] font-bold text-white mb-2 px-1">PDF Chat</p>
            <div className="bg-violet-600/25 border border-violet-500/35 rounded-xl px-2.5 py-2 text-[10px] text-violet-300 font-medium truncate">research_paper.pdf</div>
            {["contract_2024.pdf", "annual_report.pdf", "manual_v3.pdf"].map(f => (
              <div key={f} className="px-2.5 py-2 rounded-xl text-[10px] text-gray-600 truncate">
                {f}
              </div>
            ))}
          </div>

          {/* Chat pane */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-hidden p-4 flex flex-col gap-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "ai" && (
                    <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[8px] font-bold shrink-0">AI</div>
                  )}
                  <div className={`max-w-[82%] text-[10px] leading-relaxed rounded-2xl px-3 py-2 ${
                    m.role === "user"
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-sm"
                      : "bg-white/10 text-gray-300 rounded-bl-sm"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input bar */}
            <div className="p-3 border-t border-gray-700/50">
              <div className="flex items-center gap-2 bg-white/6 border border-gray-700/50 rounded-full px-4 py-2.5">
                <span className="text-[10px] text-gray-500 flex-1">Ask anything about your PDF…</span>
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── SOCIAL PROOF ────────────────────────────────────────────────────────── */
function SocialProof() {
  const logos = ["Y Combinator", "TechCrunch", "Product Hunt", "Forbes", "Hacker News"];
  return (
    <section className="bg-[#07071a] border-t border-gray-800/50 py-12">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 text-center">
        <p className="text-[11px] font-bold text-gray-700 uppercase tracking-[0.18em] mb-7">As featured in</p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
          {logos.map(b => (
            <span key={b} className="text-gray-700 font-bold text-sm md:text-base hover:text-gray-400 transition-colors cursor-default">{b}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── FEATURES ────────────────────────────────────────────────────────────── */
function Features() {
  const cards = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Ask Questions",
      desc: "Type anything about your PDF and receive precise, page-referenced answers instantly — no manual searching.",
      gradient: "from-violet-500 to-purple-600",
      glow: "hover:shadow-violet-500/15",
      ring: "border-violet-500/20 hover:border-violet-500/40",
      bg: "hover:bg-violet-500/5",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Instant Summaries",
      desc: "Summarize any document, chapter, or page in a single click. Save hours of reading time every day.",
      gradient: "from-fuchsia-500 to-pink-600",
      glow: "hover:shadow-fuchsia-500/15",
      ring: "border-fuchsia-500/20 hover:border-fuchsia-500/40",
      bg: "hover:bg-fuchsia-500/5",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      ),
      title: "Smart Search",
      desc: "Semantic search understands what you mean — not just keywords. Find the exact information you need.",
      gradient: "from-cyan-500 to-blue-600",
      glow: "hover:shadow-cyan-500/15",
      ring: "border-cyan-500/20 hover:border-cyan-500/40",
      bg: "hover:bg-cyan-500/5",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
      ),
      title: "Secure Uploads",
      desc: "End-to-end encrypted. Your documents are never shared with third parties. Privacy guaranteed.",
      gradient: "from-emerald-500 to-teal-600",
      glow: "hover:shadow-emerald-500/15",
      ring: "border-emerald-500/20 hover:border-emerald-500/40",
      bg: "hover:bg-emerald-500/5",
    },
  ];

  return (
    <section id="features" className="bg-[#05050f] py-28 px-5 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-violet-400 text-xs font-bold uppercase tracking-[0.16em]">Features</span>
          <h2 className="mt-3 text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              work smarter
            </span>
          </h2>
          <p className="mt-5 text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Stop spending hours reading documents. Let AI extract, summarize, and answer — instantly.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((c, i) => (
            <div key={i} className={`group p-7 rounded-2xl border bg-gray-900/30 ${c.ring} ${c.bg} hover:-translate-y-2 hover:shadow-2xl ${c.glow} transition-all duration-300 cursor-default`}>
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.gradient} flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {c.icon}
              </div>
              <h3 className="text-white font-bold text-lg mb-2.5">{c.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{c.desc}</p>
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
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
        </svg>
      ),
      title: "Upload your PDF",
      desc: "Drag & drop any PDF — contracts, research papers, textbooks, or reports. Up to 100MB supported.",
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
        </svg>
      ),
      title: "AI processes it",
      desc: "Our AI reads, indexes, and understands your document — extracting context and meaning in seconds.",
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
      ),
      title: "Start chatting",
      desc: "Ask anything. Get answers with exact page references. Chat naturally like you would with an expert.",
    },
  ];

  return (
    <section id="how-it-works" className="bg-[#07071a] py-28 px-5 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-violet-400 text-xs font-bold uppercase tracking-[0.16em]">How it works</span>
          <h2 className="mt-3 text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Up and running in{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              3 simple steps
            </span>
          </h2>
          <p className="mt-5 text-gray-400 text-lg">No setup, no learning curve. Just upload and ask.</p>
        </div>

        <div className="relative grid md:grid-cols-3 gap-8 md:gap-12">
          {/* Dashed connector */}
          <div className="hidden md:block absolute top-14 h-px border-t border-dashed border-violet-500/25" style={{ left: "calc(16.66% + 40px)", right: "calc(16.66% + 40px)" }} />

          {steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center text-center group">
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white mb-6 shadow-xl shadow-violet-500/25 group-hover:scale-110 group-hover:shadow-violet-500/40 transition-all duration-300">
                {s.icon}
                <span className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-gray-950 border-2 border-violet-500 text-violet-300 text-[10px] font-black flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <h3 className="text-white font-bold text-xl mb-3">{s.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-[260px]">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── TESTIMONIALS ────────────────────────────────────────────────────────── */
function Testimonials() {
  const items = [
    {
      text: "Literature reviews that used to take 3 days now take a few hours. The answers are accurate and always cite the exact page. Genuinely life-changing for my research.",
      name: "Sarah Chen",
      role: "PhD Researcher, MIT",
      avatar: "SC",
      gradient: "from-violet-500 to-purple-600",
    },
    {
      text: "I process 20+ contracts a week. AI PDF Chat extracts key clauses in seconds. It's like having a paralegal that never sleeps and never misses a detail.",
      name: "Marcus Johnson",
      role: "Corporate Lawyer, NYC",
      avatar: "MJ",
      gradient: "from-fuchsia-500 to-pink-600",
    },
    {
      text: "Our team uses it for competitor analysis. Upload a report, ask 10 questions, walk away with clear insights. The semantic search is genuinely magical.",
      name: "Priya Patel",
      role: "Product Manager, Stripe",
      avatar: "PP",
      gradient: "from-cyan-500 to-blue-600",
    },
  ];

  return (
    <section className="bg-[#05050f] py-28 px-5 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-violet-400 text-xs font-bold uppercase tracking-[0.16em]">Testimonials</span>
          <h2 className="mt-3 text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Loved by{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              thousands
            </span>
          </h2>
          <p className="mt-4 text-gray-500 text-lg">Real results from real users.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {items.map((r, i) => (
            <div key={i} className="bg-gray-900/50 border border-gray-800 hover:border-gray-700 rounded-2xl p-7 flex flex-col gap-5 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
              {/* Stars */}
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-400 text-sm leading-relaxed flex-1">"{r.text}"</p>
              <div className="flex items-center gap-3 pt-3 border-t border-gray-800">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${r.gradient} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {r.avatar}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{r.name}</p>
                  <p className="text-gray-600 text-xs">{r.role}</p>
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
      desc: "Perfect for getting started",
      features: [
        "3 PDF uploads / month",
        "50 questions / month",
        "10 MB max file size",
        "Standard AI model",
        "Email support",
      ],
      cta: "Start for Free",
      href: "/dashboard",
      highlight: false,
    },
    {
      name: "Pro",
      price: "$9",
      period: "/month",
      desc: "For power users and professionals",
      badge: "Most Popular",
      features: [
        "Unlimited PDF uploads",
        "Unlimited questions",
        "100 MB max file size",
        "GPT-4 powered AI",
        "Priority support",
        "Export conversations",
        "Advanced analytics",
      ],
      cta: "Start Pro Trial",
      href: "/dashboard",
      highlight: true,
    },
  ];

  return (
    <section id="pricing" className="bg-[#07071a] py-28 px-5 sm:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-violet-400 text-xs font-bold uppercase tracking-[0.16em]">Pricing</span>
          <h2 className="mt-3 text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Simple,{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              transparent
            </span>
            {" "}pricing
          </h2>
          <p className="mt-4 text-gray-500 text-lg">No hidden fees. No surprises. Cancel anytime.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {plans.map((p, i) => (
            <div key={i} className={`relative flex flex-col rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 ${
              p.highlight
                ? "bg-gradient-to-b from-violet-900/55 to-indigo-900/30 border-2 border-violet-500/55 shadow-2xl shadow-violet-500/15 hover:shadow-violet-500/25"
                : "bg-gray-900/50 border border-gray-800 hover:border-gray-700 hover:shadow-xl"
            }`}>
              {p.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                    {p.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-white font-bold text-2xl">{p.name}</h3>
                <p className="text-gray-500 text-sm mt-1">{p.desc}</p>
              </div>

              <div className="flex items-end gap-1.5 mb-8">
                <span className="text-5xl font-extrabold text-white tracking-tight">{p.price}</span>
                <span className="text-gray-500 text-sm mb-2">{p.period}</span>
              </div>

              <ul className="space-y-3.5 mb-8 flex-1">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-gray-400">
                    <svg className="w-4 h-4 text-violet-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <a href={p.href} className={`block text-center font-semibold py-3.5 rounded-xl transition-all duration-200 ${
                p.highlight
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
              }`}>
                {p.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-600 text-sm mt-8">
          All plans include 14-day free trial · No credit card required
        </p>
      </div>
    </section>
  );
}

/* ── FINAL CTA ───────────────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section className="bg-[#05050f] py-28 px-5 sm:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 p-14 sm:p-20 text-center">
          {/* Decorations */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="relative">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-5 leading-tight">
              Start chatting with your<br />PDFs today
            </h2>
            <p className="text-white/70 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
              Join 12,000+ researchers, lawyers, and professionals who use AI PDF Chat to work smarter every day.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/dashboard"
                className="group inline-flex items-center justify-center gap-2.5 bg-white text-violet-700 font-bold px-9 py-4 rounded-full hover:bg-gray-100 hover:-translate-y-1 hover:shadow-2xl transition-all duration-200">
                Get Started — It&apos;s Free
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <a href="#pricing"
                className="inline-flex items-center justify-center text-white font-semibold px-9 py-4 rounded-full border border-white/30 hover:bg-white/10 transition-all duration-200">
                View Pricing
              </a>
            </div>
            <p className="mt-7 text-white/40 text-sm">No credit card required · Cancel anytime · Free plan available</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── FOOTER ──────────────────────────────────────────────────────────────── */
function Footer() {
  const year = new Date().getFullYear();
  const cols = [
    { title: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap"] },
    { title: "Company", links: ["About", "Blog", "Careers", "Press"] },
    { title: "Legal",   links: ["Privacy Policy", "Terms of Service", "Cookies", "GDPR"] },
  ];

  return (
    <footer className="bg-[#03030a] border-t border-gray-800/60 py-16 px-5 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10 mb-14">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-white font-bold text-base">AI PDF Chat</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-5">
              The smartest way to extract insights from your documents using AI.
            </p>
            <div className="flex gap-3">
              {["Twitter", "GitHub", "LinkedIn"].map(s => (
                <a key={s} href="#" className="text-gray-700 hover:text-gray-400 text-xs transition-colors">{s}</a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {cols.map(c => (
            <div key={c.title}>
              <h4 className="text-white font-semibold text-sm mb-5">{c.title}</h4>
              <ul className="space-y-3">
                {c.links.map(l => (
                  <li key={l}>
                    <a href="#" className="text-gray-600 hover:text-gray-300 text-sm transition-colors duration-200">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800/60 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-700 text-sm">© {year} AI PDF Chat, Inc. All rights reserved.</p>
          <p className="text-gray-700 text-xs">Built with ❤️ using Next.js + Tailwind CSS</p>
        </div>
      </div>
    </footer>
  );
}

/* ── PAGE ────────────────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <main className="overflow-x-hidden">
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
