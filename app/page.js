// SERVER COMPONENT — no "use client", no redirects
import ProPlanCTA from "@/components/ProPlanCTA";

export const metadata = {
  title: "Intellixy - AI Document Assistant",
  description: "Chat with PDFs, extract insights, and compare documents using AI.",
};

export default function HomePage() {
  return (
    <div style={{ background: "#07071a", minHeight: "100vh", color: "white", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

      {/* ── NAVBAR ────────────────────────────────────────────────────── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(7,7,26,0.92)", backdropFilter: "blur(20px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(124,58,237,0.4)" }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: "white", letterSpacing: "-1px" }}>I</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, color: "white", letterSpacing: "-0.3px" }}>Intellixy</span>
          </a>
          {/* Nav links */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <a href="#features" style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", textDecoration: "none", padding: "6px 14px", borderRadius: 8, transition: "color 0.15s" }}>Features</a>
            <a href="#pricing" style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", textDecoration: "none", padding: "6px 14px", borderRadius: 8 }}>Pricing</a>
            <a href="/login" style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.7)", textDecoration: "none", padding: "8px 16px", borderRadius: 8 }}>
              Log in
            </a>
            <a href="/login" style={{ fontSize: 14, fontWeight: 700, color: "white", textDecoration: "none", padding: "9px 20px", borderRadius: 50, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", boxShadow: "0 4px 20px rgba(124,58,237,0.35)" }}>
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", paddingTop: 64 }}>
        {/* Background blobs */}
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.22),transparent 70%)", filter: "blur(70px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-15%", right: "-5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(6,182,212,0.15),transparent 70%)", filter: "blur(70px)", pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: 860, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.28)", borderRadius: 50, padding: "6px 16px", marginBottom: 32 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", display: "inline-block" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#c4b5fd", textTransform: "uppercase", letterSpacing: "0.1em" }}>AI-Powered Document Assistant</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: "clamp(2.8rem,6vw,4.5rem)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-1.5px", color: "white", margin: "0 0 24px" }}>
            Turn any document into{" "}
            <span style={{ background: "linear-gradient(135deg,#a78bfa,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              intelligent conversations
            </span>
          </h1>

          <p style={{ fontSize: "clamp(1rem,2.5vw,1.18rem)", color: "rgba(255,255,255,0.5)", lineHeight: 1.75, maxWidth: 540, margin: "0 auto 12px" }}>
            Upload PDFs, ask questions, get instant insights with AI.
            No more manual searching — just answers.
          </p>

          {/* Use-case line */}
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", margin: "0 auto 32px", letterSpacing: "0.01em" }}>
            Used for invoices, reports, study PDFs
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center", marginBottom: 12 }}>
            <a href="/login" style={{ fontSize: 16, fontWeight: 800, color: "white", textDecoration: "none", padding: "16px 36px", borderRadius: 50, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", boxShadow: "0 10px 40px rgba(124,58,237,0.45)", letterSpacing: "-0.2px" }}>
              Try Intellixy Free →
            </a>
            <a href="#how-it-works" style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.65)", textDecoration: "none", padding: "16px 32px", borderRadius: 50, border: "1px solid rgba(255,255,255,0.14)" }}>
              See how it works
            </a>
          </div>
          {/* Trust text */}
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 40 }}>
            No signup required &nbsp;•&nbsp; Try instantly
          </p>

          {/* Social proof */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 50, padding: "8px 18px", marginBottom: 48 }}>
            <span style={{ fontSize: 15 }}>🔥</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>Trusted by early users</span>
            <div style={{ display: "flex", marginLeft: 4 }}>
              {["#a78bfa","#06b6d4","#f472b6","#34d399","#fbbf24"].map((c, i) => (
                <div key={c} style={{ width: 22, height: 22, borderRadius: "50%", background: `${c}33`, border: `2px solid ${c}`, marginLeft: i === 0 ? 0 : -6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>
                  {["A","B","C","D","E"][i]}
                </div>
              ))}
            </div>
            <span style={{ fontSize: 12, color: "#a78bfa", fontWeight: 700 }}>★ 5.0</span>
          </div>

          {/* Mock dashboard preview */}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 18, overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.5)", maxWidth: 680, margin: "0 auto" }}>
            {/* Window chrome */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.15)" }}>
              <div style={{ width: 11, height: 11, borderRadius: "50%", background: "rgba(239,68,68,0.6)" }} />
              <div style={{ width: 11, height: 11, borderRadius: "50%", background: "rgba(234,179,8,0.6)" }} />
              <div style={{ width: 11, height: 11, borderRadius: "50%", background: "rgba(34,197,94,0.6)" }} />
              <span style={{ marginLeft: 8, fontSize: 11, color: "rgba(255,255,255,0.25)" }}>Intellixy — dashboard</span>
            </div>
            <div style={{ display: "flex", height: 195 }}>
              {/* Sidebar */}
              <div style={{ width: 155, background: "rgba(0,0,0,0.25)", borderRight: "1px solid rgba(255,255,255,0.06)", padding: 12 }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>Documents</p>
                {[{ n: "Q4 Report.pdf", a: true }, { n: "Contract.pdf", a: false }, { n: "Invoice.pdf", a: false }].map(f => (
                  <div key={f.n} style={{ padding: "5px 8px", borderRadius: 7, fontSize: 11, marginBottom: 4, background: f.a ? "rgba(124,58,237,0.22)" : "transparent", color: f.a ? "#c4b5fd" : "rgba(255,255,255,0.3)", border: f.a ? "1px solid rgba(124,58,237,0.28)" : "none" }}>
                    📄 {f.n}
                  </div>
                ))}
              </div>
              {/* Chat */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 10, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "white", fontSize: 12, padding: "8px 14px", borderRadius: "14px 14px 3px 14px", maxWidth: "70%" }}>
                    What is the total revenue in Q4?
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 7, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13 }}>✦</div>
                  <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.82)", fontSize: 12, padding: "8px 14px", borderRadius: "3px 14px 14px 14px" }}>
                    Total Q4 revenue was <strong style={{ color: "#a78bfa" }}>$4.2M</strong>, up 18% from Q3.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: "96px 24px", background: "rgba(255,255,255,0.015)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>How it works</p>
            <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 900, color: "white", margin: "0 0 14px" }}>Up and running in seconds</h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", margin: 0 }}>No setup. No learning curve. Just results.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 0, position: "relative" }}>
            {[
              { step: "01", icon: "📄", title: "Upload your PDF", desc: "Drop any PDF — invoices, contracts, reports, research papers. Up to any size." },
              { step: "02", icon: "💬", title: "Ask a question", desc: "Type your question in plain English. No special commands or syntax needed." },
              { step: "03", icon: "✨", title: "Get instant answers", desc: "AI reads your document and replies with precise, cited answers in seconds." },
            ].map((s, i) => (
              <div key={s.step} style={{ position: "relative", padding: "32px 28px", textAlign: "center" }}>
                {/* Connector line */}
                {i < 2 && (
                  <div style={{ position: "absolute", top: 44, right: 0, width: "50%", height: 1, background: "linear-gradient(90deg,rgba(124,58,237,0.4),transparent)", display: "none" }} />
                )}
                {/* Step circle */}
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,rgba(124,58,237,0.25),rgba(6,182,212,0.15))", border: "1px solid rgba(124,58,237,0.35)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", position: "relative" }}>
                  <span style={{ fontSize: 22 }}>{s.icon}</span>
                  <div style={{ position: "absolute", top: -8, right: -8, width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "white" }}>{s.step}</div>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "white", margin: "0 0 10px" }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.42)", lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
          {/* Arrow connectors for desktop */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
            <a href="/login" style={{ fontSize: 14, fontWeight: 700, color: "white", textDecoration: "none", padding: "12px 28px", borderRadius: 50, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", boxShadow: "0 6px 24px rgba(124,58,237,0.35)" }}>
              Try it now — it&apos;s free
            </a>
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────── */}
      <section id="features" style={{ padding: "96px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Features</p>
            <h2 style={{ fontSize: "clamp(2rem,4vw,2.8rem)", fontWeight: 900, color: "white", margin: "0 0 16px" }}>Understand your documents like never before</h2>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.42)", maxWidth: 500, margin: "0 auto" }}>Everything you need to work smarter with any document.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 24 }}>
            {[
              {
                icon: "💬",
                gradient: "rgba(124,58,237,0.18)",
                border: "rgba(124,58,237,0.3)",
                iconBg: "rgba(124,58,237,0.2)",
                title: "Chat with PDF",
                desc: "Ask any question in plain English and get precise, cited answers directly from your document — no manual searching required.",
                bullets: ["Multi-turn conversation", "Instant semantic search", "Cited from source"],
              },
              {
                icon: "✨",
                gradient: "rgba(6,182,212,0.12)",
                border: "rgba(6,182,212,0.25)",
                iconBg: "rgba(6,182,212,0.15)",
                title: "Instant Insights",
                desc: "One click generates a full summary, key takeaways, and suggested follow-up questions — without reading a single page yourself.",
                bullets: ["Auto-generated summary", "Key points extraction", "Smart question suggestions"],
              },
              {
                icon: "📊",
                gradient: "rgba(167,139,250,0.12)",
                border: "rgba(167,139,250,0.25)",
                iconBg: "rgba(167,139,250,0.15)",
                title: "Compare Documents",
                desc: "Select any two PDFs and let AI identify similarities, differences, and conflicting information across both documents instantly.",
                bullets: ["Side-by-side analysis", "Conflict detection", "Works on any two PDFs"],
              },
            ].map(f => (
              <div key={f.title} style={{ background: `linear-gradient(135deg,${f.gradient},transparent)`, border: `1px solid ${f.border}`, borderRadius: 20, padding: 32 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: f.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 20 }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "white", margin: "0 0 10px", letterSpacing: "-0.3px" }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, margin: "0 0 20px" }}>{f.desc}</p>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {f.bullets.map(b => (
                    <li key={b} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                      <svg width="14" height="14" fill="none" stroke="#a78bfa" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: "96px 24px" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Pricing</p>
            <h2 style={{ fontSize: "clamp(2rem,4vw,2.8rem)", fontWeight: 900, color: "white", margin: "0 0 16px" }}>Simple, honest pricing</h2>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.42)" }}>No hidden fees. Cancel anytime.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
            {[
              {
                name: "Free", price: "₹0", period: "forever", highlight: false,
                features: ["5 PDF uploads", "20 questions / day", "AI Q&A", "AI Insights panel"],
                cta: "Get started free",
              },
              {
                name: "Pro", price: "₹299", period: "/ month", badge: "🔥 Limited early pricing", highlight: true,
                features: ["Unlimited PDFs", "Unlimited questions", "Smart extraction", "PDF Compare", "Priority support"],
                cta: "Upgrade to Pro ₹299/month",
              },
            ].map(p => (
              <div key={p.name} style={{ position: "relative", background: p.highlight ? "linear-gradient(135deg,rgba(124,58,237,0.14),rgba(6,182,212,0.07))" : "rgba(255,255,255,0.03)", border: p.highlight ? "1px solid rgba(124,58,237,0.38)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 32, display: "flex", flexDirection: "column" }}>
                {p.badge && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "white", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 50, whiteSpace: "nowrap" }}>
                    {p.badge}
                  </div>
                )}
                <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.42)", margin: "0 0 8px" }}>{p.name}</p>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 24 }}>
                  <span style={{ fontSize: 40, fontWeight: 900, color: "white" }}>{p.price}</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", paddingBottom: 6 }}>{p.period}</span>
                </div>
                <ul style={{ listStyle: "none", margin: "0 0 28px", padding: 0, display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "rgba(255,255,255,0.62)" }}>
                      <svg width="15" height="15" fill="none" stroke="#a78bfa" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                {p.highlight ? (
                  <ProPlanCTA />
                ) : (
                  <a href="/login" style={{ display: "block", textAlign: "center", textDecoration: "none", fontSize: 14, fontWeight: 700, color: "white", padding: "12px", borderRadius: 12, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {p.cta}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center", background: "linear-gradient(135deg,rgba(124,58,237,0.13),rgba(6,182,212,0.08))", border: "1px solid rgba(124,58,237,0.22)", borderRadius: 24, padding: "64px 40px" }}>
          <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.5rem)", fontWeight: 900, color: "white", margin: "0 0 14px" }}>
            Start understanding your documents today
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.45)", margin: "0 0 32px" }}>
            Free forever — no credit card needed.
          </p>
          <a href="/login" style={{ display: "inline-block", fontSize: 15, fontWeight: 700, color: "white", textDecoration: "none", padding: "14px 36px", borderRadius: 50, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", boxShadow: "0 8px 32px rgba(124,58,237,0.38)" }}>
            Get started for free →
          </a>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "40px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 24 }}>
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: "white" }}>I</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: "white" }}>Intellixy</span>
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", margin: 0 }}>Understand your documents like never before.</p>
            </div>
            {/* Links */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
              {[
                { label: "Privacy Policy", href: "/privacy-policy" },
                { label: "Terms of Service", href: "/terms" },
                { label: "Refund Policy", href: "/refund-policy" },
                { label: "Contact", href: "mailto:support@intellixy.app" },
              ].map(l => (
                <a key={l.label} href={l.href} style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>{l.label}</a>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 20, textAlign: "center" }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", margin: 0 }}>© 2026 Intellixy. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
