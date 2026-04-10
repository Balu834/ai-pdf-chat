import ProPlanCTA from "@/components/ProPlanCTA";

export const metadata = {
  title: "Intellixy — Chat with your PDFs using AI",
  description:
    "Upload any PDF and get instant answers, summaries, and key insights in seconds.",
};

/* ── Small reusable icon components ───────────────────────────────────────── */
function CheckIcon({ color = "#a78bfa" }) {
  return (
    <svg width="15" height="15" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "#07071a", color: "#fff", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", overflowX: "hidden" }}>

      {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(7,7,26,0.92)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center justify-between mx-auto px-5" style={{ maxWidth: 1200, height: 64 }}>
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 no-underline">
            <div className="flex items-center justify-center rounded-xl" style={{ width: 34, height: 34, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", boxShadow: "0 4px 16px rgba(124,58,237,0.4)" }}>
              <PdfIcon />
            </div>
            <span className="font-extrabold text-lg text-white" style={{ letterSpacing: "-0.3px" }}>Intellixy</span>
          </a>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {[["#features","Features"],["#how-it-works","How it works"],["#pricing","Pricing"]].map(([href, label]) => (
              <a key={label} href={href} className="hidden md:block text-sm px-3 py-1.5 rounded-lg transition-colors" style={{ color: "rgba(255,255,255,0.5)" }}>
                {label}
              </a>
            ))}
            <a href="/login" className="text-sm font-medium px-4 py-2 rounded-lg transition-colors" style={{ color: "rgba(255,255,255,0.65)" }}>
              Log in
            </a>
            <a href="/login" className="btn-primary text-sm font-bold text-white px-5 py-2 rounded-full no-underline" style={{ boxShadow: "0 4px 20px rgba(124,58,237,0.35)" }}>
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="relative flex items-center justify-center overflow-hidden" style={{ minHeight: "100vh", paddingTop: 64 }}>
        {/* Background glows */}
        <div className="absolute pointer-events-none" style={{ top: "-15%", left: "-8%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.2),transparent 68%)", filter: "blur(80px)" }} />
        <div className="absolute pointer-events-none" style={{ bottom: "-10%", right: "-5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(6,182,212,0.13),transparent 68%)", filter: "blur(80px)" }} />

        <div className="relative text-center px-6 py-20 w-full mx-auto" style={{ maxWidth: 900 }}>

          {/* Badge */}
          <div className="animate-fadeUp inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-7 text-xs font-bold uppercase tracking-widest" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)", color: "#c4b5fd", letterSpacing: "0.1em" }}>
            <span className="animate-pulse-dot inline-block rounded-full" style={{ width: 7, height: 7, background: "#a78bfa" }} />
            AI-Powered · Instant Answers from Any PDF
          </div>

          {/* Headline */}
          <h1 className="animate-fadeUp2 font-black text-white mb-6" style={{ fontSize: "clamp(2.6rem,6.5vw,4.8rem)", lineHeight: 1.07, letterSpacing: "-2px" }}>
            Chat with your PDFs{" "}
            <span className="gradient-text">using AI</span>{" "}
            <span className="animate-float inline-block">🤖</span>
          </h1>

          {/* Subtext */}
          <p className="animate-fadeUp3 mx-auto mb-3" style={{ fontSize: "clamp(1rem,2.5vw,1.2rem)", color: "rgba(255,255,255,0.5)", lineHeight: 1.8, maxWidth: 560 }}>
            Upload any PDF and get instant answers, summaries, and key insights in seconds.
          </p>
          <p className="animate-fadeUp3 mb-9 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            Works for invoices · research papers · contracts · study notes
          </p>

          {/* CTA Buttons */}
          <div className="animate-fadeUp4 flex flex-wrap gap-3 justify-center mb-4">
            <a href="/login" className="btn-primary text-base font-extrabold text-white no-underline rounded-full" style={{ padding: "16px 38px", boxShadow: "0 10px 40px rgba(124,58,237,0.45)", letterSpacing: "-0.3px" }}>
              Try for Free →
            </a>
            <a href="#demo" className="text-base font-semibold no-underline rounded-full transition-all" style={{ color: "rgba(255,255,255,0.65)", padding: "16px 32px", border: "1px solid rgba(255,255,255,0.14)" }}>
              ▶ View Demo
            </a>
          </div>
          <p className="text-xs mb-12" style={{ color: "rgba(255,255,255,0.25)" }}>
            No credit card required · Free forever plan
          </p>

          {/* Social proof */}
          <div className="inline-flex items-center gap-3 rounded-full px-5 py-2 mb-14" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex">
              {["#a78bfa","#06b6d4","#f472b6","#34d399","#fbbf24"].map((c, i) => (
                <div key={c} className="flex items-center justify-center rounded-full text-xs font-bold" style={{ width: 26, height: 26, background: `${c}22`, border: `2px solid ${c}88`, marginLeft: i === 0 ? 0 : -8, color: c }}>
                  {["A","R","S","K","M"][i]}
                </div>
              ))}
            </div>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(s => <span key={s} className="text-sm" style={{ color: "#fbbf24" }}>★</span>)}
            </div>
            <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
              Loved by <strong className="text-white">100+</strong> early users
            </span>
          </div>

          {/* Dashboard mockup */}
          <div className="hidden md:block rounded-2xl overflow-hidden mx-auto" style={{ maxWidth: 700, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 60px 120px rgba(0,0,0,0.6)" }}>
            {/* Top glow line */}
            <div style={{ height: 2, background: "linear-gradient(90deg,transparent,rgba(124,58,237,0.6),transparent)" }} />
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.2)" }}>
              {["rgba(239,68,68,0.65)","rgba(234,179,8,0.65)","rgba(34,197,94,0.65)"].map((c, i) => (
                <div key={i} className="rounded-full" style={{ width: 12, height: 12, background: c }} />
              ))}
              <span className="ml-2 flex-1 text-center text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>intellixy.app — dashboard</span>
            </div>
            {/* App content */}
            <div className="flex" style={{ height: 220 }}>
              {/* Sidebar */}
              <div className="flex-shrink-0 p-3" style={{ width: 165, background: "rgba(0,0,0,0.3)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-xs font-bold uppercase mb-2" style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em" }}>Documents</p>
                {[["Q4 Report.pdf", true], ["Contract_2024.pdf", false], ["Research Paper.pdf", false]].map(([name, active]) => (
                  <div key={name} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg mb-1 text-xs" style={{ background: active ? "rgba(124,58,237,0.22)" : "transparent", border: active ? "1px solid rgba(124,58,237,0.28)" : "1px solid transparent", color: active ? "#c4b5fd" : "rgba(255,255,255,0.3)" }}>
                    <PdfIcon /> <span className="truncate">{name}</span>
                  </div>
                ))}
              </div>
              {/* Chat */}
              <div className="flex-1 flex flex-col justify-end gap-3 p-4" style={{ background: "rgba(7,7,26,0.5)" }}>
                <div className="flex justify-end">
                  <div className="text-white text-xs px-3 py-2 rounded-2xl" style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)", borderRadius: "14px 14px 3px 14px", maxWidth: "70%", lineHeight: 1.5 }}>
                    What is the total revenue in Q4?
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 26, height: 26, background: "linear-gradient(135deg,#7c3aed,#06b6d4)" }}>
                    <svg width="13" height="13" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
                  </div>
                  <div className="text-xs px-3 py-2" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "3px 14px 14px 14px", color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>
                    Total Q4 revenue was <strong style={{ color: "#a78bfa" }}>$4.2M</strong>, up <strong style={{ color: "#34d399" }}>18%</strong> from Q3.
                    <span className="animate-blink inline-block ml-0.5 align-middle" style={{ width: 5, height: 13, background: "#a78bfa", borderRadius: 2 }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)", padding: "40px 24px" }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mx-auto" style={{ maxWidth: 900 }}>
          {[
            { value: "100+",  label: "Active users",       color: "#a78bfa" },
            { value: "500+",  label: "PDFs analyzed",      color: "#06b6d4" },
            { value: "10k+",  label: "Questions answered", color: "#34d399" },
            { value: "< 2s",  label: "Average response",   color: "#fbbf24" },
          ].map(s => (
            <div key={s.label}>
              <div className="font-black mb-1" style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", color: s.color, letterSpacing: "-0.5px" }}>{s.value}</div>
              <div className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.38)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
      <section id="how-it-works" className="px-6 py-24">
        <div className="mx-auto" style={{ maxWidth: 960 }}>
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase px-4 py-1.5 rounded-full mb-4" style={{ color: "#a78bfa", letterSpacing: "0.1em", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
              How it works
            </span>
            <h2 className="font-black text-white mb-4" style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", letterSpacing: "-0.5px" }}>
              Up and running in 30 seconds
            </h2>
            <p className="text-lg mx-auto" style={{ color: "rgba(255,255,255,0.4)", maxWidth: 440 }}>
              No setup. No learning curve. Just results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: "01", icon: "📤", title: "Upload your PDF",    desc: "Drag & drop any PDF — invoices, contracts, research papers. Any size, any topic." },
              { step: "02", icon: "💬", title: "Ask a question",     desc: "Type anything in plain English. 'What's the total?' or 'Summarize in 3 points.'" },
              { step: "03", icon: "⚡", title: "Get instant answers", desc: "AI reads your document and replies with precise answers in under 2 seconds." },
            ].map(s => (
              <div key={s.step} className="card-hover text-center p-8 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="relative inline-flex items-center justify-center rounded-2xl mb-5" style={{ width: 68, height: 68, background: "linear-gradient(135deg,rgba(124,58,237,0.2),rgba(6,182,212,0.1))", border: "1px solid rgba(124,58,237,0.3)" }}>
                  <span style={{ fontSize: 28 }}>{s.icon}</span>
                  <div className="absolute flex items-center justify-center rounded-full text-white font-extrabold" style={{ top: -10, right: -10, width: 26, height: 26, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", fontSize: 11, boxShadow: "0 4px 12px rgba(124,58,237,0.4)" }}>
                    {s.step}
                  </div>
                </div>
                <h3 className="text-lg font-extrabold text-white mb-2" style={{ letterSpacing: "-0.2px" }}>{s.title}</h3>
                <p className="text-sm leading-7" style={{ color: "rgba(255,255,255,0.42)" }}>{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-11">
            <a href="/login" className="btn-primary text-sm font-bold text-white no-underline rounded-full px-8 py-3" style={{ boxShadow: "0 6px 24px rgba(124,58,237,0.35)" }}>
              Try it now — it&apos;s free →
            </a>
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────── */}
      <section id="features" className="px-6 py-24" style={{ background: "rgba(255,255,255,0.012)" }}>
        <div className="mx-auto" style={{ maxWidth: 1100 }}>
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase px-4 py-1.5 rounded-full mb-4" style={{ color: "#06b6d4", letterSpacing: "0.1em", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)" }}>
              Features
            </span>
            <h2 className="font-black text-white mb-4" style={{ fontSize: "clamp(2rem,4vw,2.9rem)", letterSpacing: "-0.5px" }}>
              Understand your documents<br />like never before
            </h2>
            <p className="text-lg mx-auto" style={{ color: "rgba(255,255,255,0.4)", maxWidth: 480 }}>
              Everything you need to work smarter with any document.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: "💬", color: "#a78bfa",
                glow: "rgba(124,58,237,0.15)", border: "rgba(124,58,237,0.28)",
                title: "Ask Questions",
                desc: "Get instant answers from your PDFs. Ask anything in plain English and get precise, cited responses in seconds.",
                bullets: ["Multi-turn conversation","Semantic search across pages","Cited from source text"],
              },
              {
                icon: "✨", color: "#06b6d4",
                glow: "rgba(6,182,212,0.1)", border: "rgba(6,182,212,0.25)",
                title: "Smart Summaries",
                desc: "Summarize long documents instantly. Get key points and highlights without reading a single page yourself.",
                bullets: ["Auto-generated summary","Key point extraction","Suggested follow-up questions"],
              },
              {
                icon: "🔍", color: "#34d399",
                glow: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.22)",
                title: "Key Insights",
                desc: "Extract important points, data, and metrics automatically. Perfect for invoices, reports, and contracts.",
                bullets: ["Data extraction (invoices, resumes)","Risk & conflict detection","Compare two PDFs side-by-side"],
              },
            ].map(f => (
              <div key={f.title} className="card-hover rounded-2xl p-8" style={{ background: `linear-gradient(135deg,${f.glow},transparent)`, border: `1px solid ${f.border}` }}>
                <div className="flex items-center justify-center rounded-2xl mb-6" style={{ width: 56, height: 56, background: f.glow, border: `1px solid ${f.border}`, fontSize: 26 }}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-extrabold text-white mb-3" style={{ letterSpacing: "-0.3px" }}>{f.title}</h3>
                <p className="text-sm leading-7 mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>{f.desc}</p>
                <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
                  {f.bullets.map(b => (
                    <li key={b} className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                      <CheckIcon color={f.color} /> {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEMO ───────────────────────────────────────────────────────── */}
      <section id="demo" className="px-6 py-24">
        <div className="mx-auto" style={{ maxWidth: 860 }}>
          <div className="text-center mb-13">
            <span className="inline-block text-xs font-bold uppercase px-4 py-1.5 rounded-full mb-4" style={{ color: "#fbbf24", letterSpacing: "0.1em", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
              Demo
            </span>
            <h2 className="font-black text-white mb-4" style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", letterSpacing: "-0.5px" }}>
              See it in action
            </h2>
            <p className="text-lg" style={{ color: "rgba(255,255,255,0.4)" }}>
              Watch how Intellixy turns a PDF into a conversation in seconds.
            </p>
          </div>

          {/* Video placeholder */}
          <div className="relative rounded-2xl overflow-hidden flex items-center justify-center" style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", boxShadow: "0 40px 80px rgba(0,0,0,0.5)", aspectRatio: "16/9" }}>
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.12),rgba(6,182,212,0.07))" }} />

            {/* Decorative bubbles */}
            <div className="absolute bottom-7 left-10 text-xs px-4 py-2 rounded-2xl" style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)", color: "rgba(255,255,255,0.5)", borderRadius: "14px 14px 3px 14px" }}>
              What are the payment terms?
            </div>
            <div className="absolute top-7 right-10 text-xs px-4 py-2" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px 14px 14px 3px", color: "rgba(255,255,255,0.5)" }}>
              Payment is due within <strong style={{ color: "#a78bfa" }}>30 days</strong>...
            </div>

            {/* Play button */}
            <div className="relative flex flex-col items-center gap-4 z-10">
              <a href="/login" className="flex items-center justify-center rounded-full no-underline" style={{ width: 80, height: 80, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", boxShadow: "0 16px 48px rgba(124,58,237,0.5), 0 0 0 16px rgba(124,58,237,0.1)", transition: "transform 0.2s" }}>
                <svg width="30" height="30" fill="white" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </a>
              <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>Click to try it live</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────────────── */}
      <section className="px-6 py-24" style={{ background: "rgba(255,255,255,0.012)" }}>
        <div className="mx-auto" style={{ maxWidth: 1100 }}>
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase px-4 py-1.5 rounded-full mb-4" style={{ color: "#f472b6", letterSpacing: "0.1em", background: "rgba(244,114,182,0.08)", border: "1px solid rgba(244,114,182,0.2)" }}>
              Testimonials
            </span>
            <h2 className="font-black text-white" style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", letterSpacing: "-0.5px" }}>
              People love Intellixy
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: "Arjun S.",  role: "Finance Analyst", avatar: "#a78bfa", quote: "I process 20+ invoices a day. Intellixy cuts my review time by 70%. I just ask 'total amount' and it pulls it instantly." },
              { name: "Priya M.",  role: "Law Student",     avatar: "#06b6d4", quote: "Perfect for reading long case files. I ask it to summarize judgments and it gives me crisp bullet points in seconds." },
              { name: "Rahul K.", role: "Startup Founder", avatar: "#34d399", quote: "We use it to review contracts before signing. Catches things our team would miss. Already saved us from one bad deal." },
            ].map(t => (
              <div key={t.name} className="card-hover rounded-2xl p-7" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map(s => <span key={s} style={{ color: "#fbbf24" }}>★</span>)}
                </div>
                <p className="text-sm leading-7 mb-5 italic" style={{ color: "rgba(255,255,255,0.65)" }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded-full text-sm font-bold flex-shrink-0" style={{ width: 38, height: 38, background: `${t.avatar}22`, border: `2px solid ${t.avatar}55`, color: t.avatar }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white m-0">{t.name}</p>
                    <p className="text-xs m-0" style={{ color: "rgba(255,255,255,0.35)" }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────────────── */}
      <section id="pricing" className="px-6 py-24">
        <div className="mx-auto" style={{ maxWidth: 820 }}>
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase px-4 py-1.5 rounded-full mb-4" style={{ color: "#a78bfa", letterSpacing: "0.1em", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
              Pricing
            </span>
            <h2 className="font-black text-white mb-4" style={{ fontSize: "clamp(2rem,4vw,2.9rem)", letterSpacing: "-0.5px" }}>
              Simple, honest pricing
            </h2>
            <p className="text-lg" style={{ color: "rgba(255,255,255,0.4)" }}>No hidden fees. Cancel anytime.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

            {/* Free */}
            <div className="rounded-2xl p-8 flex flex-col" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Free</p>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-5xl font-black text-white" style={{ letterSpacing: "-1px" }}>₹0</span>
                <span className="text-sm pb-2" style={{ color: "rgba(255,255,255,0.35)" }}>forever</span>
              </div>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.35)" }}>Perfect for getting started</p>
              <ul className="flex flex-col gap-3 list-none p-0 m-0 mb-7 flex-1">
                {["5 PDFs/day","20 questions per day","AI Q&A chat","AI Insights panel","Chat history"].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.62)" }}>
                    <CheckIcon color="#a78bfa" /> {f}
                  </li>
                ))}
              </ul>
              <a href="/login" className="block text-center text-sm font-bold text-white no-underline py-3 rounded-xl transition-all" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
                Get started free
              </a>
            </div>

            {/* Pro */}
            <div className="relative rounded-2xl p-8 flex flex-col" style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.14),rgba(6,182,212,0.07))", border: "1px solid rgba(124,58,237,0.4)", boxShadow: "0 24px 60px rgba(124,58,237,0.2)" }}>
              {/* Badge */}
              <div className="absolute text-xs font-extrabold text-white px-5 py-1.5 rounded-full" style={{ top: -14, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(124,58,237,0.4)" }}>
                🔥 Most Popular
              </div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#a78bfa" }}>Pro</p>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-5xl font-black text-white" style={{ letterSpacing: "-1px" }}>₹299</span>
                <span className="text-sm pb-2" style={{ color: "rgba(255,255,255,0.35)" }}>/ month</span>
              </div>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.35)" }}>For power users who need more</p>
              <ul className="flex flex-col gap-3 list-none p-0 m-0 mb-7 flex-1">
                {["Unlimited PDF uploads","Unlimited questions","Faster AI responses","PDF Compare feature","Smart data extraction","Priority support","Early access to new features"].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                    <CheckIcon color="#4ade80" /> {f}
                  </li>
                ))}
              </ul>
              <ProPlanCTA />
              <p className="text-xs text-center mt-3" style={{ color: "rgba(255,255,255,0.25)" }}>
                Secure payment via Razorpay · Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="relative mx-auto text-center rounded-3xl overflow-hidden" style={{ maxWidth: 740, background: "linear-gradient(135deg,rgba(124,58,237,0.14),rgba(6,182,212,0.08))", border: "1px solid rgba(124,58,237,0.25)", padding: "72px 48px" }}>
          {/* Glow blobs */}
          <div className="absolute pointer-events-none" style={{ top: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.18),transparent 70%)" }} />
          <div className="absolute pointer-events-none" style={{ bottom: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(6,182,212,0.12),transparent 70%)" }} />

          <div className="relative">
            <div className="animate-float text-5xl mb-6">🚀</div>
            <h2 className="font-black text-white mb-4" style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", letterSpacing: "-0.5px" }}>
              Stop reading PDFs.<br />Start chatting with them.
            </h2>
            <p className="text-lg mb-9" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
              Free forever. No credit card needed.<br />Upgrade when you&apos;re ready.
            </p>
            <a href="/login" className="btn-primary inline-block text-base font-extrabold text-white no-underline rounded-full px-10 py-4" style={{ boxShadow: "0 10px 36px rgba(124,58,237,0.45)", letterSpacing: "-0.2px" }}>
              Get Started Free →
            </a>
            <p className="text-xs mt-5" style={{ color: "rgba(255,255,255,0.25)" }}>
              Join 100+ users already chatting with their PDFs
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "48px 24px 32px" }}>
        <div className="mx-auto" style={{ maxWidth: 1100 }}>
          <div className="flex flex-wrap items-start justify-between gap-10 mb-10">
            {/* Brand */}
            <div style={{ maxWidth: 260 }}>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex items-center justify-center rounded-xl" style={{ width: 30, height: 30, background: "linear-gradient(135deg,#7c3aed,#06b6d4)" }}>
                  <PdfIcon />
                </div>
                <span className="text-lg font-extrabold text-white">Intellixy</span>
              </div>
              <p className="text-sm leading-6" style={{ color: "rgba(255,255,255,0.3)" }}>
                AI-powered document assistant. Chat with any PDF, extract insights, work smarter.
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.25)" }}>Product</p>
                <div className="flex flex-col gap-3">
                  {[["Features","#features"],["How it works","#how-it-works"],["Pricing","#pricing"],["Demo","#demo"]].map(([label, href]) => (
                    <a key={label} href={href} className="text-sm transition-colors" style={{ color: "rgba(255,255,255,0.38)" }}>{label}</a>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.25)" }}>Legal</p>
                <div className="flex flex-col gap-3">
                  {[["Privacy Policy","/privacy-policy"],["Terms of Service","/terms"],["Refund Policy","/refund-policy"],["Contact","mailto:support@intellixy.app"]].map(([label, href]) => (
                    <a key={label} href={href} className="text-sm transition-colors" style={{ color: "rgba(255,255,255,0.38)" }}>{label}</a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs m-0" style={{ color: "rgba(255,255,255,0.2)" }}>© 2026 Intellixy. All rights reserved.</p>
            <p className="text-xs m-0" style={{ color: "rgba(255,255,255,0.15)" }}>Made with ♥ using Next.js + GPT-4o</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
