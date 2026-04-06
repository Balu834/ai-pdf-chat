"use client";

import { useState, useEffect } from "react";

// ─── NAVBAR ──────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className={`text-lg font-bold transition-colors ${scrolled ? "text-gray-900" : "text-white"}`}>
            AI PDF Chat
          </span>
        </div>

        <div className={`hidden md:flex items-center gap-8 text-sm font-medium transition-colors ${scrolled ? "text-gray-600" : "text-white/80"}`}>
          <a href="#features" className="hover:text-violet-600 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-violet-600 transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-violet-600 transition-colors">Pricing</a>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/login"
            className={`text-sm font-medium transition-colors ${scrolled ? "text-gray-600 hover:text-gray-900" : "text-white/80 hover:text-white"}`}
          >
            Log in
          </a>
          <a
            href="/dashboard"
            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:shadow-lg hover:shadow-violet-500/25 hover:-translate-y-0.5 transition-all duration-200"
          >
            Get Started Free
          </a>
        </div>
      </div>
    </nav>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0f]">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-violet-900/10 blur-[80px]" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 flex flex-col lg:flex-row items-center gap-16">
        {/* Left: text */}
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold px-4 py-2 rounded-full mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            Powered by GPT-4 AI
          </div>

          <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
            Chat with any{" "}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
              PDF
            </span>{" "}
            instantly
          </h1>

          <p className="text-lg text-gray-400 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
            Upload your document and get answers in seconds using AI. Extract insights, summarize pages, and find information — without reading a single line.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <a
              href="/dashboard"
              className="group bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold px-8 py-4 rounded-full text-base hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2"
            >
              Get Started Free
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              href="#how-it-works"
              className="flex items-center justify-center gap-2 text-gray-300 font-semibold px-8 py-4 rounded-full border border-gray-700 hover:border-gray-500 hover:text-white transition-all duration-200"
            >
              <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              View Demo
            </a>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            No credit card required · Free forever plan
          </p>
        </div>

        {/* Right: mock UI */}
        <div className="flex-1 w-full max-w-lg">
          <MockUI />
        </div>
      </div>
    </section>
  );
}

// ─── MOCK UI PREVIEW ─────────────────────────────────────────────────────────
function MockUI() {
  const messages = [
    { role: "user", text: "What is the main conclusion of this paper?" },
    { role: "ai", text: "The paper concludes that transformer-based models significantly outperform traditional NLP methods on long-document tasks, with a 34% improvement in accuracy." },
    { role: "user", text: "Can you summarize section 3?" },
    { role: "ai", text: "Section 3 covers the methodology — specifically how the authors fine-tuned the base model on a domain-specific dataset of 50,000 documents..." },
  ];

  return (
    <div className="relative">
      {/* Glow behind card */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-600/30 to-indigo-600/30 rounded-2xl blur-xl scale-105" />

      <div className="relative bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden shadow-2xl">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700/50 bg-gray-900/50">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
          <div className="ml-3 flex-1 bg-gray-800 rounded-md px-3 py-1 text-xs text-gray-500 font-mono">
            aipdfchat.com/chat
          </div>
        </div>

        <div className="flex h-[420px]">
          {/* PDF panel */}
          <div className="w-2/5 border-r border-gray-700/50 bg-gray-950/50 p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                <path d="M14 2v6h6M9 15h6M9 11h3" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              </svg>
              <span className="text-xs text-gray-400 truncate">research_paper.pdf</span>
            </div>
            {[92, 85, 70, 88, 60, 75, 82, 65].map((w, i) => (
              <div key={i} className="flex gap-1.5 items-start">
                <div className="w-1 shrink-0 h-full bg-gray-700 rounded-full mt-1" />
                <div className="flex flex-col gap-1 w-full">
                  <div className={`h-1.5 rounded-full bg-gray-700`} style={{ width: `${w}%` }} />
                  <div className="h-1.5 rounded-full bg-gray-700" style={{ width: `${w - 15}%` }} />
                </div>
              </div>
            ))}
            <div className="mt-auto">
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-2 text-center">
                <p className="text-violet-300 text-xs font-medium">Page 1 of 24</p>
              </div>
            </div>
          </div>

          {/* Chat panel */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-hidden p-3 flex flex-col gap-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "ai" && (
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center mr-1.5 mt-0.5 shrink-0 text-white text-[8px] font-bold">AI</div>
                  )}
                  <div
                    className={`max-w-[85%] text-[10px] leading-relaxed rounded-xl px-2.5 py-1.5 ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-sm"
                        : "bg-gray-800 text-gray-300 rounded-bl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-700/50">
              <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2">
                <span className="text-xs text-gray-500 flex-1">Ask anything about your PDF...</span>
                <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
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

// ─── LOGOS / SOCIAL PROOF ────────────────────────────────────────────────────
function TrustedBy() {
  const logos = ["Y Combinator", "TechCrunch", "Product Hunt", "Hacker News", "Forbes"];
  return (
    <section className="bg-[#0a0a0f] border-t border-gray-800/50 py-12">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <p className="text-sm text-gray-500 font-medium uppercase tracking-widest mb-8">
          Trusted by teams at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {logos.map((logo) => (
            <span key={logo} className="text-gray-600 font-bold text-lg hover:text-gray-400 transition-colors cursor-default">
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FEATURES ────────────────────────────────────────────────────────────────
function Features() {
  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Ask Questions",
      description: "Type any question about your PDF and get precise, context-aware answers in seconds — no more manual searching.",
      gradient: "from-violet-500 to-purple-600",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Instant Summaries",
      description: "Get a concise summary of any document, chapter, or page in one click. Save hours of reading time.",
      gradient: "from-fuchsia-500 to-pink-600",
      bg: "bg-fuchsia-500/10",
      border: "border-fuchsia-500/20",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      title: "Smart Search",
      description: "Semantic search understands what you mean — not just keywords. Find the exact section you need instantly.",
      gradient: "from-cyan-500 to-blue-600",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: "Secure Uploads",
      description: "Your documents are encrypted end-to-end and never shared. We take privacy seriously — always.",
      gradient: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
  ];

  return (
    <section id="features" className="bg-[#08080d] py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block text-violet-400 text-sm font-semibold uppercase tracking-widest mb-4">Features</span>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-5">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              work smarter
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Stop spending hours reading documents. Let AI do the heavy lifting while you focus on what matters.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className={`group relative p-6 rounded-2xl border ${f.border} ${f.bg} hover:scale-[1.02] hover:shadow-xl transition-all duration-300 cursor-default`}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} text-white mb-4 shadow-lg`}>
                {f.icon}
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Upload your PDF",
      description: "Drag and drop any PDF — contracts, research papers, textbooks, reports. Any size, up to 100MB.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
    },
    {
      step: "02",
      title: "AI processes it",
      description: "Our AI reads, indexes, and understands your document — extracting context, structure, and meaning in seconds.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      step: "03",
      title: "Start chatting",
      description: "Ask anything. Get answers with page references. Chat naturally like you would with a human expert.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="bg-[#0a0a0f] py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block text-violet-400 text-sm font-semibold uppercase tracking-widest mb-4">How it works</span>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-5">
            Up and running in{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              3 simple steps
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            No setup, no learning curve. Just upload, process, and chat.
          </p>
        </div>

        <div className="relative grid md:grid-cols-3 gap-8">
          {/* Connector line */}
          <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-px bg-gradient-to-r from-violet-500/20 via-violet-500/50 to-violet-500/20" style={{ left: "calc(16.66% + 2rem)", right: "calc(16.66% + 2rem)" }} />

          {steps.map((s, i) => (
            <div key={i} className="relative flex flex-col items-center text-center group">
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white mb-6 shadow-xl shadow-violet-500/20 group-hover:scale-110 transition-transform duration-300">
                {s.icon}
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-900 border-2 border-violet-500 text-violet-400 text-[10px] font-black flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <h3 className="text-white font-bold text-xl mb-3">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────
function Testimonials() {
  const reviews = [
    {
      name: "Sarah Chen",
      role: "PhD Researcher, MIT",
      avatar: "SC",
      color: "from-violet-500 to-purple-600",
      text: "AI PDF Chat has completely transformed how I do literature reviews. What used to take me 3 days now takes a few hours. The answers are accurate and it always cites the exact page.",
      stars: 5,
    },
    {
      name: "Marcus Johnson",
      role: "Corporate Lawyer, NY",
      avatar: "MJ",
      color: "from-fuchsia-500 to-pink-600",
      text: "I process 20+ contracts per week. This tool lets me instantly extract key clauses and obligations. It's like having a paralegal that never sleeps. Absolutely worth every penny.",
      stars: 5,
    },
    {
      name: "Priya Patel",
      role: "Product Manager, Stripe",
      avatar: "PP",
      color: "from-cyan-500 to-blue-600",
      text: "Our team uses it for competitor analysis and market research. Upload a report, ask 10 questions, and walk away with clear insights. The smart search feature is genuinely magical.",
      stars: 5,
    },
  ];

  return (
    <section className="bg-[#08080d] py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block text-violet-400 text-sm font-semibold uppercase tracking-widest mb-4">Testimonials</span>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-5">
            Loved by{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              thousands
            </span>
          </h2>
          <p className="text-gray-400 text-lg">Real results from real users.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((r, i) => (
            <div
              key={i}
              className="group bg-gray-900/50 border border-gray-800 hover:border-gray-600 rounded-2xl p-7 flex flex-col gap-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex gap-0.5">
                {Array(r.stars).fill(0).map((_, j) => (
                  <svg key={j} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed flex-1">"{r.text}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-gray-800">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${r.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {r.avatar}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{r.name}</p>
                  <p className="text-gray-500 text-xs">{r.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── PRICING ──────────────────────────────────────────────────────────────────
function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "3 PDF uploads / month",
        "50 questions / month",
        "10MB max file size",
        "Standard AI model",
        "Email support",
      ],
      cta: "Get Started Free",
      href: "/dashboard",
      highlight: false,
    },
    {
      name: "Pro",
      price: "$9",
      period: "per month",
      description: "For power users and professionals",
      features: [
        "Unlimited PDF uploads",
        "Unlimited questions",
        "100MB max file size",
        "GPT-4 powered AI",
        "Priority support",
        "Export conversations",
        "Advanced analytics",
      ],
      cta: "Start Pro Trial",
      href: "/dashboard",
      highlight: true,
      badge: "Most Popular",
    },
  ];

  return (
    <section id="pricing" className="bg-[#0a0a0f] py-28 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block text-violet-400 text-sm font-semibold uppercase tracking-widest mb-4">Pricing</span>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-5">
            Simple,{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              transparent
            </span>{" "}
            pricing
          </h2>
          <p className="text-gray-400 text-lg">No hidden fees. No surprises. Cancel anytime.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                plan.highlight
                  ? "bg-gradient-to-b from-violet-900/50 to-indigo-900/30 border-2 border-violet-500/50 shadow-2xl shadow-violet-500/20 hover:-translate-y-1"
                  : "bg-gray-900/50 border border-gray-800 hover:border-gray-600 hover:-translate-y-1"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-white font-bold text-xl mb-1">{plan.name}</h3>
                <p className="text-gray-400 text-sm">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-gray-400 text-sm mb-2">/ {plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-violet-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={plan.href}
                className={`block text-center font-semibold py-3.5 rounded-xl transition-all duration-200 ${
                  plan.highlight
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5"
                    : "bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FINAL CTA ────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="bg-[#08080d] py-28 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 p-16 text-center">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
          </div>

          <div className="relative z-10">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-5 leading-tight">
              Start chatting with your
              <br />
              PDFs today
            </h2>
            <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
              Join 10,000+ researchers, lawyers, and professionals who use AI PDF Chat to work smarter.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/dashboard"
                className="group bg-white text-violet-700 font-bold px-8 py-4 rounded-full hover:bg-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2"
              >
                Get Started — It's Free
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <a
                href="#pricing"
                className="text-white font-semibold px-8 py-4 rounded-full border border-white/30 hover:bg-white/10 transition-all duration-200"
              >
                View Pricing
              </a>
            </div>
            <p className="mt-6 text-white/50 text-sm">No credit card required · Cancel anytime</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[#06060a] border-t border-gray-800/50 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-white font-bold text-lg">AI PDF Chat</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              The smartest way to extract insights from your documents using AI.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Product</h4>
            <ul className="space-y-3">
              {["Features", "Pricing", "Changelog", "Roadmap"].map(link => (
                <li key={link}>
                  <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-3">
              {["About", "Blog", "Careers", "Press"].map(link => (
                <li key={link}>
                  <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-3">
              {["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR"].map(link => (
                <li key={link}>
                  <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} AI PDF Chat. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {["Twitter", "GitHub", "LinkedIn"].map(s => (
              <a key={s} href="#" className="text-gray-600 hover:text-gray-300 text-sm transition-colors">{s}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <main className="min-h-screen">
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
