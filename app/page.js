"use client";

import { useState, useEffect } from "react";

/* ─── NAVBAR ─────────────────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-100"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className={`text-lg font-bold tracking-tight transition-colors ${scrolled ? "text-gray-900" : "text-white"}`}>
            AI PDF Chat
          </span>
        </a>

        {/* Desktop links */}
        <div className={`hidden md:flex items-center gap-8 text-sm font-medium transition-colors ${scrolled ? "text-gray-600" : "text-white/80"}`}>
          <a href="#features"     className="hover:text-violet-500 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-violet-500 transition-colors">How it works</a>
          <a href="#pricing"      className="hover:text-violet-500 transition-colors">Pricing</a>
        </div>

        {/* CTA buttons */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="/login"
            className={`text-sm font-medium transition-colors px-4 py-2 rounded-xl hover:bg-white/10 ${scrolled ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100" : "text-white/80 hover:text-white"}`}
          >
            Log in
          </a>
          <a
            href="/dashboard"
            className="text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-full hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-200"
          >
            Get Started Free
          </a>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2" onClick={() => setMobileOpen(v => !v)}>
          <svg className="w-6 h-6" fill="none" stroke={scrolled ? "#1f2937" : "white"} viewBox="0 0 24 24" strokeWidth="2">
            {mobileOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-5 py-5 flex flex-col gap-4 shadow-xl">
          <a href="#features"     onClick={() => setMobileOpen(false)} className="text-sm font-medium text-gray-700 hover:text-violet-600 transition-colors">Features</a>
          <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-gray-700 hover:text-violet-600 transition-colors">How it works</a>
          <a href="#pricing"      onClick={() => setMobileOpen(false)} className="text-sm font-medium text-gray-700 hover:text-violet-600 transition-colors">Pricing</a>
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <a href="/login"     className="flex-1 text-sm font-semibold text-center py-2.5 rounded-xl border border-gray-200 text-gray-700">Log in</a>
            <a href="/dashboard" className="flex-1 text-sm font-semibold text-center py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white">Get Started</a>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ─── HERO ───────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#080812]">
      {/* Decorative blobs */}
      <div className="absolute -top-48 -right-48 w-[640px] h-[640px] rounded-full bg-violet-700/25 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-48 -left-48 w-[640px] h-[640px] rounded-full bg-indigo-700/25 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-fuchsia-700/10 blur-[100px] pointer-events-none" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-24 pb-16 flex flex-col lg:flex-row items-center gap-16">
        {/* Left: text */}
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/25 text-violet-300 text-xs font-semibold px-4 py-2 rounded-full mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Powered by GPT-4 · Instant answers
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-extrabold text-white leading-[1.06] tracking-tight mb-6">
            Chat with any{" "}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
              PDF
            </span>{" "}
            instantly
          </h1>

          <p className="text-lg text-gray-400 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
            Upload any document and get precise AI answers in seconds. Extract insights, summarize chapters, and find information — without reading a single page.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <a
              href="/dashboard"
              className="group inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold px-8 py-4 rounded-full hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/40 transition-all duration-200"
            >
              Get Started Free
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 text-gray-300 font-semibold px-8 py-4 rounded-full border border-gray-700 hover:border-gray-500 hover:text-white transition-all duration-200"
            >
              <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              See Demo
            </a>
          </div>
          <p className="mt-6 text-sm text-gray-600">No credit card · Free plan available · 10,000+ users</p>
        </div>

        {/* Right: Mock UI */}
        <div className="flex-1 w-full max-w-lg">
          <HeroMockUI />
        </div>
      </div>
    </section>
  );
}

function HeroMockUI() {
  const msgs = [
    { role: "user", text: "What is the main conclusion of this research?" },
    { role: "ai",   text: "The paper concludes that transformer-based models outperform traditional NLP methods by 34% accuracy on long-document tasks." },
    { role: "user", text: "Summarize section 3 briefly." },
    { role: "ai",   text: "Section 3 covers the fine-tuning methodology — the model was trained on 50k domain-specific documents using a custom pipeline..." },
  ];
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-violet-600/30 to-indigo-600/30 rounded-3xl blur-2xl scale-[1.06]" />
      <div className="relative bg-gray-900/85 backdrop-blur-sm border border-gray-700/60 rounded-3xl overflow-hidden shadow-2xl">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-700/50 bg-gray-900/60">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
          <div className="ml-3 flex-1 bg-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-500 font-mono">aipdfchat.app/dashboard</div>
        </div>

        <div className="flex" style={{ height: 400 }}>
          {/* Sidebar */}
          <div className="w-40 bg-gray-950/80 border-r border-gray-800 p-3 flex flex-col gap-1.5">
            <div className="text-xs font-bold text-white mb-2 px-1">PDF Chat</div>
            <div className="bg-violet-600/25 border border-violet-500/30 rounded-xl px-2.5 py-2 text-[10px] text-violet-300 font-medium truncate">research_paper.pdf</div>
            {["contract_2024.pdf", "manual_v3.pdf", "report_q4.pdf"].map((f) => (
              <div key={f} className="px-2.5 py-2 rounded-xl text-[10px] text-gray-600 hover:bg-white/5 truncate transition-colors">{f}</div>
            ))}
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-hidden p-4 flex flex-col gap-3">
              {msgs.map((m, i) => (
                <div key={i} className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "ai" && (
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">AI</div>
                  )}
                  <div className={`max-w-[82%] text-[10px] leading-relaxed rounded-2xl px-3 py-2 ${m.role === "user" ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-sm" : "bg-white/10 text-gray-300 rounded-bl-sm"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-gray-700/50">
              <div className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-2.5">
                <span className="text-[10px] text-gray-500 flex-1">Ask anything about your PDF…</span>
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── TRUSTED BY ─────────────────────────────────────────────────────────── */
function TrustedBy() {
  const brands = ["Y Combinator", "TechCrunch", "Product Hunt", "Forbes", "Hacker News"];
  return (
    <section className="bg-[#080812] border-t border-gray-800/60 py-14">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 text-center">
        <p className="text-[11px] font-bold text-gray-600 uppercase tracking-[0.18em] mb-8">Trusted by teams at</p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
          {brands.map((b) => (
            <span key={b} className="text-gray-700 font-bold text-base hover:text-gray-400 transition-colors cursor-default">{b}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FEATURES ───────────────────────────────────────────────────────────── */
function Features() {
  const cards = [
    {
      emoji: "💬",
      title: "Ask Questions",
      desc: "Type anything about your PDF and get precise, page-referenced answers instantly — no manual searching.",
      bg: "from-violet-500/10 to-purple-500/5",
      border: "border-violet-500/20",
      iconBg: "from-violet-500 to-purple-600",
    },
    {
      emoji: "⚡",
      title: "Instant Summaries",
      desc: "Get a full summary of any document, chapter, or page in one click. Save hours of reading.",
      bg: "from-fuchsia-500/10 to-pink-500/5",
      border: "border-fuchsia-500/20",
      iconBg: "from-fuchsia-500 to-pink-600",
    },
    {
      emoji: "🔍",
      title: "Smart Search",
      desc: "Semantic search understands meaning — not just keywords. Find exactly what you need instantly.",
      bg: "from-cyan-500/10 to-blue-500/5",
      border: "border-cyan-500/20",
      iconBg: "from-cyan-500 to-blue-600",
    },
    {
      emoji: "🔒",
      title: "Secure Uploads",
      desc: "End-to-end encrypted. Your documents are never shared. Privacy guaranteed, always.",
      bg: "from-emerald-500/10 to-teal-500/5",
      border: "border-emerald-500/20",
      iconBg: "from-emerald-500 to-teal-600",
    },
  ];

  return (
    <section id="features" className="bg-[#06060f] py-28 px-5 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-violet-400 text-xs font-bold uppercase tracking-[0.15em]">Features</span>
          <h2 className="mt-3 text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">work smarter</span>
          </h2>
          <p className="mt-4 text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Stop spending hours reading documents. Let AI extract what matters most.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((c, i) => (
            <div key={i} className={`group p-7 rounded-2xl bg-gradient-to-br ${c.bg} border ${c.border} hover:-translate-y-2 hover:shadow-2xl hover:shadow-violet-500/10 transition-all duration-300 cursor-default`}>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.iconBg} flex items-center justify-center text-xl mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {c.emoji}
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{c.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{c.desc}</p>
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
    { n: "01", emoji: "📤", title: "Upload your PDF",  desc: "Drag & drop any PDF — contracts, research papers, textbooks, reports. Up to 100MB supported." },
    { n: "02", emoji: "🤖", title: "AI processes it",  desc: "Our AI reads, indexes, and understands your document — extracting context and meaning in seconds." },
    { n: "03", emoji: "💬", title: "Start chatting",   desc: "Ask anything. Get answers with exact page references. Chat naturally like with a human expert." },
  ];

  return (
    <section id="how-it-works" className="bg-[#080812] py-28 px-5 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-violet-400 text-xs font-bold uppercase tracking-[0.15em]">How it works</span>
          <h2 className="mt-3 text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Up and running in{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">3 steps</span>
          </h2>
          <p className="mt-4 text-gray-400 text-lg">No setup, no learning curve.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-10 relative">
          {/* Connector */}
          <div className="hidden md:block absolute top-14 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" style={{ left: "22%", right: "22%" }} />

          {steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center text-center group">
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-2xl shadow-xl shadow-violet-500/25 mb-6 group-hover:scale-110 transition-transform duration-300">
                {s.emoji}
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-950 border-2 border-violet-500 text-violet-400 text-[10px] font-black flex items-center justify-center">{i + 1}</span>
              </div>
              <h3 className="text-white font-bold text-xl mb-3">{s.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{s.desc}</p>
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
    { name: "Sarah Chen",     role: "PhD Researcher, MIT",     av: "SC", grad: "from-violet-500 to-purple-600", text: "Literature reviews that took 3 days now take a few hours. The answers are accurate and always cite the exact page. Genuinely life-changing." },
    { name: "Marcus Johnson", role: "Corporate Lawyer, NYC",   av: "MJ", grad: "from-fuchsia-500 to-pink-600",  text: "I process 20+ contracts per week. This tool extracts key clauses instantly. It's like having a paralegal that never sleeps." },
    { name: "Priya Patel",    role: "Product Manager, Stripe", av: "PP", grad: "from-cyan-500 to-blue-600",     text: "Upload a report, ask 10 questions, walk away with clear insights. The smart search feature is genuinely magical." },
  ];

  return (
    <section className="bg-[#06060f] py-28 px-5 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-violet-400 text-xs font-bold uppercase tracking-[0.15em]">Testimonials</span>
          <h2 className="mt-3 text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Loved by{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">thousands</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((r, i) => (
            <div key={i} className="bg-gray-900/50 border border-gray-800 hover:border-gray-700 rounded-2xl p-7 flex flex-col gap-5 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>
              <p className="text-gray-400 text-sm leading-relaxed flex-1">"{r.text}"</p>
              <div className="flex items-center gap-3 pt-3 border-t border-gray-800">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${r.grad} flex items-center justify-center text-white text-xs font-bold shrink-0`}>{r.av}</div>
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

/* ─── PRICING ────────────────────────────────────────────────────────────── */
function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      desc: "Perfect to get started",
      features: ["3 PDFs / month", "50 questions / month", "10MB max file size", "Standard AI model", "Email support"],
      cta: "Start for Free",
      href: "/dashboard",
      highlight: false,
    },
    {
      name: "Pro",
      price: "$9",
      period: "/month",
      desc: "For power users & teams",
      badge: "Most Popular",
      features: ["Unlimited PDFs", "Unlimited questions", "100MB max file size", "GPT-4 powered AI", "Priority support", "Export conversations", "Advanced analytics"],
      cta: "Start Pro Trial",
      href: "/dashboard",
      highlight: true,
    },
  ];

  return (
    <section id="pricing" className="bg-[#080812] py-28 px-5 sm:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-violet-400 text-xs font-bold uppercase tracking-[0.15em]">Pricing</span>
          <h2 className="mt-3 text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Simple,{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">transparent</span>
            {" "}pricing
          </h2>
          <p className="mt-4 text-gray-500 text-lg">No hidden fees. No surprises. Cancel anytime.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {plans.map((p, i) => (
            <div key={i} className={`relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 ${p.highlight ? "bg-gradient-to-b from-violet-900/50 to-indigo-900/30 border-2 border-violet-500/50 shadow-2xl shadow-violet-500/15" : "bg-gray-900/50 border border-gray-800 hover:border-gray-700"}`}>
              {p.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">{p.badge}</span>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-white font-bold text-xl">{p.name}</h3>
                <p className="text-gray-500 text-sm mt-1">{p.desc}</p>
              </div>
              <div className="flex items-end gap-1.5 mb-8">
                <span className="text-5xl font-extrabold text-white">{p.price}</span>
                <span className="text-gray-500 text-sm mb-2">{p.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-gray-400">
                    <svg className="w-4 h-4 text-violet-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <a href={p.href} className={`block text-center font-semibold py-3.5 rounded-xl transition-all duration-200 ${p.highlight ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5" : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"}`}>
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
    <section className="bg-[#06060f] py-28 px-5 sm:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 p-16 text-center">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="relative">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-5 leading-tight">
              Start chatting with your<br />PDFs today
            </h2>
            <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
              Join 10,000+ researchers, lawyers, and professionals using AI PDF Chat.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/dashboard" className="group inline-flex items-center justify-center gap-2 bg-white text-violet-700 font-bold px-8 py-4 rounded-full hover:bg-gray-100 hover:-translate-y-1 hover:shadow-2xl transition-all duration-200">
                Get Started — It&apos;s Free
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </a>
              <a href="#pricing" className="inline-flex items-center justify-center text-white font-semibold px-8 py-4 rounded-full border border-white/30 hover:bg-white/10 transition-all duration-200">
                View Pricing
              </a>
            </div>
            <p className="mt-6 text-white/40 text-sm">No credit card required · Cancel anytime</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ─────────────────────────────────────────────────────────────── */
function Footer() {
  const cols = [
    { title: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap"] },
    { title: "Company", links: ["About", "Blog", "Careers", "Press"] },
    { title: "Legal",   links: ["Privacy Policy", "Terms of Service", "Cookies", "GDPR"] },
  ];
  return (
    <footer className="bg-[#04040a] border-t border-gray-800/50 py-16 px-5 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <span className="text-white font-bold">AI PDF Chat</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">The smartest way to extract insights from documents using AI.</p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-white font-semibold text-sm mb-4">{c.title}</h4>
              <ul className="space-y-3">
                {c.links.map((l) => <li key={l}><a href="#" className="text-gray-600 hover:text-gray-300 text-sm transition-colors">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-800/50 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-700 text-sm">© {new Date().getFullYear()} AI PDF Chat. All rights reserved.</p>
          <div className="flex items-center gap-6">
            {["Twitter", "GitHub", "LinkedIn"].map((s) => <a key={s} href="#" className="text-gray-700 hover:text-gray-400 text-sm transition-colors">{s}</a>)}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── PAGE EXPORT ────────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <TrustedBy />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  );
}
