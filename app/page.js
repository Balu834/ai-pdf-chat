import ProPlanCTA from "@/components/ProPlanCTA";

export const metadata = {
  title: "Intellixy — Stop Reading PDFs. Start Chatting with Them.",
  description:
    "Upload any PDF and get instant answers, summaries, and key insights in seconds. Free to start — no credit card needed.",
};

function CheckIcon({ color = "#a78bfa" }) {
  return (
    <svg width="15" height="15" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="13" height="13" fill="none" stroke="rgba(255,255,255,0.25)" viewBox="0 0 24 24" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
function PdfIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function ZapIcon() {
  return (
    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: "#07071a",
        color: "#fff",
        fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
        overflowX: "hidden",
      }}
    >
      {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(7,7,26,0.93)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center justify-between mx-auto px-4 md:px-6" style={{ maxWidth: 1200, height: 60 }}>
          <a href="/" className="flex items-center gap-2">
            <div
              className="flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ width: 32, height: 32, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", boxShadow: "0 4px 14px rgba(124,58,237,0.4)" }}
            >
              <PdfIcon size={14} />
            </div>
            <span className="font-extrabold text-base md:text-lg text-white">Intellixy</span>
          </a>
          <div className="flex items-center gap-1">
            {[["#features","Features"],["#how-it-works","How it works"],["#pricing","Pricing"]].map(([href,label]) => (
              <a key={label} href={href} className="hidden lg:block text-sm px-3 py-1.5 rounded-lg" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</a>
            ))}
            <a href="/login" className="hidden sm:block text-sm font-medium px-3 py-2 rounded-lg" style={{ color: "rgba(255,255,255,0.65)" }}>Log in</a>
            <a href="/login" className="btn-primary text-xs sm:text-sm font-bold text-white px-4 py-2 rounded-full" style={{ boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }}>
              Start Free →
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative flex items-center justify-center overflow-hidden" style={{ minHeight: "100vh", paddingTop: 60 }}>
        {/* Glow blobs */}
        <div className="absolute pointer-events-none" style={{ top: "-15%", left: "-8%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.2),transparent 68%)", filter: "blur(80px)" }} />
        <div className="absolute pointer-events-none" style={{ bottom: "-10%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(6,182,212,0.13),transparent 68%)", filter: "blur(80px)" }} />

        <div className="relative w-full max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">

          {/* Urgency badge */}
          <div
            className="animate-fadeUp inline-flex items-center gap-2 rounded-full px-3 sm:px-4 py-1.5 mb-6 text-xs font-bold uppercase"
            style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)", color: "#c4b5fd", letterSpacing: "0.08em" }}
          >
            <span className="animate-pulse-dot inline-block rounded-full flex-shrink-0" style={{ width: 7, height: 7, background: "#a78bfa" }} />
            <span className="hidden sm:inline">Free Plan · </span>10 Questions to Try Now
          </div>

          {/* HEADLINE — strong, problem-aware */}
          <h1
            className="animate-fadeUp2 font-black text-white mb-5 text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
            style={{ lineHeight: 1.1, letterSpacing: "-1px" }}
          >
            Stop Reading PDFs.{" "}
            <br className="hidden sm:block" />
            <span className="gradient-text">Start Chatting</span>{" "}
            with Them.
          </h1>

          {/* Subtext — outcome-driven */}
          <p
            className="animate-fadeUp3 mx-auto mb-2 text-base sm:text-lg"
            style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.75, maxWidth: 500 }}
          >
            Ask anything. Get exact answers instantly — from invoices, contracts,
            research papers, or any document you upload.
          </p>
          <p className="animate-fadeUp3 mb-8 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            No setup · Works in under 30 seconds
          </p>

          {/* CTA — specific free offer */}
          <div className="animate-fadeUp4 flex flex-col sm:flex-row gap-3 justify-center items-center mb-3">
            <a
              href="/login"
              className="btn-primary w-full sm:w-auto text-sm sm:text-base font-extrabold text-white text-center rounded-full"
              style={{ padding: "15px 40px", boxShadow: "0 10px 40px rgba(124,58,237,0.5)", letterSpacing: "-0.2px" }}
            >
              Start Free — 10 Questions Included →
            </a>
          </div>

          {/* Micro-trust under CTA */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10" style={{ fontSize: 11 }}>
            {[
              { icon: <ShieldIcon />, text: "No credit card" },
              { icon: <ZapIcon />,    text: "Live in 30 seconds" },
              { icon: <ShieldIcon />, text: "Files never shared" },
            ].map(({ icon, text }) => (
              <span key={text} className="flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                {icon} {text}
              </span>
            ))}
          </div>

          {/* Social proof strip */}
          <div
            className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 rounded-full px-4 sm:px-5 py-2 mb-10"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex">
              {["#a78bfa","#06b6d4","#f472b6","#34d399","#fbbf24"].map((c,i) => (
                <div key={c} className="flex items-center justify-center rounded-full text-xs font-bold"
                  style={{ width: 26, height: 26, background: `${c}22`, border: `2px solid ${c}88`, marginLeft: i === 0 ? 0 : -8, color: c }}>
                  {["A","R","S","K","M"][i]}
                </div>
              ))}
            </div>
            <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <span key={s} style={{ color: "#fbbf24" }}>★</span>)}</div>
            <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
              Loved by <strong className="text-white">500+</strong> users
            </span>
          </div>

          {/* Dashboard mockup */}
          <div
            className="hidden sm:block rounded-2xl overflow-hidden mx-auto"
            style={{ maxWidth: 660, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 40px 100px rgba(0,0,0,0.6)" }}
          >
            <div style={{ height: 2, background: "linear-gradient(90deg,transparent,rgba(124,58,237,0.6),transparent)" }} />
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.2)" }}>
              {["rgba(239,68,68,0.65)","rgba(234,179,8,0.65)","rgba(34,197,94,0.65)"].map((c,i) => (
                <div key={i} className="rounded-full" style={{ width: 11, height: 11, background: c }} />
              ))}
              <span className="ml-2 flex-1 text-center text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>intellixy.app — dashboard</span>
            </div>
            <div className="flex" style={{ height: 200 }}>
              <div className="flex-shrink-0 p-3" style={{ width: 155, background: "rgba(0,0,0,0.3)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-xs font-bold uppercase mb-2" style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em" }}>Documents</p>
                {[["Q4 Report.pdf",true],["Contract.pdf",false],["Research.pdf",false]].map(([name,active]) => (
                  <div key={name} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg mb-1 text-xs truncate"
                    style={{ background: active ? "rgba(124,58,237,0.22)" : "transparent", border: active ? "1px solid rgba(124,58,237,0.28)" : "1px solid transparent", color: active ? "#c4b5fd" : "rgba(255,255,255,0.3)" }}>
                    <PdfIcon size={11} /> {name}
                  </div>
                ))}
              </div>
              <div className="flex-1 flex flex-col justify-end gap-3 p-4" style={{ background: "rgba(7,7,26,0.5)" }}>
                <div className="flex justify-end">
                  <div className="text-white text-xs px-3 py-2" style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)", borderRadius: "14px 14px 3px 14px", maxWidth: "72%", lineHeight: 1.5 }}>
                    What is the total revenue in Q4?
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 24, height: 24, background: "linear-gradient(135deg,#7c3aed,#06b6d4)" }}>
                    <svg width="11" height="11" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>
                  </div>
                  <div className="text-xs px-3 py-2" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "3px 14px 14px 14px", color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>
                    Q4 revenue was <strong style={{ color: "#a78bfa" }}>$4.2M</strong>, up <strong style={{ color: "#34d399" }}>18%</strong> from Q3.
                    <span className="animate-blink inline-block ml-0.5 align-middle" style={{ width: 5, height: 12, background: "#a78bfa", borderRadius: 2 }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ───────────────────────────────────────────────────── */}
      <section className="px-4 py-10" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center max-w-4xl mx-auto">
          {[
            { value: "500+",  label: "Happy users",         color: "#a78bfa" },
            { value: "2k+",   label: "PDFs analyzed",       color: "#06b6d4" },
            { value: "20k+",  label: "Questions answered",  color: "#34d399" },
            { value: "< 2s",  label: "Avg response time",   color: "#fbbf24" },
          ].map(s => (
            <div key={s.label}>
              <div className="text-2xl sm:text-3xl md:text-4xl font-black mb-1" style={{ color: s.color, letterSpacing: "-0.5px" }}>{s.value}</div>
              <div className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.38)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block text-xs font-bold uppercase px-4 py-1.5 rounded-full mb-4" style={{ color: "#a78bfa", letterSpacing: "0.1em", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
              How it works
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-4" style={{ letterSpacing: "-0.5px" }}>
              Live in 30 seconds. No setup.
            </h2>
            <p className="text-base sm:text-lg mx-auto" style={{ color: "rgba(255,255,255,0.4)", maxWidth: 420 }}>No learning curve. No configuration. Just upload and ask.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {[
              { step:"01", icon:"📤", title:"Upload your PDF",      desc:"Drop any PDF — invoices, contracts, research papers, study notes. Any size, any topic." },
              { step:"02", icon:"💬", title:"Ask in plain English",  desc:'Type anything — "What\'s the total?" or "Summarize the key clauses." No commands to learn.' },
              { step:"03", icon:"⚡", title:"Get precise answers",   desc:"AI reads the document and responds with exact answers, pulled directly from the text." },
            ].map(s => (
              <div key={s.step} className="card-hover text-center p-6 sm:p-8 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="relative inline-flex items-center justify-center rounded-2xl mb-5" style={{ width: 64, height: 64, background: "linear-gradient(135deg,rgba(124,58,237,0.2),rgba(6,182,212,0.1))", border: "1px solid rgba(124,58,237,0.3)" }}>
                  <span style={{ fontSize: 26 }}>{s.icon}</span>
                  <div className="absolute flex items-center justify-center rounded-full text-white font-extrabold" style={{ top: -10, right: -10, width: 24, height: 24, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", fontSize: 10, boxShadow: "0 4px 10px rgba(124,58,237,0.4)" }}>{s.step}</div>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-white mb-2">{s.title}</h3>
                <p className="text-sm leading-7" style={{ color: "rgba(255,255,255,0.42)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-10">
            <a href="/login" className="btn-primary w-full sm:w-auto text-center text-sm font-bold text-white rounded-full px-8 py-3" style={{ boxShadow: "0 6px 24px rgba(124,58,237,0.35)" }}>
              Try it free — Start in 30 seconds →
            </a>
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section id="features" className="px-4 sm:px-6 py-16 sm:py-24" style={{ background: "rgba(255,255,255,0.012)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block text-xs font-bold uppercase px-4 py-1.5 rounded-full mb-4" style={{ color: "#06b6d4", letterSpacing: "0.1em", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)" }}>Features</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-4" style={{ letterSpacing: "-0.5px" }}>
              Everything you need to stop<br className="hidden sm:block" /> drowning in documents
            </h2>
            <p className="text-base sm:text-lg mx-auto" style={{ color: "rgba(255,255,255,0.4)", maxWidth: 460 }}>Works on any PDF — legal, financial, academic, medical.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
            {[
              { icon:"💬", color:"#a78bfa", glow:"rgba(124,58,237,0.15)", border:"rgba(124,58,237,0.28)", title:"Smart Q&A",       desc:"Ask anything in plain English — the AI finds the exact answer from your document.", bullets:["Multi-turn conversation","Semantic search","Cited from source"] },
              { icon:"✨", color:"#06b6d4", glow:"rgba(6,182,212,0.1)",   border:"rgba(6,182,212,0.25)",  title:"Auto Summaries",  desc:"Summarize any document in one click. Get key points without reading a single page.", bullets:["Auto-generated summary","Key point extraction","Follow-up suggestions"] },
              { icon:"🔍", color:"#34d399", glow:"rgba(52,211,153,0.08)", border:"rgba(52,211,153,0.22)", title:"Deep Extraction",  desc:"Extract invoices, dates, names, totals, and key fields automatically.", bullets:["Invoice & resume parsing","Risk & clause detection","Compare two PDFs side-by-side"] },
            ].map(f => (
              <div key={f.title} className="card-hover rounded-2xl p-6 sm:p-8" style={{ background: `linear-gradient(135deg,${f.glow},transparent)`, border: `1px solid ${f.border}` }}>
                <div className="flex items-center justify-center rounded-2xl mb-5" style={{ width: 52, height: 52, background: f.glow, border: `1px solid ${f.border}`, fontSize: 24 }}>{f.icon}</div>
                <h3 className="text-lg font-extrabold text-white mb-2">{f.title}</h3>
                <p className="text-sm leading-7 mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>{f.desc}</p>
                <ul className="flex flex-col gap-2 list-none p-0 m-0">
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

      {/* ── TESTIMONIALS ────────────────────────────────────────────────── */}
      <section id="testimonials" className="px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold uppercase px-4 py-1.5 rounded-full mb-4" style={{ color: "#f472b6", letterSpacing: "0.1em", background: "rgba(244,114,182,0.08)", border: "1px solid rgba(244,114,182,0.2)" }}>Testimonials</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3" style={{ letterSpacing: "-0.5px" }}>
              People get real results
            </h2>
            <p className="text-base" style={{ color: "rgba(255,255,255,0.35)" }}>Not just "love it" — they save hours every week.</p>
          </div>

          {/* Featured testimonial — big card */}
          <div
            className="rounded-2xl p-6 sm:p-8 mb-5"
            style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.1),rgba(6,182,212,0.05))", border: "1px solid rgba(124,58,237,0.25)" }}
          >
            <div className="flex gap-0.5 mb-4">{[1,2,3,4,5].map(s => <span key={s} style={{ color: "#fbbf24", fontSize: 18 }}>★</span>)}</div>
            <p className="text-base sm:text-lg leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.8)", fontStyle: "italic", maxWidth: 680 }}>
              &ldquo;I process <strong style={{ color: "#a78bfa" }}>20+ invoices</strong> daily. Intellixy cuts my review time by <strong style={{ color: "#4ade80" }}>70%</strong>. I just ask &lsquo;what&apos;s the total amount due?&rsquo; and it pulls the exact number instantly — from any vendor format.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-full text-sm font-bold flex-shrink-0" style={{ width: 42, height: 42, background: "rgba(167,139,250,0.15)", border: "2px solid rgba(167,139,250,0.4)", color: "#a78bfa" }}>A</div>
              <div>
                <p className="text-sm font-bold text-white m-0">Arjun S.</p>
                <p className="text-xs m-0" style={{ color: "rgba(255,255,255,0.35)" }}>Finance Analyst · saves 3 hrs/week</p>
              </div>
              <div className="ml-auto hidden sm:block px-3 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80" }}>
                ✓ Pro user
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {[
              { name:"Priya M.",  role:"Law Student",      time:"saves 5 hrs/week",  avatar:"#06b6d4", quote:"Perfect for long case files. I ask it to summarize judgments and it gives crisp bullet points in seconds. Went from Pro trial to paying in 2 days." },
              { name:"Rahul K.", role:"Startup Founder",   time:"caught 1 bad deal",  avatar:"#34d399", quote:"We review contracts before signing. It highlights risky clauses our team misses. Already saved us from one deal that had a hidden auto-renewal clause." },
            ].map(t => (
              <div key={t.name} className="card-hover rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex gap-0.5 mb-4">{[1,2,3,4,5].map(s => <span key={s} style={{ color: "#fbbf24" }}>★</span>)}</div>
                <p className="text-sm leading-7 mb-5 italic" style={{ color: "rgba(255,255,255,0.65)" }}>&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded-full text-sm font-bold flex-shrink-0" style={{ width: 36, height: 36, background: `${t.avatar}22`, border: `2px solid ${t.avatar}55`, color: t.avatar }}>{t.name[0]}</div>
                  <div>
                    <p className="text-sm font-bold text-white m-0">{t.name}</p>
                    <p className="text-xs m-0" style={{ color: "rgba(255,255,255,0.35)" }}>{t.role} · {t.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────── */}
      <section id="pricing" className="px-4 sm:px-6 py-16 sm:py-24" style={{ background: "rgba(255,255,255,0.012)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block text-xs font-bold uppercase px-4 py-1.5 rounded-full mb-4" style={{ color: "#a78bfa", letterSpacing: "0.1em", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>Pricing</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3" style={{ letterSpacing: "-0.5px" }}>
              Start free. Upgrade when ready.
            </h2>
            <p className="text-base sm:text-lg" style={{ color: "rgba(255,255,255,0.4)" }}>
              No subscriptions until you see the value. No credit card to start.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 items-start">

            {/* ── FREE ── */}
            <div className="rounded-2xl p-6 sm:p-8 flex flex-col" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Free</p>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-4xl sm:text-5xl font-black text-white" style={{ letterSpacing: "-1px" }}>₹0</span>
                <span className="text-sm pb-2" style={{ color: "rgba(255,255,255,0.35)" }}>forever</span>
              </div>
              <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.28)" }}>Try before you commit</p>

              {/* Included */}
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.28)", letterSpacing: "0.1em" }}>Included</p>
              <ul className="flex flex-col gap-2.5 list-none p-0 m-0 mb-5 flex-1">
                {[
                  "5 PDF uploads (lifetime)",
                  "10 questions (lifetime)",
                  "AI Q&A chat",
                  "Auto summaries",
                  "Chat history",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                    <CheckIcon color="#a78bfa" /> {f}
                  </li>
                ))}
              </ul>

              {/* Not included */}
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.18)", letterSpacing: "0.1em" }}>Not included</p>
              <ul className="flex flex-col gap-2 list-none p-0 m-0 mb-7">
                {["Unlimited uploads & questions","Delete PDFs","PDF Compare"].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.28)" }}>
                    <XIcon /> {f}
                  </li>
                ))}
              </ul>

              <a href="/login" className="block w-full text-center text-sm font-bold text-white py-3 rounded-xl transition-all" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
                Get started free
              </a>
            </div>

            {/* ── PRO ── */}
            <div
              className="relative rounded-2xl p-6 sm:p-8 flex flex-col mt-4 sm:mt-0"
              style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.15),rgba(6,182,212,0.07))", border: "2px solid rgba(124,58,237,0.5)", boxShadow: "0 0 0 1px rgba(124,58,237,0.1), 0 24px 60px rgba(124,58,237,0.22)" }}
            >
              {/* Most popular badge */}
              <div className="absolute text-xs font-extrabold text-white px-4 py-1.5 rounded-full"
                style={{ top: -14, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(124,58,237,0.4)" }}>
                🔥 Most Popular
              </div>

              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#a78bfa" }}>Pro</p>

              {/* Price anchor */}
              <div className="flex items-end gap-2 mb-1">
                <span className="text-sm font-medium line-through" style={{ color: "rgba(255,255,255,0.28)", paddingBottom: 10 }}>₹499</span>
                <span className="text-4xl sm:text-5xl font-black text-white" style={{ letterSpacing: "-1px" }}>₹199</span>
                <span className="text-sm pb-2" style={{ color: "rgba(255,255,255,0.4)" }}>/ month</span>
              </div>

              {/* Savings pill */}
              <div className="inline-flex items-center gap-1.5 mb-5" style={{ width: "fit-content" }}>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(74,222,128,0.14)", border: "1px solid rgba(74,222,128,0.28)", color: "#4ade80" }}>
                  Save 60% — Launch price
                </span>
              </div>

              {/* Features */}
              <ul className="flex flex-col gap-3 list-none p-0 m-0 mb-7 flex-1">
                {[
                  "Unlimited PDF uploads",
                  "Unlimited questions",
                  "Delete PDFs anytime",
                  "PDF Compare feature",
                  "Smart data extraction",
                  "Share chat links",
                  "Priority AI responses",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
                    <CheckIcon color="#4ade80" /> {f}
                  </li>
                ))}
              </ul>

              <ProPlanCTA />
              <p className="text-xs text-center mt-3" style={{ color: "rgba(255,255,255,0.25)" }}>
                🔒 Secure via Razorpay · Cancel anytime
              </p>
            </div>
          </div>

          {/* Comparison footnote */}
          <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.22)" }}>
            Most users hit the free limit within their first session — and upgrade same day.
          </p>
        </div>
      </section>

      {/* ── DEMO ────────────────────────────────────────────────────────── */}
      <section id="demo" className="px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <span className="inline-block text-xs font-bold uppercase px-4 py-1.5 rounded-full mb-4" style={{ color: "#fbbf24", letterSpacing: "0.1em", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>Live Demo</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3" style={{ letterSpacing: "-0.5px" }}>See it working</h2>
            <p className="text-base sm:text-lg" style={{ color: "rgba(255,255,255,0.4)" }}>Watch how fast it turns a complex PDF into simple answers.</p>
          </div>
          <div className="relative w-full rounded-2xl overflow-hidden flex items-center justify-center"
            style={{ aspectRatio: "16/9", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", boxShadow: "0 30px 70px rgba(0,0,0,0.5)" }}>
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.12),rgba(6,182,212,0.07))" }} />
            <div className="absolute bottom-4 sm:bottom-7 left-4 sm:left-10 text-xs px-3 sm:px-4 py-2 hidden xs:block"
              style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: "14px 14px 3px 14px", color: "rgba(255,255,255,0.5)" }}>
              What are the payment terms?
            </div>
            <div className="absolute top-4 sm:top-7 right-4 sm:right-10 text-xs px-3 sm:px-4 py-2 hidden xs:block"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px 14px 14px 3px", color: "rgba(255,255,255,0.5)" }}>
              Payment due within <strong style={{ color: "#a78bfa" }}>30 days</strong>...
            </div>
            <div className="relative flex flex-col items-center gap-3 z-10">
              <a href="/login" className="flex items-center justify-center rounded-full"
                style={{ width: 72, height: 72, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", boxShadow: "0 16px 48px rgba(124,58,237,0.5), 0 0 0 14px rgba(124,58,237,0.1)", transition: "transform 0.2s" }}>
                <svg width="26" height="26" fill="white" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" /></svg>
              </a>
              <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>Click to try live — free</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="relative max-w-3xl mx-auto text-center rounded-3xl overflow-hidden"
          style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.14),rgba(6,182,212,0.08))", border: "1px solid rgba(124,58,237,0.25)", padding: "56px 24px" }}>
          <div className="absolute pointer-events-none" style={{ top: -60, left: -60, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.18),transparent 70%)" }} />
          <div className="absolute pointer-events-none" style={{ bottom: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle,rgba(6,182,212,0.12),transparent 70%)" }} />
          <div className="relative">
            <div className="animate-float text-4xl sm:text-5xl mb-5">🚀</div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-4" style={{ letterSpacing: "-0.5px" }}>
              Stop Reading PDFs.<br />Start Chatting with Them.
            </h2>
            <p className="text-base sm:text-lg mb-2" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
              Free forever plan · 10 questions included · No credit card.
            </p>
            <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.3)" }}>
              Join 500+ users already chatting with their documents.
            </p>
            <a href="/login" className="btn-primary inline-block w-full sm:w-auto text-sm sm:text-base font-extrabold text-white text-center rounded-full"
              style={{ padding: "15px 44px", boxShadow: "0 10px 40px rgba(124,58,237,0.5)", letterSpacing: "-0.2px" }}>
              Start Free — 10 Questions Included →
            </a>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-5" style={{ fontSize: 11 }}>
              {["No credit card","Cancel Pro anytime","Your data stays private"].map(t => (
                <span key={t} className="flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                  <ShieldIcon /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "40px 16px 28px" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8 mb-8">
            <div style={{ maxWidth: 240 }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center rounded-xl flex-shrink-0" style={{ width: 28, height: 28, background: "linear-gradient(135deg,#7c3aed,#06b6d4)" }}>
                  <PdfIcon size={13} />
                </div>
                <span className="text-base font-extrabold text-white">Intellixy</span>
              </div>
              <p className="text-sm leading-6" style={{ color: "rgba(255,255,255,0.3)" }}>
                AI-powered document assistant. Chat with any PDF, extract insights, work smarter.
              </p>
            </div>
            <div className="flex flex-wrap gap-8 sm:gap-12">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.25)" }}>Product</p>
                <div className="flex flex-col gap-2.5">
                  {[["Features","#features"],["How it works","#how-it-works"],["Pricing","#pricing"],["Demo","#demo"]].map(([label,href]) => (
                    <a key={label} href={href} className="text-sm" style={{ color: "rgba(255,255,255,0.38)" }}>{label}</a>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.25)" }}>Legal</p>
                <div className="flex flex-col gap-2.5">
                  {[["Privacy Policy","/privacy-policy"],["Terms of Service","/terms"],["Refund Policy","/refund-policy"],["Contact","mailto:support@intellixy.app"]].map(([label,href]) => (
                    <a key={label} href={href} className="text-sm" style={{ color: "rgba(255,255,255,0.38)" }}>{label}</a>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs m-0" style={{ color: "rgba(255,255,255,0.2)" }}>© 2026 Intellixy. All rights reserved.</p>
            <p className="text-xs m-0" style={{ color: "rgba(255,255,255,0.15)" }}>Made with ♥ using Next.js + GPT-4o</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
