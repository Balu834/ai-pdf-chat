"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"
import {
  MessageSquare, Zap, Shield, FileText, Brain, TrendingUp,
  Check, ArrowRight, Star, ChevronRight, Upload, Sparkles, X
} from "lucide-react"

/* ─── CONSTANTS ────────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: MessageSquare,
    color: "#7c3aed",
    glow: "rgba(124,58,237,0.25)",
    title: "Chat with any PDF",
    desc: "Ask questions in plain English and get precise answers pulled directly from your document — no more ctrl+F.",
  },
  {
    icon: Zap,
    color: "#06b6d4",
    glow: "rgba(6,182,212,0.25)",
    title: "Instant Summaries",
    desc: "Get a structured overview of any document in seconds. Perfect for reports, contracts, and research papers.",
  },
  {
    icon: Brain,
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.25)",
    title: "Key Insights & Risks",
    desc: "Surface critical clauses, red flags, and important data points you'd normally miss after hours of reading.",
  },
  {
    icon: TrendingUp,
    color: "#34d399",
    glow: "rgba(52,211,153,0.25)",
    title: "Highlight Important Data",
    desc: "Amounts, dates, names, and key terms are automatically bolded and extracted for quick review.",
  },
  {
    icon: FileText,
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.25)",
    title: "Multi-document Ready",
    desc: "Upload invoices, bills, resumes, contracts, reports — Intellixy handles every document type intelligently.",
  },
  {
    icon: Shield,
    color: "#ef4444",
    glow: "rgba(239,68,68,0.25)",
    title: "Secure & Private",
    desc: "Your files are encrypted in transit and at rest. We never train on your documents. Your data is yours.",
  },
]

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    role: "CA, Mumbai",
    avatar: "PS",
    color: "#7c3aed",
    text: "I process 20+ invoices a day. Intellixy cut my time in half. I just ask 'what's the GST amount?' and it answers instantly.",
    stars: 5,
  },
  {
    name: "Rahul Verma",
    role: "Law Student, Delhi",
    avatar: "RV",
    color: "#06b6d4",
    text: "Reading 100-page case files used to take hours. Now I ask questions and get the key points in 30 seconds. Game changer.",
    stars: 5,
  },
  {
    name: "Ananya Iyer",
    role: "Product Manager, Bengaluru",
    avatar: "AI",
    color: "#34d399",
    text: "We use it for competitor research reports. The summary + key risks feature is exactly what our team needed.",
    stars: 5,
  },
]

const STATS = [
  { value: "1,200+", label: "Active Users" },
  { value: "50K+", label: "PDFs Processed" },
  { value: "500K+", label: "Questions Answered" },
  { value: "< 2s", label: "Avg Response Time" },
]

const DEMO_MESSAGES = [
  {
    role: "user",
    content: "What medications were included in the bill and what is the total amount?",
  },
  {
    role: "assistant",
    content: `📄 **Summary:**
• Bill includes 3 medications prescribed on 15 Jan 2025
• Total amount payable is **₹3,240** after insurance
• Issued by Apollo Pharmacy, Hyderabad

💡 **Key Details:**
• Medication 1: **Azithromycin 500mg** — ₹480
• Medication 2: **Paracetamol 650mg** — ₹120
• Medication 3: **Vitamin D3 60K** — ₹890
• Subtotal: **₹1,490** | Tax (18% GST): **₹268**
• Insurance deduction: **−₹1,200**
• **Total Payable: ₹3,240**

❓ **You might also ask:**
• Is this covered under my health insurance policy?
• What is the expiry date of these medications?`,
  },
]

/* ─── ANIMATED COUNTER ─────────────────────────────────────────────────────── */
function AnimatedStat({ value, label }: { value: string; label: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <div style={{ fontSize: "2.5rem", fontWeight: 800, background: "linear-gradient(135deg,#c4b5fd,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
        {value}
      </div>
      <div style={{ fontSize: "0.875rem", color: "rgba(240,240,248,0.5)", marginTop: 4, fontWeight: 500 }}>{label}</div>
    </motion.div>
  )
}

/* ─── FEATURE CARD ─────────────────────────────────────────────────────────── */
function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const [hovered, setHovered] = useState(false)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const Icon = feature.icon
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? feature.color + "55" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 20,
        padding: "28px 24px",
        transition: "all 0.3s ease",
        boxShadow: hovered ? `0 8px 40px ${feature.glow}` : "none",
        cursor: "default",
      }}
    >
      <div style={{ width: 48, height: 48, borderRadius: 14, background: feature.color + "22", border: `1px solid ${feature.color}44`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, transition: "transform 0.3s", transform: hovered ? "scale(1.1)" : "scale(1)" }}>
        <Icon size={22} color={feature.color} />
      </div>
      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f0f0f8", marginBottom: 8 }}>{feature.title}</h3>
      <p style={{ fontSize: "0.875rem", color: "rgba(240,240,248,0.55)", lineHeight: 1.65 }}>{feature.desc}</p>
    </motion.div>
  )
}

/* ─── DEMO CHAT ────────────────────────────────────────────────────────────── */
function DemoChat() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })
  const [visibleMsg, setVisibleMsg] = useState(0)

  useEffect(() => {
    if (!inView) return
    const t1 = setTimeout(() => setVisibleMsg(1), 400)
    const t2 = setTimeout(() => setVisibleMsg(2), 1400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [inView])

  return (
    <div ref={ref} style={{ maxWidth: 780, margin: "0 auto", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 24, overflow: "hidden", boxShadow: "0 40px 120px rgba(124,58,237,0.18)" }}>
      {/* Window chrome */}
      <div style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", gap: 7 }}>
          {["#ef4444","#f59e0b","#22c55e"].map(c => <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c, opacity: 0.8 }} />)}
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
          <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "4px 14px", fontSize: "0.75rem", color: "rgba(240,240,248,0.4)", display: "flex", alignItems: "center", gap: 6 }}>
            <FileText size={12} />
            Medical_Bill_Jan2025.pdf
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["Summarize","Key Points","Risks"].map(l => (
            <div key={l} style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 99, padding: "3px 10px", fontSize: "0.7rem", color: "#a78bfa" }}>{l}</div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{ padding: "24px 24px 20px", minHeight: 340, display: "flex", flexDirection: "column", gap: 18 }}>
        <AnimatePresence>
          {visibleMsg >= 1 && (
            <motion.div key="user" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ maxWidth: "72%", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", borderRadius: "18px 18px 4px 18px", padding: "12px 16px", fontSize: "0.875rem", color: "white", lineHeight: 1.5 }}>
                {DEMO_MESSAGES[0].content}
              </div>
            </motion.div>
          )}
          {visibleMsg >= 2 && (
            <motion.div key="ai" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Sparkles size={15} color="white" />
                </div>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px 18px 18px 18px", padding: "14px 16px", fontSize: "0.8rem", color: "rgba(240,240,248,0.88)", lineHeight: 1.75, whiteSpace: "pre-line" }}>
                  {DEMO_MESSAGES[1].content}
                </div>
              </div>
            </motion.div>
          )}
          {visibleMsg < 1 && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}>
              {[80,60,90].map((w,i) => (
                <div key={i} style={{ height: 12, borderRadius: 6, background: "rgba(255,255,255,0.06)", width: `${w}%`, animation: "shimmer 1.5s infinite", backgroundImage: "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.05) 50%,transparent 100%)", backgroundSize: "200% 100%" }} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input bar */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 10, background: "rgba(7,7,26,0.6)" }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, padding: "10px 14px", fontSize: "0.8rem", color: "rgba(240,240,248,0.3)" }}>
          Ask anything about your document…
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ArrowRight size={16} color="white" />
        </div>
      </div>
    </div>
  )
}

/* ─── MAIN PAGE ────────────────────────────────────────────────────────────── */
export default function Home() {
  const router = useRouter()
  const [navScrolled, setNavScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 30)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const goToDashboard = () => router.push("/dashboard")

  return (
    <main style={{ minHeight: "100vh", background: "#07071a", color: "#f0f0f8", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", overflowX: "hidden" }}>

      {/* ── BACKGROUND ORBS ────────────────────────────────────────────────── */}
      <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.18) 0%,transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", top: "10%", right: "-15%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(6,182,212,0.12) 0%,transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "20%", left: "30%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(167,139,250,0.1) 0%,transparent 70%)", filter: "blur(60px)" }} />
      </div>

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 max(24px,calc((100vw - 1280px)/2))",
        height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: navScrolled ? "rgba(7,7,26,0.92)" : "transparent",
        backdropFilter: navScrolled ? "blur(20px)" : "none",
        borderBottom: navScrolled ? "1px solid rgba(255,255,255,0.07)" : "none",
        transition: "all 0.3s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={15} color="white" />
          </div>
          <span style={{ fontSize: "1.125rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Intellixy</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="hidden-mobile">
          {["Features","Pricing","Demo"].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{ fontSize: "0.875rem", color: "rgba(240,240,248,0.6)", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color="#f0f0f8")}
              onMouseLeave={e => (e.currentTarget.style.color="rgba(240,240,248,0.6)")}
            >{l}</a>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => router.push("/login")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem", color: "rgba(240,240,248,0.6)", padding: "8px 12px", borderRadius: 8, transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color="#f0f0f8")}
            onMouseLeave={e => (e.currentTarget.style.color="rgba(240,240,248,0.6)")}
          >Log in</button>
          <button onClick={goToDashboard} style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none", cursor: "pointer", color: "white", padding: "9px 20px", borderRadius: 10, fontSize: "0.875rem", fontWeight: 600, transition: "all 0.2s", boxShadow: "0 4px 20px rgba(124,58,237,0.4)" }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 8px 28px rgba(124,58,237,0.55)" }}
            onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 4px 20px rgba(124,58,237,0.4)" }}
          >Start Free Trial</button>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section style={{ position: "relative", zIndex: 1, paddingTop: 160, paddingBottom: 120, textAlign: "center", padding: "160px max(24px,calc((100vw - 1280px)/2)) 120px" }}>

        {/* Trust badge */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 99, padding: "6px 16px", fontSize: "0.8rem", color: "#a78bfa", marginBottom: 32 }}>
          <Star size={13} fill="#a78bfa" color="#a78bfa" />
          Trusted by 1,200+ users across India
          <Star size={13} fill="#a78bfa" color="#a78bfa" />
        </motion.div>

        {/* Headline */}
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
          style={{ fontSize: "clamp(2.8rem,6vw,4.75rem)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.04em", margin: "0 auto 24px", maxWidth: 820 }}>
          Stop reading{" "}
          <span style={{ background: "linear-gradient(135deg,#c4b5fd,#06b6d4,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            PDFs.
          </span>
          <br />
          Start chatting with them.
        </motion.h1>

        {/* Subheadline */}
        <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
          style={{ fontSize: "1.2rem", color: "rgba(240,240,248,0.55)", maxWidth: 560, margin: "0 auto 48px", lineHeight: 1.65 }}>
          Upload any document and get instant summaries, answers, and insights in seconds. No more endless scrolling.
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
          style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={goToDashboard}
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none", cursor: "pointer", color: "white", padding: "16px 32px", borderRadius: 14, fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 8px 40px rgba(124,58,237,0.5)", transition: "all 0.25s" }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px) scale(1.02)"; e.currentTarget.style.boxShadow="0 16px 56px rgba(124,58,237,0.65)" }}
            onMouseLeave={e => { e.currentTarget.style.transform="translateY(0) scale(1)"; e.currentTarget.style.boxShadow="0 8px 40px rgba(124,58,237,0.5)" }}
          >
            Start Free Trial
            <ArrowRight size={18} />
          </button>
          <a href="#demo" style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(240,240,248,0.65)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, border: "1px solid rgba(255,255,255,0.12)", padding: "15px 28px", borderRadius: 14, transition: "all 0.2s", backdropFilter: "blur(8px)" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.25)"; e.currentTarget.style.color="#f0f0f8" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"; e.currentTarget.style.color="rgba(240,240,248,0.65)" }}
          >
            <span style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>▶</span>
            Watch Demo
          </a>
        </motion.div>

        {/* Micro copy */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
          style={{ marginTop: 20, fontSize: "0.8rem", color: "rgba(240,240,248,0.3)" }}>
          No credit card required · Setup in 10 seconds · Free plan included
        </motion.p>

        {/* Stats strip */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}
          style={{ display: "flex", justifyContent: "center", gap: "clamp(24px,5vw,72px)", marginTop: 72, flexWrap: "wrap" }}>
          {STATS.map(s => <AnimatedStat key={s.label} {...s} />)}
        </motion.div>
      </section>

      {/* ── DEMO ───────────────────────────────────────────────────────────── */}
      <section id="demo" style={{ position: "relative", zIndex: 1, padding: "0 max(24px,calc((100vw - 1280px)/2)) 120px" }}>
        <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ display: "inline-block", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)", borderRadius: 99, padding: "5px 14px", fontSize: "0.75rem", color: "#06b6d4", fontWeight: 600, marginBottom: 16, letterSpacing: "0.08em", textTransform: "uppercase" }}>Live Preview</div>
          <h2 style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 auto 16px", lineHeight: 1.15 }}>
            See Intellixy in action
          </h2>
          <p style={{ fontSize: "1.05rem", color: "rgba(240,240,248,0.5)", maxWidth: 480, margin: "0 auto" }}>
            Upload a PDF, ask a question, get a structured answer — in under 2 seconds.
          </p>
        </motion.div>
        <DemoChat />
      </section>

      {/* ── PROBLEM → SOLUTION ─────────────────────────────────────────────── */}
      <section style={{ position: "relative", zIndex: 1, padding: "100px max(24px,calc((100vw - 1280px)/2))" }}>
        <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 32, alignItems: "center" }} className="problem-grid">

          {/* Problem */}
          <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 24, padding: "40px 36px" }}>
            <div style={{ fontSize: "2rem", marginBottom: 16 }}>😩</div>
            <div style={{ display: "inline-block", background: "rgba(239,68,68,0.12)", borderRadius: 99, padding: "3px 12px", fontSize: "0.72rem", fontWeight: 700, color: "#ef4444", marginBottom: 20, letterSpacing: "0.06em", textTransform: "uppercase" }}>The Old Way</div>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 16, lineHeight: 1.25 }}>Reading long PDFs is slow and painful</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {["Scroll through 50+ pages to find one number", "Miss critical clauses buried in legal text", "Spend hours on documents that take 30 seconds", "Copy-paste into notes just to find things again"].map(p => (
                <div key={p} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <X size={16} color="#ef4444" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: "0.875rem", color: "rgba(240,240,248,0.6)", lineHeight: 1.5 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 32px rgba(124,58,237,0.4)" }}>
              <ArrowRight size={20} color="white" />
            </div>
          </div>

          {/* Solution */}
          <div style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 24, padding: "40px 36px" }}>
            <div style={{ fontSize: "2rem", marginBottom: 16 }}>🚀</div>
            <div style={{ display: "inline-block", background: "rgba(124,58,237,0.15)", borderRadius: 99, padding: "3px 12px", fontSize: "0.72rem", fontWeight: 700, color: "#a78bfa", marginBottom: 20, letterSpacing: "0.06em", textTransform: "uppercase" }}>With Intellixy</div>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 16, lineHeight: 1.25 }}>Ask questions, get instant answers</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {["Type your question, get the exact answer in 2s", "Key clauses and risks surfaced automatically", "Structured summaries in bullet-point format", "Chat history saved — always find what you asked"].map(p => (
                <div key={p} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <Check size={16} color="#4ade80" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: "0.875rem", color: "rgba(240,240,248,0.7)", lineHeight: 1.5 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────────── */}
      <section id="features" style={{ position: "relative", zIndex: 1, padding: "100px max(24px,calc((100vw - 1280px)/2))" }}>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ display: "inline-block", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: 99, padding: "5px 14px", fontSize: "0.75rem", color: "#a78bfa", fontWeight: 600, marginBottom: 16, letterSpacing: "0.08em", textTransform: "uppercase" }}>Everything you need</div>
          <h2 style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16, lineHeight: 1.15 }}>
            Powerful features for every document
          </h2>
          <p style={{ fontSize: "1.05rem", color: "rgba(240,240,248,0.5)", maxWidth: 480, margin: "0 auto" }}>
            Built for professionals who need to move fast — CAs, lawyers, students, analysts.
          </p>
        </motion.div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }} className="features-grid">
          {FEATURES.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────────────────── */}
      <section style={{ position: "relative", zIndex: 1, padding: "100px max(24px,calc((100vw - 1280px)/2))" }}>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 2, marginBottom: 16 }}>
            {[1,2,3,4,5].map(i => <Star key={i} size={20} fill="#fbbf24" color="#fbbf24" />)}
          </div>
          <h2 style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16, lineHeight: 1.15 }}>
            Loved by 1,200+ users
          </h2>
          <p style={{ fontSize: "1.05rem", color: "rgba(240,240,248,0.5)" }}>
            Real people saving real hours every week.
          </p>
        </motion.div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }} className="testimonials-grid">
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={t.name}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "28px 24px" }}>
              <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="#fbbf24" color="#fbbf24" />)}
              </div>
              <p style={{ fontSize: "0.9rem", color: "rgba(240,240,248,0.72)", lineHeight: 1.7, marginBottom: 20 }}>"{t.text}"</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: t.color + "33", border: `2px solid ${t.color}66`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: t.color }}>
                  {t.avatar}
                </div>
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 700 }}>{t.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(240,240,248,0.4)" }}>{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ position: "relative", zIndex: 1, padding: "100px max(24px,calc((100vw - 1280px)/2))" }}>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ display: "inline-block", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 99, padding: "5px 14px", fontSize: "0.75rem", color: "#fbbf24", fontWeight: 600, marginBottom: 16, letterSpacing: "0.08em", textTransform: "uppercase" }}>🔥 Launch Pricing</div>
          <h2 style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16 }}>
            Simple, honest pricing
          </h2>
          <p style={{ fontSize: "1.05rem", color: "rgba(240,240,248,0.5)" }}>
            Start free, upgrade when you're ready.
          </p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 860, margin: "0 auto" }} className="pricing-grid">

          {/* FREE */}
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "40px 36px" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "rgba(240,240,248,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Free</div>
            <div style={{ fontSize: "3.5rem", fontWeight: 900, lineHeight: 1, marginBottom: 4 }}>₹0</div>
            <div style={{ fontSize: "0.875rem", color: "rgba(240,240,248,0.4)", marginBottom: 32 }}>Forever free, no card needed</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
              {["3 PDFs total","20 questions lifetime","Basic Q&A","Standard AI speed"].map(f => (
                <div key={f} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <Check size={15} color="#4ade80" />
                  <span style={{ fontSize: "0.9rem", color: "rgba(240,240,248,0.65)" }}>{f}</span>
                </div>
              ))}
            </div>
            <button onClick={goToDashboard} style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "13px 0", fontSize: "0.9rem", fontWeight: 600, color: "rgba(240,240,248,0.8)", cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.1)"}
              onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.06)"}
            >
              Get Started Free
            </button>
          </motion.div>

          {/* PRO */}
          <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            style={{ background: "linear-gradient(160deg,rgba(124,58,237,0.18) 0%,rgba(79,70,229,0.1) 100%)", border: "1.5px solid rgba(124,58,237,0.5)", borderRadius: 24, padding: "40px 36px", position: "relative", boxShadow: "0 0 60px rgba(124,58,237,0.2), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
            <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", borderRadius: 99, padding: "5px 18px", fontSize: "0.75rem", fontWeight: 800, color: "white", whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(124,58,237,0.5)" }}>
              🔥 MOST POPULAR
            </div>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#a78bfa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Pro</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: "3.5rem", fontWeight: 900, lineHeight: 1 }}>₹299</span>
              <span style={{ fontSize: "1rem", color: "rgba(240,240,248,0.4)" }}>/month</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
              <span style={{ fontSize: "0.875rem", color: "rgba(240,240,248,0.4)", textDecoration: "line-through" }}>₹999/mo</span>
              <span style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 99, padding: "2px 10px", fontSize: "0.72rem", fontWeight: 700, color: "#fbbf24" }}>70% OFF — LAUNCH PRICE</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
              {["Unlimited PDFs","Unlimited questions","Priority AI (2× faster)","Advanced insights & risks","Chat history saved","Priority support"].map(f => (
                <div key={f} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(124,58,237,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Check size={11} color="#a78bfa" />
                  </div>
                  <span style={{ fontSize: "0.9rem", color: "rgba(240,240,248,0.85)" }}>{f}</span>
                </div>
              ))}
            </div>
            <button onClick={goToDashboard} style={{ width: "100%", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none", borderRadius: 12, padding: "14px 0", fontSize: "0.95rem", fontWeight: 700, color: "white", cursor: "pointer", transition: "all 0.25s", boxShadow: "0 8px 32px rgba(124,58,237,0.45)" }}
              onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 14px 44px rgba(124,58,237,0.6)" }}
              onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 8px 32px rgba(124,58,237,0.45)" }}
            >
              Upgrade to Pro →
            </button>
            <p style={{ textAlign: "center", fontSize: "0.75rem", color: "rgba(240,240,248,0.35)", marginTop: 14 }}>
              30-day money-back guarantee
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────────────── */}
      <section style={{ position: "relative", zIndex: 1, padding: "100px max(24px,calc((100vw - 1280px)/2))" }}>
        <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.2) 0%,rgba(6,182,212,0.1) 100%)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 32, padding: "80px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}>

          {/* BG glow */}
          <div aria-hidden style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.25) 0%,transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <Upload size={40} color="#a78bfa" style={{ margin: "0 auto 24px" }} />
            <h2 style={{ fontSize: "clamp(2rem,4.5vw,3.5rem)", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: 20, lineHeight: 1.1 }}>
              Start using AI on your{" "}
              <span style={{ background: "linear-gradient(135deg,#c4b5fd,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                PDFs today
              </span>
            </h2>
            <p style={{ fontSize: "1.15rem", color: "rgba(240,240,248,0.55)", marginBottom: 40, maxWidth: 480, margin: "0 auto 40px" }}>
              Join 1,200+ professionals who already save hours every week with Intellixy.
            </p>
            <button onClick={goToDashboard}
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none", cursor: "pointer", color: "white", padding: "18px 40px", borderRadius: 14, fontSize: "1.05rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 10, boxShadow: "0 8px 40px rgba(124,58,237,0.55)", transition: "all 0.25s" }}
              onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px) scale(1.02)"; e.currentTarget.style.boxShadow="0 16px 56px rgba(124,58,237,0.7)" }}
              onMouseLeave={e => { e.currentTarget.style.transform="translateY(0) scale(1)"; e.currentTarget.style.boxShadow="0 8px 40px rgba(124,58,237,0.55)" }}
            >
              Start Free Trial
              <ArrowRight size={20} />
            </button>
            <div style={{ display: "flex", justifyContent: "center", gap: 28, marginTop: 20, flexWrap: "wrap" }}>
              {["No credit card required","Takes 10 seconds","Free plan included"].map(t => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", color: "rgba(240,240,248,0.4)" }}>
                  <Check size={13} color="#4ade80" />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer style={{ position: "relative", zIndex: 1, padding: "40px max(24px,calc((100vw - 1280px)/2)) 48px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={13} color="white" />
            </div>
            <span style={{ fontSize: "1rem", fontWeight: 800 }}>Intellixy</span>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {["Features","Pricing","Privacy Policy","Terms of Service"].map(l => (
              <a key={l} href="#" style={{ fontSize: "0.82rem", color: "rgba(240,240,248,0.35)", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.color="rgba(240,240,248,0.7)"}
                onMouseLeave={e => e.currentTarget.style.color="rgba(240,240,248,0.35)"}
              >{l}</a>
            ))}
          </div>
          <p style={{ fontSize: "0.8rem", color: "rgba(240,240,248,0.25)", margin: 0 }}>
            © {new Date().getFullYear()} Intellixy. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ── RESPONSIVE STYLES ──────────────────────────────────────────────── */}
      <style>{`
        @media (max-width: 900px) {
          .problem-grid   { grid-template-columns: 1fr !important; gap: 16px !important; }
          .problem-grid > div:nth-child(2) { display: none !important; }
          .features-grid  { grid-template-columns: 1fr 1fr !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
          .pricing-grid   { grid-template-columns: 1fr !important; max-width: 480px !important; }
        }
        @media (max-width: 600px) {
          .features-grid  { grid-template-columns: 1fr !important; }
          .hidden-mobile  { display: none !important; }
        }
      `}</style>
    </main>
  )
}
