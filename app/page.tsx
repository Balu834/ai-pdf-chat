"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef, useCallback } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"
import {
  MessageSquare, Zap, Shield, FileText, Brain, TrendingUp,
  Check, ArrowRight, Star, Upload, Sparkles, ChevronDown,
  Users, Clock, Lock, Menu, X, Play, Globe,
} from "lucide-react"

/* ═══════════════════════════════════════════════ BRAND */
const BRAND = {
  primary:  "#6366F1",
  violet:   "#8B5CF6",
  blue:     "#3B82F6",
  grad:     "linear-gradient(135deg,#6366F1 0%,#8B5CF6 50%,#3B82F6 100%)",
  text:     "#0F172A",
  body:     "#334155",
  muted:    "#64748B",
  border:   "#E2E8F0",
  surface:  "#F8FAFC",
  white:    "#FFFFFF",
}

/* ═══════════════════════════════════════════════ DATA */
const FEATURES = [
  { icon: MessageSquare, label: "Instant AI Answers",
    desc: "Ask anything in plain English. Get precise answers pulled from your exact document in under 2 seconds.",
    color: "#6366F1", bg: "#EEF2FF", badge: "Core" },
  { icon: Zap, label: "Smart Summaries",
    desc: "Structured bullet-point overviews of any document. Perfect for reports, contracts and research papers.",
    color: "#8B5CF6", bg: "#F5F3FF", badge: "Popular" },
  { icon: Brain, label: "Risk & Insight Engine",
    desc: "Surface critical clauses, red flags and hidden data points you'd miss after hours of reading.",
    color: "#3B82F6", bg: "#EFF6FF", badge: "Pro" },
  { icon: TrendingUp, label: "Data Extraction",
    desc: "Dates, amounts, names, and key terms auto-extracted and structured for instant review.",
    color: "#059669", bg: "#ECFDF5", badge: "AI" },
  { icon: FileText, label: "Every Document Type",
    desc: "Invoices, contracts, research papers, medical bills, resumes — every PDF handled intelligently.",
    color: "#D97706", bg: "#FFFBEB", badge: "Flexible" },
  { icon: Shield, label: "Secure & Private",
    desc: "End-to-end encryption, zero AI training on your data. Your documents stay yours — always.",
    color: "#DC2626", bg: "#FFF5F5", badge: "Trust" },
]

const STEPS = [
  { n: "01", icon: Upload, color: "#6366F1", title: "Upload your PDF",
    desc: "Drag & drop or browse to upload. Any PDF up to 50MB processed in seconds." },
  { n: "02", icon: MessageSquare, color: "#8B5CF6", title: "Ask in plain English",
    desc: "Type naturally. No special syntax — just ask exactly what you want to know." },
  { n: "03", icon: Sparkles, color: "#3B82F6", title: "Get instant answers",
    desc: "AI pulls precise answers directly from your document with source context." },
]

const TESTIMONIALS = [
  { name: "Priya Sharma", role: "Chartered Accountant", company: "Mumbai", av: "PS", color: "#6366F1", stars: 5,
    quote: "I process 20+ invoices daily. Intellixy cut my review time in half. I just ask 'what's the GST amount?' and get the answer in seconds." },
  { name: "Rahul Verma", role: "Law Student", company: "NLU Delhi", av: "RV", color: "#8B5CF6", stars: 5,
    quote: "Reading 100-page case files used to take hours. Now I ask questions and get the key points in 30 seconds. Absolute game changer for law school." },
  { name: "Ananya Iyer", role: "Product Manager", company: "Razorpay", av: "AI", color: "#059669", stars: 5,
    quote: "We use it for competitor research reports. The summary + key risks feature is exactly what our team needed to move faster on decisions." },
]

const PLANS = [
  { name: "Free", mo: 0, yr: 0, cta: "Start Free",
    desc: "Perfect for individuals trying Intellixy",
    features: ["3 PDF uploads", "20 questions / month", "AI answers & summaries", "Chat history (7 days)", "Email support"],
    missing: ["Unlimited PDFs", "Voice input", "Advanced insights"],
  },
  { name: "Pro", mo: 299, yr: 249, cta: "Get Pro", highlight: true, badge: "Most Popular",
    desc: "For professionals who rely on documents daily",
    features: ["Unlimited PDFs", "Unlimited questions", "Advanced AI insights", "Risk & data extraction", "Voice input", "Persistent chat history", "Compare documents", "Priority support"],
    missing: [],
  },
  { name: "Team", mo: 999, yr: 799, cta: "Contact Sales",
    desc: "For teams and growing organizations",
    features: ["Everything in Pro", "5 team seats", "Shared document library", "Admin controls", "Team chat history", "Dedicated support", "SSO (coming soon)"],
    missing: [],
  },
]

const FAQS = [
  { q: "Is Intellixy really free to start?",
    a: "Yes. The free plan gives you 3 PDFs and 20 questions per month — no credit card required. You get full AI capability so you can evaluate before upgrading." },
  { q: "How accurate are the AI answers?",
    a: "Very accurate. Intellixy uses retrieval-augmented generation (RAG) — answers are pulled directly from your document, not from general AI knowledge. Sources are cited." },
  { q: "What document types are supported?",
    a: "Any text-based PDF: invoices, contracts, legal documents, research papers, medical reports, financial statements and resumes. Scanned image PDFs may have limited accuracy." },
  { q: "Is my data secure?",
    a: "Absolutely. Files are encrypted in transit and at rest. We never use your documents to train any AI model. You can delete your data at any time." },
  { q: "Can I use multiple documents?",
    a: "Free users upload up to 3 PDFs. Pro users get unlimited uploads with instant switching between documents and full chat history per document." },
  { q: "What's included in Pro?",
    a: "Unlimited PDFs and questions, advanced risk & insight analysis, saved chat history, voice input, document comparison, and priority support — ₹299/month." },
]

/* ═══════════════════════════════════════════════ UTIL */
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]
const fade   = (delay = 0, y = 24) => ({ initial: { opacity: 0, y }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.55, ease: EASE } })
const fadeVP = (delay = 0, y = 24) => ({ initial: { opacity: 0, y }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { delay, duration: 0.55, ease: EASE } })

function Grad({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span style={{ background: BRAND.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", ...style }}>
      {children}
    </span>
  )
}

/* ═══════════════════════════════════════════════ NAVBAR */
function Navbar({ onNav }: { onNav: (id: string) => void }) {
  const [scrolled, setScrolled] = useState(false)
  const [menu, setMenu] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        height: 64,
        background: scrolled ? "rgba(255,255,255,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(24px)" : "none",
        borderBottom: scrolled ? `1px solid ${BRAND.border}` : "1px solid transparent",
        transition: "all 0.25s ease",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px", height: "100%", display: "flex", alignItems: "center", gap: 8 }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0, marginRight: "auto" }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: BRAND.grad, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(99,102,241,0.4)" }}>
              <Sparkles size={15} color="#fff" />
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, color: BRAND.text, letterSpacing: "-0.03em" }}>Intellixy</span>
          </Link>

          {/* Nav links */}
          <div className="nav-desktop" style={{ display: "flex", gap: 2 }}>
            {["Features","Pricing","Testimonials","FAQ"].map(l => (
              <button key={l} onClick={() => onNav(l.toLowerCase())}
                style={{ background: "none", border: "none", padding: "7px 14px", fontSize: 14, fontWeight: 500, color: BRAND.body, cursor: "pointer", borderRadius: 8, transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget.style.color = BRAND.primary); (e.currentTarget.style.background = "#EEF2FF"); }}
                onMouseLeave={e => { (e.currentTarget.style.color = BRAND.body); (e.currentTarget.style.background = "none"); }}>
                {l}
              </button>
            ))}
          </div>

          {/* CTAs */}
          <div className="nav-desktop" style={{ display: "flex", gap: 10, alignItems: "center", marginLeft: "auto" }}>
            <Link href="/login" style={{ fontSize: 14, fontWeight: 600, color: BRAND.body, textDecoration: "none", padding: "7px 14px", borderRadius: 8, transition: "color 0.15s" }}
              onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = BRAND.primary)}
              onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = BRAND.body)}>
              Log In
            </Link>
            <Link href="/login" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", background: BRAND.grad, borderRadius: 10, fontSize: 14, fontWeight: 700, color: "#fff", textDecoration: "none", boxShadow: "0 4px 16px rgba(99,102,241,0.35)", transition: "box-shadow 0.2s, transform 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 28px rgba(99,102,241,0.5)"; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 16px rgba(99,102,241,0.35)"; (e.currentTarget as HTMLAnchorElement).style.transform = "none"; }}>
              Start Free <ArrowRight size={14} />
            </Link>
          </div>

          <button className="nav-mobile-btn" onClick={() => setMenu(true)}
            style={{ display: "none", background: "none", border: "none", cursor: "pointer", color: BRAND.text, padding: 6, marginLeft: "auto" }}>
            <Menu size={22} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menu && (
          <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMenu(false)}
            style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(8px)" }}>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 300, background: "#fff", padding: 24, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: BRAND.text }}>Intellixy</span>
                <button onClick={() => setMenu(false)} style={{ background: "none", border: "none", cursor: "pointer", color: BRAND.muted }}><X size={20} /></button>
              </div>
              {["Features","Pricing","Testimonials","FAQ"].map(l => (
                <button key={l} onClick={() => { setMenu(false); onNav(l.toLowerCase()); }}
                  style={{ background: "none", border: "none", textAlign: "left", padding: "14px 0", fontSize: 16, fontWeight: 600, color: BRAND.body, cursor: "pointer", borderBottom: `1px solid ${BRAND.border}` }}>
                  {l}
                </button>
              ))}
              <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
                <Link href="/login" onClick={() => setMenu(false)} style={{ textAlign: "center", display: "block", padding: 13, border: `1.5px solid ${BRAND.border}`, borderRadius: 12, fontWeight: 600, color: BRAND.body, textDecoration: "none" }}>Log In</Link>
                <Link href="/login" onClick={() => setMenu(false)} style={{ textAlign: "center", display: "block", padding: 13, background: BRAND.grad, borderRadius: 12, fontWeight: 700, color: "#fff", textDecoration: "none" }}>Start Free →</Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/* ═══════════════════════════════════════════════ PRODUCT MOCKUP */
function ProductMockup() {
  const sideItems = [
    { icon: "⊞", label: "Dashboard" },
    { icon: "📄", label: "My PDFs", active: false },
    { icon: "💬", label: "Chat", active: true },
    { icon: "📊", label: "Insights" },
    { icon: "⚙️", label: "Settings" },
  ]

  return (
    <div style={{ position: "relative" }}>
      {/* Main window */}
      <motion.div
        {...fade(0.4)}
        style={{
          background: "#0D0D1F",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 48px 120px rgba(99,102,241,0.22), 0 24px 64px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Window chrome */}
        <div style={{ background: "rgba(255,255,255,0.04)", padding: "11px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["#FF5F57","#FEBC2E","#28C840"].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />)}
          </div>
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "4px 16px", fontSize: 11.5, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: 5 }}>
              <Lock size={9} /> app.intellixy.ai
            </div>
          </div>
        </div>

        {/* App layout */}
        <div style={{ display: "flex", height: 390 }}>
          {/* Sidebar */}
          <div style={{ width: 170, background: "#080819", borderRight: "1px solid rgba(255,255,255,0.05)", padding: "14px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "3px 8px", marginBottom: 14 }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: BRAND.grad, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles size={11} color="#fff" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>Intellixy</span>
            </div>

            {/* New chat button */}
            <div style={{ margin: "0 0 10px", padding: "7px 10px", background: "linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.18))", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, fontSize: 11, fontWeight: 700, color: "#a5b4fc", display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
              <span>+</span> New Chat
            </div>

            {sideItems.map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 10px", borderRadius: 8, background: item.active ? "rgba(99,102,241,0.15)" : "transparent", border: item.active ? "1px solid rgba(99,102,241,0.25)" : "1px solid transparent", cursor: "pointer" }}>
                <span style={{ fontSize: 12 }}>{item.icon}</span>
                <span style={{ fontSize: 11.5, fontWeight: item.active ? 700 : 500, color: item.active ? "#a5b4fc" : "rgba(255,255,255,0.4)" }}>{item.label}</span>
              </div>
            ))}

            <div style={{ marginTop: "auto", padding: "12px 10px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 9 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Usage</div>
              <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginBottom: 4 }}>
                <div style={{ width: "40%", height: "100%", background: BRAND.grad, borderRadius: 99 }} />
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>2 / 3 PDFs · Free</div>
            </div>
          </div>

          {/* Main chat area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {/* Doc header */}
            <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.02)" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(99,102,241,0.18)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FileText size={13} color="#a5b4fc" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.88)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Q3_Financial_Report_2024.pdf</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>42 pages · Uploaded just now</div>
              </div>
              <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                {["Summarize","Key Risks","Extract Data"].map(l => (
                  <div key={l} style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.22)", borderRadius: 99, padding: "3px 9px", fontSize: 9.5, fontWeight: 700, color: "#a5b4fc" }}>{l}</div>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14, overflowY: "hidden" }}>

              {/* User message */}
              <motion.div {...fade(0.7)} style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ maxWidth: "72%", background: BRAND.grad, borderRadius: "16px 16px 4px 16px", padding: "10px 14px", fontSize: 12, color: "#fff", lineHeight: 1.55, fontWeight: 500 }}>
                  What was the total revenue in Q3 and how does it compare to Q2?
                </div>
              </motion.div>

              {/* AI message */}
              <motion.div {...fade(1.1)} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: BRAND.grad, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, boxShadow: "0 4px 12px rgba(99,102,241,0.5)" }}>
                  <Sparkles size={12} color="#fff" />
                </div>
                <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "4px 16px 16px 16px", padding: "12px 14px", fontSize: 11.5, color: "rgba(255,255,255,0.85)", lineHeight: 1.75, flex: 1 }}>
                  <div style={{ fontWeight: 700, color: "#a5b4fc", fontSize: 10.5, marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.06em" }}>✦ AI Answer</div>
                  <div><strong style={{ color: "#fff" }}>Q3 Revenue: ₹24.5 Crore</strong> — up <strong style={{ color: "#4ade80" }}>24% YoY</strong></div>
                  <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.55)" }}>• Q3 2024: <strong style={{ color: "rgba(255,255,255,0.8)" }}>₹24.5Cr</strong></div>
                    <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.55)" }}>• Q2 2024: <strong style={{ color: "rgba(255,255,255,0.8)" }}>₹19.7Cr</strong></div>
                    <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.55)" }}>• QoQ growth: <strong style={{ color: "#4ade80" }}>+24.4%</strong></div>
                  </div>
                </div>
              </motion.div>

              {/* Second user msg */}
              <motion.div {...fade(1.5)} style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ maxWidth: "65%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px 16px 4px 16px", padding: "9px 13px", fontSize: 11.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                  Are there any risks mentioned?
                </div>
              </motion.div>
            </div>

            {/* Input */}
            <div style={{ padding: "11px 16px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 11, padding: "9px 14px", fontSize: 11.5, color: "rgba(255,255,255,0.25)" }}>
                Ask anything about this document…
              </div>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: BRAND.grad, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(99,102,241,0.5)" }}>
                <ArrowRight size={14} color="#fff" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Floating cards ── */}
      <motion.div {...fade(0.9)}
        style={{ position: "absolute", top: -18, right: -24, background: "#fff", borderRadius: 14, padding: "10px 16px", boxShadow: "0 12px 40px rgba(99,102,241,0.18), 0 2px 8px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 10, zIndex: 10, border: `1px solid ${BRAND.border}` }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Check size={15} color="#16A34A" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.text }}>PDF Processed</div>
          <div style={{ fontSize: 10.5, color: BRAND.muted }}>Ready to chat</div>
        </div>
      </motion.div>

      <motion.div {...fade(1.1)}
        style={{ position: "absolute", bottom: -20, left: -28, background: "#fff", borderRadius: 14, padding: "12px 16px", boxShadow: "0 12px 40px rgba(99,102,241,0.15), 0 2px 8px rgba(0,0,0,0.07)", zIndex: 10, border: `1px solid ${BRAND.border}`, minWidth: 160 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E" }} />
          <span style={{ fontSize: 11.5, fontWeight: 700, color: BRAND.text }}>AI Response</span>
          <span style={{ fontSize: 10.5, color: BRAND.muted, marginLeft: "auto" }}>1.2s</span>
        </div>
        <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 22 }}>
          {[10,16,8,20,14,18,10,16,12,20].map((h, i) => (
            <div key={i} style={{ width: 5, borderRadius: 3, background: BRAND.grad, height: h, opacity: 0.6 + i * 0.04 }} />
          ))}
        </div>
      </motion.div>

      <motion.div {...fade(1.3)}
        style={{ position: "absolute", top: 80, right: -32, background: "#fff", borderRadius: 14, padding: "10px 14px", boxShadow: "0 8px 32px rgba(99,102,241,0.12)", border: `1px solid ${BRAND.border}`, zIndex: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: BRAND.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Questions Asked</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: BRAND.text, letterSpacing: "-0.04em" }}>1.2K</div>
        <div style={{ fontSize: 10, color: "#16A34A", fontWeight: 600 }}>↑ 18% today</div>
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════════ FEATURE CARD */
function FeatureCard({ f, i }: { f: typeof FEATURES[0]; i: number }) {
  const [hov, setHov] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  const Icon = f.icon
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: i * 0.06, duration: 0.5, ease: [0.22,1,0.36,1] }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? f.bg : "#fff",
        border: `1.5px solid ${hov ? f.color + "40" : BRAND.border}`,
        borderRadius: 20, padding: "28px 26px",
        boxShadow: hov ? `0 20px 56px ${f.color}14` : "0 2px 16px rgba(0,0,0,0.04)",
        transition: "all 0.22s ease", cursor: "default",
      }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
        <motion.div animate={{ scale: hov ? 1.08 : 1 }} transition={{ duration: 0.2 }}
          style={{ width: 50, height: 50, borderRadius: 14, background: f.bg, border: `1.5px solid ${f.color}30`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: hov ? `0 6px 20px ${f.color}25` : "none", transition: "box-shadow 0.2s" }}>
          <Icon size={22} color={f.color} />
        </motion.div>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: f.color, background: f.bg, border: `1px solid ${f.color}30`, padding: "3px 10px", borderRadius: 99, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {f.badge}
        </span>
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: BRAND.text, marginBottom: 9, letterSpacing: "-0.02em" }}>{f.label}</h3>
      <p style={{ fontSize: 14, color: BRAND.body, lineHeight: 1.72, margin: 0 }}>{f.desc}</p>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════ STEP CARD */
function StepCard({ s, i }: { s: typeof STEPS[0]; i: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  const Icon = s.icon
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: i * 0.14, duration: 0.55, ease: [0.22,1,0.36,1] }}
      style={{ textAlign: "center", padding: "0 12px" }}>
      <div style={{ position: "relative", display: "inline-block", marginBottom: 20 }}>
        <div style={{ width: 76, height: 76, borderRadius: 22, background: "#fff", border: `2px solid ${BRAND.border}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 28px ${s.color}14`, margin: "0 auto" }}>
          <Icon size={30} color={s.color} />
        </div>
        <div style={{ position: "absolute", top: -10, right: -10, width: 26, height: 26, borderRadius: "50%", background: `linear-gradient(135deg,${s.color},${BRAND.blue})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", boxShadow: `0 4px 12px ${s.color}50` }}>
          {i+1}
        </div>
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: BRAND.text, marginBottom: 10, letterSpacing: "-0.02em" }}>{s.title}</h3>
      <p style={{ fontSize: 14.5, color: BRAND.body, lineHeight: 1.72 }}>{s.desc}</p>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════ TESTIMONIAL CARD */
function TestiCard({ t, i }: { t: typeof TESTIMONIALS[0]; i: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: i * 0.1, duration: 0.55, ease: [0.22,1,0.36,1] }}
      whileHover={{ y: -5, boxShadow: "0 24px 64px rgba(99,102,241,0.14)" }}
      style={{ background: "#fff", border: `1.5px solid ${BRAND.border}`, borderRadius: 24, padding: "28px 26px", transition: "box-shadow 0.22s", cursor: "default" }}>
      <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
        {Array.from({length: t.stars}).map((_,k) => <Star key={k} size={14} fill="#F59E0B" color="#F59E0B" />)}
      </div>
      <p style={{ fontSize: 15, color: BRAND.body, lineHeight: 1.78, marginBottom: 22, fontStyle: "italic" }}>"{t.quote}"</p>
      <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg,${t.color},${t.color}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{t.av}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: BRAND.text }}>{t.name}</div>
          <div style={{ fontSize: 12.5, color: BRAND.muted }}>{t.role} · {t.company}</div>
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════ PRICING CARD */
function PlanCard({ p, billing, i }: { p: typeof PLANS[0]; billing: "mo"|"yr"; i: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  const router = useRouter()
  const price = billing === "mo" ? p.mo : p.yr
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: i * 0.08, duration: 0.55, ease: [0.22,1,0.36,1] }}
      style={{
        background: p.highlight ? BRAND.grad : "#fff",
        border: p.highlight ? "none" : `1.5px solid ${BRAND.border}`,
        borderRadius: 24, padding: "32px 28px",
        boxShadow: p.highlight ? "0 28px 72px rgba(99,102,241,0.38)" : "0 4px 24px rgba(0,0,0,0.05)",
        position: "relative", overflow: "hidden",
        transform: p.highlight ? "scale(1.04)" : "scale(1)",
      }}>
      {p.badge && (
        <div style={{ position: "absolute", top: 22, right: 22, background: "rgba(255,255,255,0.22)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 99, padding: "3px 12px", fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.04em" }}>
          {p.badge}
        </div>
      )}
      <div style={{ marginBottom: 26 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: p.highlight ? "rgba(255,255,255,0.75)" : BRAND.primary, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 6 }}>{p.name}</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, marginBottom: 6 }}>
          <span style={{ fontSize: 14, color: p.highlight ? "rgba(255,255,255,0.65)" : BRAND.muted, paddingBottom: 10 }}>₹</span>
          <span style={{ fontSize: 52, fontWeight: 900, color: p.highlight ? "#fff" : BRAND.text, lineHeight: 1, letterSpacing: "-0.04em" }}>{price}</span>
          {price > 0 && <span style={{ fontSize: 14, color: p.highlight ? "rgba(255,255,255,0.55)" : BRAND.muted, paddingBottom: 10 }}>/mo</span>}
        </div>
        {billing === "yr" && price > 0 && (
          <div style={{ fontSize: 12.5, color: p.highlight ? "rgba(255,255,255,0.7)" : "#16A34A", fontWeight: 600 }}>
            Save ₹{(p.mo - price) * 12} per year
          </div>
        )}
        <p style={{ fontSize: 13.5, color: p.highlight ? "rgba(255,255,255,0.68)" : BRAND.muted, marginTop: 10, lineHeight: 1.5 }}>{p.desc}</p>
      </div>

      <button onClick={() => router.push("/login")}
        style={{ width: "100%", padding: 14, borderRadius: 13, fontSize: 14, fontWeight: 700, cursor: "pointer", border: "none", marginBottom: 26,
          background: p.highlight ? "rgba(255,255,255,0.95)" : BRAND.grad,
          color: p.highlight ? BRAND.primary : "#fff",
          boxShadow: p.highlight ? "0 4px 18px rgba(0,0,0,0.14)" : "0 4px 18px rgba(99,102,241,0.32)",
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "none"; }}>
        {p.cta}
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {p.features.map(f => (
          <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 19, height: 19, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              background: p.highlight ? "rgba(255,255,255,0.22)" : "#EEF2FF",
              border: p.highlight ? "1px solid rgba(255,255,255,0.3)" : "none" }}>
              <Check size={10} color={p.highlight ? "#fff" : BRAND.primary} strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 13.5, color: p.highlight ? "rgba(255,255,255,0.9)" : BRAND.body, lineHeight: 1.45 }}>{f}</span>
          </div>
        ))}
        {p.missing.map(f => (
          <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start", opacity: 0.38 }}>
            <div style={{ width: 19, height: 19, borderRadius: "50%", flexShrink: 0, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={10} color={BRAND.muted} strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 13.5, color: BRAND.muted, lineHeight: 1.45 }}>{f}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════ FAQ ITEM */
function FAQItem({ q, a, i }: { q: string; a: string; i: number }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: i * 0.05, duration: 0.4 }}
      style={{ border: `1.5px solid ${open ? "#A5B4FC" : BRAND.border}`, borderRadius: 16, overflow: "hidden", transition: "border-color 0.2s, box-shadow 0.2s", boxShadow: open ? "0 0 0 4px rgba(99,102,241,0.06)" : "none" }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "20px 24px", background: open ? "#FAFAFE" : "#fff", border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.2s" }}>
        <span style={{ fontSize: 15.5, fontWeight: 600, color: BRAND.text, lineHeight: 1.5 }}>{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ flexShrink: 0 }}>
          <ChevronDown size={18} color={BRAND.primary} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="a"
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4,0,0.2,1] }} style={{ overflow: "hidden" }}>
            <p style={{ padding: "0 24px 22px", fontSize: 14.5, color: BRAND.body, lineHeight: 1.78, margin: 0, borderTop: `1px solid ${BRAND.border}`, paddingTop: 16 }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════ MAIN PAGE */
export default function Page() {
  const [billing, setBilling] = useState<"mo"|"yr">("mo")
  const router = useRouter()

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }, [])

  return (
    <div style={{ background: "#fff", minHeight: "100vh", fontFamily: "var(--font-inter, Inter, -apple-system, sans-serif)", color: BRAND.text, overflowX: "hidden" }}>

      <Navbar onNav={scrollTo} />

      {/* ════════════════════════════════ HERO */}
      <section style={{ paddingTop: 100, paddingBottom: 96, position: "relative", overflow: "hidden", background: "linear-gradient(180deg, #F8F7FF 0%, #FFFFFF 100%)" }}>
        {/* Ambient orbs */}
        <div style={{ position: "absolute", top: -120, left: "-8%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 65%)", pointerEvents: "none", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", top: 100, right: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 65%)", pointerEvents: "none", filter: "blur(40px)" }} />
        {/* Dot grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(99,102,241,0.08) 1px, transparent 1px)", backgroundSize: "36px 36px", pointerEvents: "none", opacity: 0.6 }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center", position: "relative", zIndex: 1 }} className="hero-grid">

          {/* Left column */}
          <div>
            {/* Badge */}
            <motion.div {...fade(0, 12)}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 99, padding: "7px 16px", marginBottom: 28 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: BRAND.primary }} />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: BRAND.primary, letterSpacing: "0.05em" }}>AI-POWERED PDF ASSISTANT</span>
            </motion.div>

            {/* Headline */}
            <motion.h1 {...fade(0.08)} style={{ fontSize: "clamp(2.6rem, 5.5vw, 4rem)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.04em", color: BRAND.text, marginBottom: 24 }}>
              Stop Reading
              <br />
              <Grad>PDFs. Just Ask.</Grad>
            </motion.h1>

            {/* Sub */}
            <motion.p {...fade(0.16)} style={{ fontSize: "1.12rem", color: BRAND.body, lineHeight: 1.76, marginBottom: 36, maxWidth: 480 }}>
              Upload any PDF and get instant AI-powered answers, summaries and insights in seconds. No reading required. Used by 1,200+ professionals.
            </motion.p>

            {/* Feature chips */}
            <motion.div {...fade(0.22)} style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: 36 }}>
              {[
                { icon: Zap, t: "< 2s answers",  c: BRAND.primary },
                { icon: Lock, t: "End-to-end encrypted", c: "#059669" },
                { icon: Globe, t: "Any PDF type", c: BRAND.blue },
              ].map(({ icon: Ic, t, c }) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 15px", background: "#F8FAFC", border: `1.5px solid ${BRAND.border}`, borderRadius: 99, fontSize: 13, fontWeight: 600, color: BRAND.body }}>
                  <Ic size={13} color={c} /> {t}
                </div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div {...fade(0.28)} style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 36 }}>
              <button onClick={() => router.push("/login")}
                style={{ display: "flex", alignItems: "center", gap: 9, padding: "15px 30px", background: BRAND.grad, borderRadius: 14, fontSize: 15, fontWeight: 700, color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 8px 28px rgba(99,102,241,0.4)", transition: "transform 0.15s, box-shadow 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 14px 40px rgba(99,102,241,0.55)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "none"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 28px rgba(99,102,241,0.4)"; }}>
                Start Free — No Card <ArrowRight size={16} />
              </button>
              <button onClick={() => scrollTo("features")}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "15px 22px", background: "transparent", border: `1.5px solid ${BRAND.border}`, borderRadius: 14, fontSize: 15, fontWeight: 600, color: BRAND.body, cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = BRAND.primary; (e.currentTarget as HTMLButtonElement).style.color = BRAND.primary; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = BRAND.border; (e.currentTarget as HTMLButtonElement).style.color = BRAND.body; }}>
                <Play size={14} fill="currentColor" /> See how it works
              </button>
            </motion.div>

            {/* Social proof */}
            <motion.div {...fade(0.34)} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ display: "flex" }}>
                {["PS","RV","AI","MK","SP"].map((av, i) => (
                  <div key={av} style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${[BRAND.primary,BRAND.violet,BRAND.blue,"#059669","#D97706"][i]},${[BRAND.violet,BRAND.blue,"#6366F1","#34D399","#F59E0B"][i]})`, border: "2.5px solid #fff", marginLeft: i > 0 ? -10 : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff" }}>
                    {av}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>
                  {Array.from({length:5}).map((_,k) => <Star key={k} size={12} fill="#F59E0B" color="#F59E0B" />)}
                </div>
                <div style={{ fontSize: 12.5, color: BRAND.muted }}>
                  Trusted by <strong style={{ color: BRAND.text }}>1,200+</strong> professionals
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right column — mockup */}
          <div style={{ position: "relative" }} className="hero-mockup">
            <ProductMockup />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════ STATS BAR */}
      <section style={{ borderTop: `1px solid ${BRAND.border}`, borderBottom: `1px solid ${BRAND.border}`, background: "#FAFAFE" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 28px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24, textAlign: "center" }} className="stats-grid">
          {[
            { v: "1,200+", l: "Active Users",          c: BRAND.primary },
            { v: "50K+",   l: "PDFs Analyzed",          c: BRAND.violet },
            { v: "500K+",  l: "Questions Answered",     c: BRAND.blue },
            { v: "< 2s",   l: "Average Response",       c: "#059669" },
          ].map((s,i) => (
            <motion.div key={s.l} {...fadeVP(i * 0.07)}>
              <div style={{ fontSize: "2.1rem", fontWeight: 900, color: BRAND.text, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 5 }}>{s.v}</div>
              <div style={{ fontSize: 13.5, color: BRAND.muted, fontWeight: 500 }}>{s.l}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════ FEATURES */}
      <section id="features" style={{ padding: "104px 28px", background: BRAND.surface }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <motion.div {...fadeVP(0)} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 99, padding: "6px 16px", marginBottom: 18 }}>
              <Sparkles size={13} color={BRAND.primary} />
              <span style={{ fontSize: 12, fontWeight: 700, color: BRAND.primary, letterSpacing: "0.06em", textTransform: "uppercase" }}>Everything you need</span>
            </motion.div>
            <motion.h2 {...fadeVP(0.06)} style={{ fontSize: "clamp(1.9rem,4vw,2.75rem)", fontWeight: 900, color: BRAND.text, letterSpacing: "-0.03em", marginBottom: 14, lineHeight: 1.14 }}>
              Powerful AI for <Grad>every document</Grad>
            </motion.h2>
            <motion.p {...fadeVP(0.12)} style={{ fontSize: 17, color: BRAND.body, maxWidth: 520, margin: "0 auto", lineHeight: 1.72 }}>
              From quick answers to deep analysis — Intellixy gives you everything to understand any PDF instantly.
            </motion.p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }} className="features-grid">
            {FEATURES.map((f,i) => <FeatureCard key={f.label} f={f} i={i} />)}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════ HOW IT WORKS */}
      <section id="how" style={{ padding: "104px 28px", background: "#fff" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 72 }}>
            <motion.h2 {...fadeVP(0)} style={{ fontSize: "clamp(1.9rem,4vw,2.75rem)", fontWeight: 900, color: BRAND.text, letterSpacing: "-0.03em", marginBottom: 14, lineHeight: 1.14 }}>
              Up and running in <Grad>30 seconds</Grad>
            </motion.h2>
            <motion.p {...fadeVP(0.06)} style={{ fontSize: 17, color: BRAND.body, maxWidth: 440, margin: "0 auto" }}>
              No setup. No learning curve. Just upload and start asking.
            </motion.p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 40, position: "relative" }} className="how-grid">
            <div className="how-connector" style={{ position: "absolute", top: 38, left: "18%", right: "18%", height: 2, background: `linear-gradient(90deg,${BRAND.primary},${BRAND.blue})`, opacity: 0.18, borderRadius: 99 }} />
            {STEPS.map((s,i) => <StepCard key={s.n} s={s} i={i} />)}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════ TESTIMONIALS */}
      <section id="testimonials" style={{ padding: "104px 28px", background: BRAND.surface }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <motion.h2 {...fadeVP(0)} style={{ fontSize: "clamp(1.9rem,4vw,2.75rem)", fontWeight: 900, color: BRAND.text, letterSpacing: "-0.03em", marginBottom: 12, lineHeight: 1.14 }}>
              Loved by <Grad>professionals</Grad>
            </motion.h2>
            <motion.p {...fadeVP(0.06)} style={{ fontSize: 17, color: BRAND.body }}>
              Join 1,200+ people who save hours every week.
            </motion.p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }} className="testi-grid">
            {TESTIMONIALS.map((t,i) => <TestiCard key={t.name} t={t} i={i} />)}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════ PRICING */}
      <section id="pricing" style={{ padding: "104px 28px", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <motion.h2 {...fadeVP(0)} style={{ fontSize: "clamp(1.9rem,4vw,2.75rem)", fontWeight: 900, color: BRAND.text, letterSpacing: "-0.03em", marginBottom: 12, lineHeight: 1.14 }}>
              Simple, honest <Grad>pricing</Grad>
            </motion.h2>
            <motion.p {...fadeVP(0.06)} style={{ fontSize: 17, color: BRAND.body, marginBottom: 28 }}>
              Start free. Upgrade when you need more.
            </motion.p>
            {/* Toggle */}
            <motion.div {...fadeVP(0.1)} style={{ display: "inline-flex", background: BRAND.surface, border: `1.5px solid ${BRAND.border}`, borderRadius: 13, padding: 4 }}>
              {(["mo","yr"] as const).map(b => (
                <button key={b} onClick={() => setBilling(b)}
                  style={{ padding: "8px 20px", borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: "pointer", border: "none", transition: "all 0.18s",
                    background: billing === b ? BRAND.grad : "transparent",
                    color: billing === b ? "#fff" : BRAND.muted,
                    boxShadow: billing === b ? "0 2px 10px rgba(99,102,241,0.35)" : "none" }}>
                  {b === "mo" ? "Monthly" : <>Yearly <span style={{ marginLeft: 4, fontSize: 10.5, background: billing === "yr" ? "rgba(255,255,255,0.25)" : "#EEF2FF", color: billing === "yr" ? "#fff" : BRAND.primary, borderRadius: 99, padding: "1px 7px" }}>Save 17%</span></>}
                </button>
              ))}
            </motion.div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 26, alignItems: "start" }} className="price-grid">
            {PLANS.map((p,i) => <PlanCard key={p.name} p={p} billing={billing} i={i} />)}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════ FAQ */}
      <section id="faq" style={{ padding: "104px 28px", background: BRAND.surface }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <motion.h2 {...fadeVP(0)} style={{ fontSize: "clamp(1.9rem,4vw,2.75rem)", fontWeight: 900, color: BRAND.text, letterSpacing: "-0.03em", lineHeight: 1.14 }}>
              Common <Grad>questions</Grad>
            </motion.h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FAQS.map((f,i) => <FAQItem key={f.q} q={f.q} a={f.a} i={i} />)}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════ CTA BANNER */}
      <section style={{ padding: "0 28px 104px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <motion.div {...fadeVP(0)}
            style={{ background: BRAND.grad, borderRadius: 28, padding: "72px 56px", textAlign: "center", position: "relative", overflow: "hidden", boxShadow: "0 36px 96px rgba(99,102,241,0.38)" }}>
            <div style={{ position: "absolute", top: -80, right: -80, width: 360, height: 360, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
            <div style={{ position: "absolute", bottom: -60, left: -60, width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: 44, marginBottom: 16 }}>⚡</div>
              <h2 style={{ fontSize: "clamp(1.9rem,4vw,2.9rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", marginBottom: 16, lineHeight: 1.1 }}>
                Ready to chat with your PDFs?
              </h2>
              <p style={{ fontSize: 17, color: "rgba(255,255,255,0.78)", marginBottom: 40, maxWidth: 480, margin: "0 auto 40px", lineHeight: 1.65 }}>
                Join 1,200+ professionals. Upload your first PDF free — no credit card needed.
              </p>
              <button onClick={() => router.push("/login")}
                style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "17px 38px", background: "rgba(255,255,255,0.97)", borderRadius: 14, fontSize: 16, fontWeight: 800, color: BRAND.primary, border: "none", cursor: "pointer", boxShadow: "0 6px 24px rgba(0,0,0,0.14)", transition: "transform 0.15s, box-shadow 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "none"; }}>
                Start Free Today <ArrowRight size={18} />
              </button>
              <div style={{ marginTop: 22, display: "flex", justifyContent: "center", gap: 22, flexWrap: "wrap" }}>
                {["Free to start","No credit card","Cancel anytime"].map(t => (
                  <span key={t} style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 6 }}>
                    <Check size={13} strokeWidth={3} /> {t}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════ FOOTER */}
      <footer style={{ background: "#0B0B1A", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "64px 28px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 56 }} className="footer-grid">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: BRAND.grad, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Sparkles size={14} color="#fff" />
                </div>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>Intellixy</span>
              </div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.75, maxWidth: 260, marginBottom: 22 }}>
                AI-powered PDF assistant. Upload, ask, and understand any document in seconds.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                {["𝕏","in","gh"].map(ic => (
                  <div key={ic} style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.45)", transition: "all 0.15s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(99,102,241,0.2)"; (e.currentTarget as HTMLDivElement).style.color = "#a5b4fc"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLDivElement).style.color = "rgba(255,255,255,0.45)"; }}>
                    {ic}
                  </div>
                ))}
              </div>
            </div>
            {[
              { h: "Product",  ls: ["Features","Pricing","Templates","Changelog"] },
              { h: "Company",  ls: ["About","Blog","Careers","Contact"] },
              { h: "Legal",    ls: ["Privacy Policy","Terms of Service","Refund Policy"] },
            ].map(({ h, ls }) => (
              <div key={h}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 18 }}>{h}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {ls.map(l => (
                    <a key={l} href="#" style={{ fontSize: 14, color: "rgba(255,255,255,0.48)", textDecoration: "none", transition: "color 0.15s" }}
                      onMouseEnter={e => ((e.target as HTMLAnchorElement).style.color = "rgba(255,255,255,0.9)")}
                      onMouseLeave={e => ((e.target as HTMLAnchorElement).style.color = "rgba(255,255,255,0.48)")}>
                      {l}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 28, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>© 2025 Intellixy. All rights reserved.</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E" }} />
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>All systems operational</span>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse2 { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.85)} }
        @media(max-width:1024px){
          .hero-grid{grid-template-columns:1fr!important;gap:56px!important}
          .hero-mockup{display:none!important}
          .features-grid{grid-template-columns:1fr 1fr!important}
          .footer-grid{grid-template-columns:1fr 1fr!important}
        }
        @media(max-width:768px){
          .nav-desktop{display:none!important}
          .nav-mobile-btn{display:flex!important}
          .stats-grid{grid-template-columns:repeat(2,1fr)!important}
          .testi-grid{grid-template-columns:1fr!important}
          .price-grid{grid-template-columns:1fr!important;max-width:480px;margin:0 auto}
          .how-grid{grid-template-columns:1fr!important}
          .how-connector{display:none!important}
          .features-grid{grid-template-columns:1fr!important}
          .footer-grid{grid-template-columns:1fr 1fr!important}
        }
        @media(max-width:480px){
          .stats-grid{grid-template-columns:1fr 1fr!important}
          .footer-grid{grid-template-columns:1fr!important}
        }
      `}</style>
    </div>
  )
}
