// SERVER COMPONENT — no "use client"
import ProPlanCTA from "@/components/ProPlanCTA";

export const metadata = {
  title: "Intellixy — Chat with your PDFs using AI",
  description:
    "Upload any PDF and get instant answers, summaries, and insights. Powered by GPT-4o.",
};

/* ─── INLINE GLOBAL STYLES (animations + mobile) ──────────────────────────── */
const globalStyles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: #07071a; }

  @keyframes fadeUp   { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse    { 0%,100% { opacity: 1; } 50% { opacity: .45; } }
  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes shimmer  { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
  @keyframes float    { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  @keyframes gradMove { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
  @keyframes blink    { 0%,100% { opacity: 1; } 50% { opacity: 0; } }

  .hero-fade { animation: fadeUp 0.7s ease both; }
  .hero-fade-2 { animation: fadeUp 0.7s 0.15s ease both; }
  .hero-fade-3 { animation: fadeUp 0.7s 0.3s ease both; }
  .hero-fade-4 { animation: fadeUp 0.7s 0.45s ease both; }

  .nav-link:hover { color: white !important; }
  .btn-ghost:hover { background: rgba(255,255,255,0.08) !important; color: white !important; }
  .btn-primary:hover { opacity: 0.88; transform: translateY(-1px); box-shadow: 0 16px 48px rgba(124,58,237,0.55) !important; }
  .btn-primary { transition: all 0.2s ease !important; }
  .feature-card:hover { transform: translateY(-4px); border-color: rgba(124,58,237,0.5) !important; }
  .feature-card { transition: all 0.25s ease !important; }
  .step-card:hover .step-icon { transform: scale(1.08); }
  .step-icon { transition: transform 0.2s ease; }
  .testimonial-card:hover { border-color: rgba(124,58,237,0.35) !important; transform: translateY(-3px); }
  .testimonial-card { transition: all 0.2s ease; }

  .gradient-text {
    background: linear-gradient(135deg,#c4b5fd,#06b6d4,#a78bfa);
    background-size: 200% 200%;
    animation: gradMove 4s ease infinite;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .cursor-blink { animation: blink 1s step-end infinite; }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .hide-mobile { display: none !important; }
    .hero-btns { flex-direction: column; align-items: stretch !important; }
    .hero-btns a { text-align: center; }
    .nav-actions .nav-link { display: none; }
    .stats-row { grid-template-columns: repeat(2,1fr) !important; }
    .how-grid { grid-template-columns: 1fr !important; }
    .features-grid { grid-template-columns: 1fr !important; }
    .pricing-grid { grid-template-columns: 1fr !important; }
    .testimonials-grid { grid-template-columns: 1fr !important; }
    .cta-box { padding: 40px 24px !important; }
    .footer-row { flex-direction: column; align-items: flex-start !important; gap: 24px !important; }
    .hero-mock { display: none !important; }
  }
  @media (max-width: 480px) {
    .stats-row { grid-template-columns: 1fr 1fr !important; }
    .nav-logo-text { font-size: 16px !important; }
  }
`;

export default function HomePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <div style={{ background: "#07071a", minHeight: "100vh", color: "white", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", overflowX: "hidden" }}>

        {/* ── NAVBAR ──────────────────────────────────────────────────── */}
        <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(7,7,26,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Logo */}
            <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(124,58,237,0.4)", flexShrink: 0 }}>
                <svg width="18" height="18" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <span className="nav-logo-text" style={{ fontWeight: 800, fontSize: 18, color: "white", letterSpacing: "-0.3px" }}>Intellixy</span>
            </a>

            {/* Nav links */}
            <div className="nav-actions" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {[["#features","Features"],["#how-it-works","How it works"],["#pricing","Pricing"]].map(([href, label]) => (
                <a key={label} href={href} className="nav-link hide-mobile" style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", textDecoration: "none", padding: "6px 14px", borderRadius: 8, transition: "color 0.15s" }}>{label}</a>
              ))}
              <a href="/login" className="btn-ghost" style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.6)", textDecoration: "none", padding: "8px 16px", borderRadius: 8, transition: "all 0.15s" }}>
                Log in
              </a>
              <a href="/login" className="btn-primary" style={{ fontSize: 13, fontWeight: 700, color: "white", textDecoration: "none", padding: "9px 20px", borderRadius: 50, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", boxShadow: "0 4px 20px rgba(124,58,237,0.35)", whiteSpace: "nowrap" }}>
                Get Started
              </a>
            </div>
          </div>
        </nav>

        {/* ── HERO ────────────────────────────────────────────────────── */}
        <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", paddingTop: 64 }}>
          {/* Background glows */}
          <div style={{ position: "absolute", top: "-15%", left: "-8%", width: 750, height: 750, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.2),transparent 68%)", filter: "blur(80px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "-10%", right: "-5%", width: 650, height: 650, borderRadius: "50%", background: "radial-gradient(circle,rgba(6,182,212,0.13),transparent 68%)", filter: "blur(80px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: "40%", left: "55%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(167,139,250,0.08),transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />

          <div style={{ position: "relative", maxWidth: 900, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
            {/* Pill badge */}
            <div className="hero-fade" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 50, padding: "6px 16px", marginBottom: 28 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#a78bfa", display: "inline-block", animation: "pulse 2s ease infinite" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#c4b5fd", textTransform: "uppercase", letterSpacing: "0.1em" }}>AI-Powered · Powered by GPT-4o</span>
            </div>

            {/* Headline */}
            <h1 className="hero-fade-2" style={{ fontSize: "clamp(2.6rem,6.5vw,4.8rem)", fontWeight: 900, lineHeight: 1.07, letterSpacing: "-2px", color: "white", margin: "0 0 24px" }}>
              Chat with your PDFs{" "}
              <span className="gradient-text">using AI</span>{" "}
              <span style={{ display: "inline-block", animation: "float 3s ease-in-out infinite" }}>🤖</span>
            </h1>

            {/* Subtext */}
            <p className="hero-fade-3" style={{ fontSize: "clamp(1rem,2.5vw,1.2rem)", color: "rgba(255,255,255,0.5)", lineHeight: 1.8, maxWidth: 560, margin: "0 auto 12px" }}>
              Upload any PDF and get instant answers, summaries, and insights.
              No more manual searching — just ask.
            </p>
            <p className="hero-fade-3" style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", margin: "0 auto 36px" }}>
              Works for invoices · research papers · contracts · study notes
            </p>

            {/* CTA buttons */}
            <div className="hero-btns hero-fade-4" style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center", marginBottom: 16 }}>
              <a href="/login" className="btn-primary" style={{ fontSize: 16, fontWeight: 800, color: "white", textDecoration: "none", padding: "16px 38px", borderRadius: 50, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", boxShadow: "0 10px 40px rgba(124,58,237,0.45)", letterSpacing: "-0.3px" }}>
                Try for Free →
              </a>
              <a href="#demo" className="btn-ghost" style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.62)", textDecoration: "none", padding: "16px 32px", borderRadius: 50, border: "1px solid rgba(255,255,255,0.14)", transition: "all 0.2s" }}>
                ▶ View Demo
              </a>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginBottom: 48 }}>No credit card required · Free forever plan</p>

            {/* Social proof row */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 50, padding: "8px 20px", marginBottom: 56 }}>
              <div style={{ display: "flex" }}>
                {["#a78bfa","#06b6d4","#f472b6","#34d399","#fbbf24"].map((c, i) => (
                  <div key={c} style={{ width: 26, height: 26, borderRadius: "50%", background: `linear-gradient(135deg,${c}55,${c}22)`, border: `2px solid ${c}88`, marginLeft: i === 0 ? 0 : -8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: c }}>
                    {["A","R","S","K","M"][i]}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 1 }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ color: "#fbbf24", fontSize: 13 }}>★</span>)}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>Loved by <strong style={{ color: "white" }}>100+</strong> early users</span>
            </div>

            {/* Dashboard mockup */}
            <div className="hero-mock" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, overflow: "hidden", boxShadow: "0 60px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)", maxWidth: 700, margin: "0 auto", position: "relative" }}>
              {/* Glow inside */}
              <div style={{ position: "absolute", top: 0, left: "20%", width: "60%", height: 2, background: "linear-gradient(90deg,transparent,rgba(124,58,237,0.6),transparent)" }} />
              {/* Window chrome */}
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.2)" }}>
                {["rgba(239,68,68,0.65)","rgba(234,179,8,0.65)","rgba(34,197,94,0.65)"].map((c,i) => (
                  <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
                ))}
                <span style={{ marginLeft: 8, fontSize: 11, color: "rgba(255,255,255,0.22)", flex: 1, textAlign: "center" }}>intellixy.app — dashboard</span>
              </div>
              {/* App layout */}
              <div style={{ display: "flex", height: 220 }}>
                {/* Sidebar */}
                <div style={{ width: 165, background: "rgba(0,0,0,0.3)", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "14px 10px", flexShrink: 0 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 10px 4px" }}>Documents</p>
                  {[["Q4 Report.pdf", true], ["Contract_2024.pdf", false], ["Research Paper.pdf", false]].map(([name, active]) => (
                    <div key={name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 8, marginBottom: 4, background: active ? "rgba(124,58,237,0.22)" : "transparent", border: active ? "1px solid rgba(124,58,237,0.28)" : "1px solid transparent" }}>
                      <svg width="11" height="11" fill="none" stroke={active ? "#a78bfa" : "rgba(255,255,255,0.25)"} viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <span style={{ fontSize: 10, color: active ? "#c4b5fd" : "rgba(255,255,255,0.3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                    </div>
                  ))}
                </div>
                {/* Chat */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "14px 16px", gap: 12, background: "rgba(7,7,26,0.5)" }}>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "white", fontSize: 12, padding: "9px 14px", borderRadius: "14px 14px 3px 14px", maxWidth: "70%", lineHeight: 1.5 }}>
                      What is the total revenue in Q4?
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="13" height="13" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                      </svg>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.85)", fontSize: 12, padding: "9px 14px", borderRadius: "3px 14px 14px 14px", lineHeight: 1.6 }}>
                      Total Q4 revenue was <strong style={{ color: "#a78bfa" }}>$4.2M</strong>, up <strong style={{ color: "#34d399" }}>18%</strong> from Q3.
                      Key driver: SaaS subscriptions grew by 32%.<span className="cursor-blink" style={{ display: "inline-block", width: 5, height: 13, background: "#a78bfa", borderRadius: 2, marginLeft: 3, verticalAlign: "middle" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS BAR ───────────────────────────────────────────────── */}
        <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)", padding: "40px 24px" }}>
          <div className="stats-row" style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24, textAlign: "center" }}>
            {[
              { value: "100+", label: "Active users", color: "#a78bfa" },
              { value: "500+", label: "PDFs analyzed", color: "#06b6d4" },
              { value: "10k+", label: "Questions answered", color: "#34d399" },
              { value: "< 2s", label: "Average response", color: "#fbbf24" },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 900, color: s.color, letterSpacing: "-0.5px", marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ────────────────────────────────────────────── */}
        <section id="how-it-works" style={{ padding: "100px 24px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", padding: "4px 14px", borderRadius: 50 }}>How it works</span>
              <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 900, color: "white", margin: "0 0 14px", letterSpacing: "-0.5px" }}>Up and running in 30 seconds</h2>
              <p style={{ fontSize: 17, color: "rgba(255,255,255,0.4)", maxWidth: 440, margin: "0 auto" }}>No setup. No learning curve. Just results.</p>
            </div>

            <div className="how-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, position: "relative" }}>
              {/* Connector line */}
              <div className="hide-mobile" style={{ position: "absolute", top: 52, left: "16.66%", right: "16.66%", height: 1, background: "linear-gradient(90deg,rgba(124,58,237,0.5),rgba(6,182,212,0.5))", zIndex: 0 }} />
              {[
                { step: "01", icon: "📤", title: "Upload your PDF", desc: "Drag & drop any PDF — invoices, contracts, research papers, study notes. Any size, any type." },
                { step: "02", icon: "💬", title: "Ask a question", desc: "Type anything in plain English. 'What's the total amount?' or 'Summarize this in 3 points.'" },
                { step: "03", icon: "⚡", title: "Get instant answers", desc: "AI reads your document and replies with precise answers in under 2 seconds. Every time." },
              ].map((s, i) => (
                <div key={s.step} className="step-card" style={{ position: "relative", zIndex: 1, padding: "32px 28px", textAlign: "center" }}>
                  <div className="step-icon" style={{ width: 68, height: 68, borderRadius: 20, background: "linear-gradient(135deg,rgba(124,58,237,0.2),rgba(6,182,212,0.1))", border: "1px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", position: "relative", boxShadow: "0 8px 24px rgba(124,58,237,0.15)" }}>
                    <span style={{ fontSize: 28 }}>{s.icon}</span>
                    <div style={{ position: "absolute", top: -10, right: -10, width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "white", boxShadow: "0 4px 12px rgba(124,58,237,0.4)" }}>{s.step}</div>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "white", margin: "0 0 10px", letterSpacing: "-0.2px" }}>{s.title}</h3>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.42)", lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginTop: 44 }}>
              <a href="/login" className="btn-primary" style={{ fontSize: 14, fontWeight: 700, color: "white", textDecoration: "none", padding: "13px 30px", borderRadius: 50, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", boxShadow: "0 6px 24px rgba(124,58,237,0.35)" }}>
                Try it now — it&apos;s free →
              </a>
            </div>
          </div>
        </section>

        {/* ── FEATURES ────────────────────────────────────────────────── */}
        <section id="features" style={{ padding: "100px 24px", background: "rgba(255,255,255,0.012)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, color: "#06b6d4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", padding: "4px 14px", borderRadius: 50 }}>Features</span>
              <h2 style={{ fontSize: "clamp(2rem,4vw,2.9rem)", fontWeight: 900, color: "white", margin: "0 0 16px", letterSpacing: "-0.5px" }}>
                Understand your documents<br />like never before
              </h2>
              <p style={{ fontSize: 17, color: "rgba(255,255,255,0.4)", maxWidth: 500, margin: "0 auto" }}>
                Everything you need to work smarter with any document.
              </p>
            </div>

            <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
              {[
                {
                  icon: "💬", color: "#a78bfa", glow: "rgba(124,58,237,0.18)", border: "rgba(124,58,237,0.28)",
                  title: "Ask Questions",
                  desc: "Get instant answers from your PDFs. Ask anything in plain English and receive precise, cited responses.",
                  bullets: ["Multi-turn conversation", "Semantic search across pages", "Cited from source text"],
                },
                {
                  icon: "✨", color: "#06b6d4", glow: "rgba(6,182,212,0.12)", border: "rgba(6,182,212,0.25)",
                  title: "Smart Summaries",
                  desc: "AI-generated summaries in seconds. Get the key points, takeaways, and highlights without reading a page.",
                  bullets: ["Auto-generated summary", "Key point extraction", "Suggested follow-up questions"],
                },
                {
                  icon: "🔍", color: "#34d399", glow: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.22)",
                  title: "Key Insights",
                  desc: "Extract important points, data, and metrics instantly. Perfect for invoices, reports, and research.",
                  bullets: ["Data extraction (invoices, resumes)", "Risk & conflict detection", "Compare two PDFs side-by-side"],
                },
              ].map(f => (
                <div key={f.title} className="feature-card" style={{ background: `linear-gradient(135deg,${f.glow},transparent)`, border: `1px solid ${f.border}`, borderRadius: 22, padding: "32px 28px" }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: `${f.glow}`, border: `1px solid ${f.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 22, boxShadow: `0 8px 24px ${f.glow}` }}>
                    {f.icon}
                  </div>
                  <h3 style={{ fontSize: 19, fontWeight: 800, color: "white", margin: "0 0 10px", letterSpacing: "-0.3px" }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, margin: "0 0 22px" }}>{f.desc}</p>
                  <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 9 }}>
                    {f.bullets.map(b => (
                      <li key={b} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                        <svg width="14" height="14" fill="none" stroke={f.color} viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DEMO ────────────────────────────────────────────────────── */}
        <section id="demo" style={{ padding: "100px 24px" }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 52 }}>
              <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", padding: "4px 14px", borderRadius: 50 }}>Demo</span>
              <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 900, color: "white", margin: "0 0 14px", letterSpacing: "-0.5px" }}>See it in action</h2>
              <p style={{ fontSize: 17, color: "rgba(255,255,255,0.4)" }}>Watch how Intellixy turns a PDF into a conversation in seconds.</p>
            </div>

            {/* Video placeholder */}
            <div style={{ position: "relative", borderRadius: 22, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", boxShadow: "0 40px 80px rgba(0,0,0,0.5)", aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {/* Gradient overlay */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(124,58,237,0.15),rgba(6,182,212,0.08))" }} />
              {/* Fake video frame */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: "radial-gradient(circle at 30% 40%, rgba(124,58,237,0.12) 0%, transparent 60%), radial-gradient(circle at 70% 60%, rgba(6,182,212,0.08) 0%, transparent 60%)" }} />
              {/* Play button */}
              <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <a href="/login" style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 16px 48px rgba(124,58,237,0.5), 0 0 0 16px rgba(124,58,237,0.1)", textDecoration: "none", transition: "transform 0.2s" }}>
                  <svg width="30" height="30" fill="white" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </a>
                <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Click to try it live</p>
              </div>
              {/* Decorative chat bubbles in background */}
              <div style={{ position: "absolute", bottom: 28, left: 40, background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: "12px 12px 3px 12px", padding: "8px 16px", fontSize: 12, color: "rgba(255,255,255,0.5)", maxWidth: 220 }}>
                What are the payment terms?
              </div>
              <div style={{ position: "absolute", bottom: 76, right: 40, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px 12px 12px 3px", padding: "8px 16px", fontSize: 12, color: "rgba(255,255,255,0.5)", maxWidth: 280 }}>
                Payment is due within <strong style={{ color: "#a78bfa" }}>30 days</strong> of invoice date...
              </div>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ────────────────────────────────────────────── */}
        <section style={{ padding: "100px 24px", background: "rgba(255,255,255,0.012)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, color: "#f472b6", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, background: "rgba(244,114,182,0.08)", border: "1px solid rgba(244,114,182,0.2)", padding: "4px 14px", borderRadius: 50 }}>Testimonials</span>
              <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 900, color: "white", margin: 0, letterSpacing: "-0.5px" }}>People love Intellixy</h2>
            </div>
            <div className="testimonials-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
              {[
                { name: "Arjun S.", role: "Finance Analyst", avatar: "#a78bfa", quote: "I process 20+ invoices a day. Intellixy cuts my review time by 70%. I just ask 'total amount' and it pulls it instantly.", stars: 5 },
                { name: "Priya M.", role: "Law Student", avatar: "#06b6d4", quote: "Perfect for reading long case files. I ask it to summarize judgments and it gives me crisp bullet points in seconds.", stars: 5 },
                { name: "Rahul K.", role: "Startup Founder", avatar: "#34d399", quote: "We use it to review contracts before signing. Catches things our team would miss. Already saved us from one bad deal.", stars: 5 },
              ].map(t => (
                <div key={t.name} className="testimonial-card" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 28 }}>
                  {/* Stars */}
                  <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                    {Array(t.stars).fill(0).map((_, i) => <span key={i} style={{ color: "#fbbf24", fontSize: 14 }}>★</span>)}
                  </div>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, margin: "0 0 20px", fontStyle: "italic" }}>
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: `${t.avatar}22`, border: `2px solid ${t.avatar}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: t.avatar }}>
                      {t.name[0]}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "white", margin: 0 }}>{t.name}</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ─────────────────────────────────────────────────── */}
        <section id="pricing" style={{ padding: "100px 24px" }}>
          <div style={{ maxWidth: 820, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", padding: "4px 14px", borderRadius: 50 }}>Pricing</span>
              <h2 style={{ fontSize: "clamp(2rem,4vw,2.9rem)", fontWeight: 900, color: "white", margin: "0 0 14px", letterSpacing: "-0.5px" }}>Simple, honest pricing</h2>
              <p style={{ fontSize: 17, color: "rgba(255,255,255,0.4)" }}>No hidden fees. No long-term contracts. Cancel anytime.</p>
            </div>

            <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 24, alignItems: "start" }}>
              {/* Free */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 22, padding: "32px 28px", display: "flex", flexDirection: "column" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>Free</p>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 44, fontWeight: 900, color: "white", letterSpacing: "-1px" }}>₹0</span>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", paddingBottom: 8 }}>forever</span>
                </div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "0 0 24px" }}>Perfect for getting started</p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                  {["5 PDF uploads total","20 questions per day","AI Q&A chat","AI Insights panel","Chat history"].map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
                      <svg width="15" height="15" fill="none" stroke="#a78bfa" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="/login" style={{ display: "block", textAlign: "center", textDecoration: "none", fontSize: 14, fontWeight: 700, color: "white", padding: "13px", borderRadius: 12, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", transition: "all 0.2s" }}>
                  Get started free
                </a>
              </div>

              {/* Pro */}
              <div style={{ position: "relative", background: "linear-gradient(135deg,rgba(124,58,237,0.14),rgba(6,182,212,0.07))", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 22, padding: "32px 28px", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(124,58,237,0.2)" }}>
                {/* Badge */}
                <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "white", fontSize: 11, fontWeight: 800, padding: "5px 18px", borderRadius: 50, whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(124,58,237,0.4)" }}>
                  🔥 Most Popular
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Pro</p>
                  <svg width="13" height="13" fill="#fbbf24" viewBox="0 0 24 24"><path d="M12 2L9 9H2l5.5 4L5 20h14l-2.5-7L22 9h-7z"/></svg>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 44, fontWeight: 900, color: "white", letterSpacing: "-1px" }}>₹299</span>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", paddingBottom: 8 }}>/ month</span>
                </div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "0 0 24px" }}>For power users who need more</p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                  {["Unlimited PDF uploads","Unlimited questions","Faster AI responses","PDF Compare feature","Smart data extraction","Priority support","Early access to new features"].map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "rgba(255,255,255,0.72)" }}>
                      <svg width="15" height="15" fill="none" stroke="#4ade80" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <ProPlanCTA />
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "center", marginTop: 10 }}>Secure payment via Razorpay · Cancel anytime</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <section style={{ padding: "80px 24px" }}>
          <div className="cta-box" style={{ maxWidth: 740, margin: "0 auto", textAlign: "center", background: "linear-gradient(135deg,rgba(124,58,237,0.14),rgba(6,182,212,0.08))", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 28, padding: "72px 48px", position: "relative", overflow: "hidden" }}>
            {/* Decorative glows */}
            <div style={{ position: "absolute", top: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.18),transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(6,182,212,0.12),transparent 70%)", pointerEvents: "none" }} />

            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 48, marginBottom: 20, animation: "float 3s ease-in-out infinite" }}>🚀</div>
              <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 900, color: "white", margin: "0 0 16px", letterSpacing: "-0.5px" }}>
                Start using AI with your<br />PDFs today
              </h2>
              <p style={{ fontSize: 17, color: "rgba(255,255,255,0.45)", margin: "0 0 36px", lineHeight: 1.7 }}>
                Free forever. No credit card needed.<br />Upgrade when you&apos;re ready.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
                <a href="/login" className="btn-primary" style={{ display: "inline-block", fontSize: 16, fontWeight: 800, color: "white", textDecoration: "none", padding: "15px 40px", borderRadius: 50, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", boxShadow: "0 10px 36px rgba(124,58,237,0.45)", letterSpacing: "-0.2px" }}>
                  Get Started Free →
                </a>
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 20 }}>
                Join 100+ users already chatting with their PDFs
              </p>
            </div>
          </div>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────────── */}
        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "48px 24px 32px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div className="footer-row" style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 40, marginBottom: 40 }}>
              {/* Brand */}
              <div style={{ maxWidth: 260 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="15" height="15" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 17, fontWeight: 800, color: "white" }}>Intellixy</span>
                </div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", lineHeight: 1.65, margin: 0 }}>AI-powered document assistant. Chat with any PDF, extract insights, and work smarter.</p>
              </div>
              {/* Links */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 40 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 14px" }}>Product</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[["#features","Features"],["#how-it-works","How it works"],["#pricing","Pricing"],["#demo","Demo"]].map(([href, label]) => (
                      <a key={label} href={href} style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", textDecoration: "none", transition: "color 0.15s" }}>{label}</a>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 14px" }}>Legal</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[["Privacy Policy","/privacy-policy"],["Terms of Service","/terms"],["Refund Policy","/refund-policy"],["Contact","mailto:support@intellixy.app"]].map(([label, href]) => (
                      <a key={label} href={href} style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", textDecoration: "none", transition: "color 0.15s" }}>{label}</a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", margin: 0 }}>© 2026 Intellixy. All rights reserved.</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.15)", margin: 0 }}>Made with ♥ using Next.js + GPT-4o</p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
