"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import ProPlanCTA from "./ProPlanCTA";
import ConversionBoosts from "./ConversionBoosts";

/* ══════════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ══════════════════════════════════════════════════════════════════════════════ */
const T = {
  bg:       "#07070e",
  surface:  "rgba(255,255,255,0.04)",
  surfaceHi:"rgba(255,255,255,0.07)",
  border:   "rgba(255,255,255,0.08)",
  borderHi: "rgba(255,255,255,0.16)",
  text:     "#f2f2f7",
  muted:    "rgba(242,242,247,0.52)",
  faint:    "rgba(242,242,247,0.24)",
  purple:   "#7c3aed",
  violet:   "#8b5cf6",
  cyan:     "#06b6d4",
  green:    "#22c55e",
  amber:    "#f59e0b",
  pink:     "#ec4899",
};

/* ══════════════════════════════════════════════════════════════════════════════
   MOTION VARIANTS
   ══════════════════════════════════════════════════════════════════════════════ */
const spring = [0.22, 1, 0.36, 1];

const FADE_UP = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.7, ease: spring } },
};
const FADE_IN = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
};
const SCALE_IN = {
  hidden: { opacity: 0, scale: 0.91 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.55, ease: spring } },
};
const STAGGER = (d = 0.09) => ({
  hidden: {},
  show:   { transition: { staggerChildren: d, delayChildren: 0.06 } },
});
const VP = { once: true, margin: "-72px" };

/* ══════════════════════════════════════════════════════════════════════════════
   ATOMS
   ══════════════════════════════════════════════════════════════════════════════ */
function Check({ color = T.green, size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth="2.5" style={{ flexShrink:0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
function Xmark() {
  return (
    <svg width="13" height="13" fill="none" stroke={T.faint} viewBox="0 0 24 24" strokeWidth="2.5" style={{ flexShrink:0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
function PdfIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" style={{ flexShrink:0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"/>
    </svg>
  );
}
function ArrowRight({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
function ChevronDown({ open }) {
  return (
    <svg width="16" height="16" fill="none" stroke={T.muted} viewBox="0 0 24 24" strokeWidth="2"
      style={{ flexShrink:0, transform: open ? "rotate(180deg)" : "none", transition: "transform .25s ease" }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function Pill({ children, color = T.purple }) {
  return (
    <span style={{
      display:"inline-block", fontSize:11, fontWeight:700, letterSpacing:"0.09em",
      textTransform:"uppercase", color, background:`${color}18`,
      border:`1px solid ${color}30`, padding:"4px 14px", borderRadius:99,
    }}>
      {children}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   ANIMATED COUNTER
   ══════════════════════════════════════════════════════════════════════════════ */
function Counter({ to, suffix = "", prefix = "" }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const dur = 1800;
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(eased * to));
      if (p < 1) requestAnimationFrame(tick);
      else setVal(to);
    };
    requestAnimationFrame(tick);
  }, [inView, to]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

/* ══════════════════════════════════════════════════════════════════════════════
   NAVBAR
   ══════════════════════════════════════════════════════════════════════════════ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50"
      style={{
        borderBottom: `1px solid ${scrolled ? T.border : "transparent"}`,
        background: scrolled ? "rgba(7,7,14,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(28px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(28px)" : "none",
        transition: "all 0.3s ease",
      }}>
      <div className="flex items-center justify-between mx-auto px-5 md:px-8" style={{ maxWidth:1160, height:60 }}>

        <a href="/" className="flex items-center gap-2 no-underline">
          <div className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width:32, height:32, background:"linear-gradient(135deg,#7c3aed,#06b6d4)", boxShadow:"0 4px 14px rgba(124,58,237,0.38)" }}>
            <PdfIcon size={14} />
          </div>
          <span className="font-extrabold text-[15px] tracking-tight" style={{ color:T.text }}>Intellixy</span>
        </a>

        <div className="hidden md:flex items-center gap-1">
          {[["#features","Features"],["#how-it-works","How it works"],["#pricing","Pricing"]].map(([href,lbl]) => (
            <a key={lbl} href={href} className="text-[13px] font-medium px-3 py-2 rounded-lg transition-colors"
              style={{ color:T.muted, textDecoration:"none" }}>{lbl}</a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <a href="/login" className="hidden sm:block text-[13px] font-semibold px-3 py-2 rounded-lg" style={{ color:T.muted, textDecoration:"none" }}>Log in</a>
          <motion.a href="/login"
            whileHover={{ opacity:0.88, y:-1, boxShadow:"0 12px 36px rgba(124,58,237,0.45)" }}
            whileTap={{ scale:0.97 }}
            className="text-[13px] font-bold text-white px-4 py-[9px] rounded-full"
            style={{ background:"linear-gradient(135deg,#7c3aed,#06b6d4)", textDecoration:"none", boxShadow:"0 4px 18px rgba(124,58,237,0.32)", letterSpacing:"-0.1px" }}>
            Start Free →
          </motion.a>
        </div>
      </div>
    </nav>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   HERO
   ══════════════════════════════════════════════════════════════════════════════ */
function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center overflow-hidden text-center"
      style={{ minHeight:"100svh", paddingTop:60 }}>

      {/* ── Animated mesh gradient background ── */}
      <div className="absolute inset-0 pointer-events-none" style={{ overflow:"hidden" }}>
        <motion.div
          animate={{ scale:[1,1.1,1], opacity:[0.22,0.32,0.22] }}
          transition={{ duration:9, repeat:Infinity, ease:"easeInOut" }}
          style={{ position:"absolute", top:"-10%", left:"50%", transform:"translateX(-50%)", width:900, height:600, borderRadius:"50%", background:"radial-gradient(ellipse,rgba(124,58,237,0.28),transparent 65%)", filter:"blur(70px)" }} />
        <motion.div
          animate={{ scale:[1,1.15,1], opacity:[0.14,0.22,0.14] }}
          transition={{ duration:12, repeat:Infinity, ease:"easeInOut", delay:3 }}
          style={{ position:"absolute", top:"20%", right:"-5%", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(6,182,212,0.2),transparent 68%)", filter:"blur(80px)" }} />
        <motion.div
          animate={{ scale:[1,1.08,1], opacity:[0.1,0.18,0.1] }}
          transition={{ duration:8, repeat:Infinity, ease:"easeInOut", delay:5 }}
          style={{ position:"absolute", bottom:"-10%", left:"10%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(139,92,246,0.18),transparent 70%)", filter:"blur(80px)" }} />
        {/* Grid overlay */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.024) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.024) 1px,transparent 1px)", backgroundSize:"72px 72px", maskImage:"radial-gradient(ellipse 80% 60% at 50% 0%,black,transparent)" }} />
      </div>

      <div className="relative w-full max-w-[900px] mx-auto px-5 sm:px-8 pt-20 pb-10">

        {/* Badge */}
        <motion.div variants={FADE_UP} initial="hidden" animate="show"
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-7 text-[11px] font-bold uppercase tracking-[0.08em]"
          style={{ background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.28)", color:"#c4b5fd" }}>
          <motion.span animate={{ opacity:[1,0.25,1] }} transition={{ duration:1.8, repeat:Infinity }}
            className="inline-block rounded-full flex-shrink-0"
            style={{ width:7, height:7, background:"#a78bfa" }} />
          7-Day Free Pro Trial — No Credit Card
        </motion.div>

        {/* Headline */}
        <motion.h1 variants={FADE_UP} initial="hidden" animate="show" transition={{ delay:0.1 }}
          className="font-black tracking-tight mb-5 text-[clamp(40px,8vw,90px)] leading-[1.02]">
          Chat with any
          <br />
          <span style={{
            background:"linear-gradient(135deg,#e0c3fc 0%,#7c3aed 40%,#06b6d4 80%,#a5f3fc 100%)",
            backgroundSize:"200% 200%",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
            animation:"gradMove 5s ease infinite",
          }}>
            PDF instantly
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p variants={FADE_UP} initial="hidden" animate="show" transition={{ delay:0.2 }}
          className="mx-auto mb-8 text-[clamp(15px,2.5vw,20px)] leading-[1.72] font-normal"
          style={{ color:T.muted, maxWidth:520 }}>
          Upload your document and get answers, summaries, and insights
          in seconds using AI — from contracts to research papers.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={FADE_UP} initial="hidden" animate="show" transition={{ delay:0.3 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <motion.a href="/login"
            whileHover={{ opacity:0.9, y:-2, boxShadow:"0 24px 64px rgba(124,58,237,0.58)" }}
            whileTap={{ scale:0.97 }}
            className="inline-flex items-center gap-2 font-extrabold text-white text-[15px] tracking-tight rounded-full"
            style={{ background:"linear-gradient(135deg,#7c3aed,#06b6d4)", padding:"15px 34px", textDecoration:"none", boxShadow:"0 8px 36px rgba(124,58,237,0.45)", letterSpacing:"-0.2px" }}>
            Start Free Trial <ArrowRight size={16} />
          </motion.a>
          <motion.a href="#demo"
            whileHover={{ background:"rgba(255,255,255,0.09)", borderColor:T.borderHi, y:-2 }}
            whileTap={{ scale:0.97 }}
            className="inline-flex items-center gap-2 font-bold text-[15px] rounded-full"
            style={{ background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}`, padding:"15px 28px", color:T.text, textDecoration:"none", letterSpacing:"-0.1px" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            Watch Demo
          </motion.a>
        </motion.div>

        {/* Micro-trust */}
        <motion.div variants={FADE_UP} initial="hidden" animate="show" transition={{ delay:0.4 }}
          className="flex flex-wrap items-center justify-center gap-5 mb-16 text-[12px]" style={{ color:T.faint }}>
          {["No credit card required","7-day money-back guarantee","Cancel anytime"].map(t => (
            <span key={t} className="flex items-center gap-1.5"><Check size={12} /> {t}</span>
          ))}
        </motion.div>

        {/* ── Product mockup ── */}
        <motion.div variants={SCALE_IN} initial="hidden" animate="show" transition={{ delay:0.55 }}
          className="rounded-2xl overflow-hidden mx-auto"
          style={{ maxWidth:800, background:"rgba(255,255,255,0.03)", border:`1px solid ${T.border}`, boxShadow:"0 60px 140px rgba(0,0,0,0.75), 0 0 0 1px rgba(124,58,237,0.1)", backdropFilter:"blur(2px)" }}>

          {/* Title bar */}
          <div className="flex items-center gap-2.5 px-4 py-3" style={{ background:"rgba(0,0,0,0.35)", borderBottom:`1px solid ${T.border}` }}>
            <div className="flex gap-[6px]">
              {["#ef4444aa","#eab308aa","#22c55eaa"].map((c,i) => (
                <div key={i} className="rounded-full" style={{ width:11, height:11, background:c }} />
              ))}
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-2 px-3 py-1 rounded-md text-[11px]" style={{ background:"rgba(255,255,255,0.06)", color:T.faint }}>
                <div className="rounded-full" style={{ width:6, height:6, background:"#22c55e" }} />
                intellixy.vercel.app — dashboard
              </div>
            </div>
          </div>

          {/* App shell */}
          <div className="flex" style={{ height:290 }}>
            {/* Sidebar */}
            <div className="flex-shrink-0 flex flex-col" style={{ width:180, background:"rgba(0,0,0,0.28)", borderRight:`1px solid ${T.border}`, padding:"14px 12px" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color:T.faint }}>My PDFs</p>
              {[
                { name:"Q4 Report.pdf",  active:true,  color:"#c4b5fd" },
                { name:"Contract.pdf",   active:false },
                { name:"Research.pdf",   active:false },
                { name:"Invoice.pdf",    active:false },
              ].map(({ name, active, color }) => (
                <div key={name} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg mb-1 text-[11px] truncate"
                  style={{ background:active ? "rgba(124,58,237,0.18)":"transparent", border:active ? "1px solid rgba(124,58,237,0.3)":"1px solid transparent", color:active ? (color || T.text) : T.faint }}>
                  <PdfIcon size={10} /> {name}
                </div>
              ))}
              <div className="mt-auto px-2 py-2 rounded-lg text-[11px] text-center cursor-pointer"
                style={{ background:"rgba(124,58,237,0.08)", border:"1px dashed rgba(124,58,237,0.25)", color:"rgba(167,139,250,0.7)" }}>
                + Upload PDF
              </div>
            </div>

            {/* Chat */}
            <div className="flex-1 flex flex-col justify-end gap-3 p-4" style={{ background:"rgba(7,7,14,0.55)" }}>
              <div className="flex justify-end">
                <div className="text-white text-[12px] px-3 py-2.5" style={{ background:"linear-gradient(135deg,#7c3aed,#06b6d4)", borderRadius:"16px 16px 3px 16px", maxWidth:"72%", lineHeight:1.55 }}>
                  What are the key financial highlights from Q4?
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="flex items-center justify-center rounded-[10px] flex-shrink-0"
                  style={{ width:26, height:26, background:"linear-gradient(135deg,#7c3aed,#06b6d4)", boxShadow:"0 4px 12px rgba(124,58,237,0.3)" }}>
                  <svg width="12" height="12" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                  </svg>
                </div>
                <div className="text-[12px] px-3 py-2.5" style={{ background:"rgba(255,255,255,0.07)", border:`1px solid ${T.border}`, borderRadius:"3px 16px 16px 16px", maxWidth:"76%", lineHeight:1.7, color:"rgba(255,255,255,0.88)" }}>
                  Q4 revenue was{" "}
                  <strong style={{ color:"#a78bfa" }}>₹4.2M</strong> (↑18% YoY). EBITDA margin improved to{" "}
                  <strong style={{ color:"#4ade80" }}>34%</strong>. Cash reserves at{" "}
                  <strong style={{ color:"#06b6d4" }}>₹12.8M</strong>.
                  <motion.span animate={{ opacity:[1,0,1] }} transition={{ duration:0.9, repeat:Infinity }}
                    className="inline-block ml-0.5 align-middle rounded-[2px]"
                    style={{ width:5, height:13, background:"#a78bfa" }} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   STATS BAR
   ══════════════════════════════════════════════════════════════════════════════ */
function StatsBar() {
  const stats = [
    { to:1000, suffix:"+", label:"Happy users",         color:"#a78bfa" },
    { to:5000, suffix:"+", label:"PDFs analyzed",       color:"#06b6d4" },
    { to:50000,suffix:"+", label:"Questions answered",  color:"#4ade80" },
    { to:2,    prefix:"<", suffix:"s", label:"Avg response time", color:T.amber },
  ];
  return (
    <motion.section initial="hidden" whileInView="show" viewport={VP} variants={STAGGER(0.12)}
      className="px-5 py-10"
      style={{ borderTop:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}`, background:"rgba(255,255,255,0.018)" }}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center max-w-3xl mx-auto">
        {stats.map(s => (
          <motion.div key={s.label} variants={FADE_UP}>
            <div className="font-black mb-1 tabular-nums"
              style={{ fontSize:"clamp(26px,4vw,40px)", letterSpacing:"-1px", color:s.color }}>
              <Counter to={s.to} suffix={s.suffix} prefix={s.prefix} />
            </div>
            <div className="text-[12px] font-medium" style={{ color:T.faint }}>{s.label}</div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   FEATURES — bento grid
   ══════════════════════════════════════════════════════════════════════════════ */
function Features() {
  /* Card base style */
  const card = (extra = {}) => ({
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: 22,
    padding: 28,
    overflow: "hidden",
    transition: "border-color 0.25s, background 0.25s",
    ...extra,
  });

  return (
    <section id="features" className="px-5 sm:px-8 py-24 sm:py-32">
      <div className="max-w-[1100px] mx-auto">

        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={FADE_UP}
          className="text-center mb-16">
          <Pill color={T.cyan}>Features</Pill>
          <h2 className="font-black tracking-tight mt-4 mb-4 text-[clamp(28px,5vw,54px)] leading-[1.08]">
            Everything you need to stop<br className="hidden sm:block" /> drowning in documents
          </h2>
          <p className="text-[17px] leading-[1.7] mx-auto" style={{ color:T.muted, maxWidth:460 }}>
            Works on any PDF — legal, financial, academic, or medical.
          </p>
        </motion.div>

        {/* ── Bento grid ── */}
        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={STAGGER(0.08)}
          className="grid gap-4"
          style={{ gridTemplateColumns:"repeat(3,1fr)", gridTemplateRows:"auto" }}>

          {/* Row 1 — card A (span 2) + card B */}
          <motion.div variants={FADE_UP} whileHover={{ borderColor:T.borderHi, background:T.surfaceHi }}
            style={{ ...card(), gridColumn:"span 2", background:"linear-gradient(135deg,rgba(124,58,237,0.1),rgba(6,182,212,0.04))", borderColor:"rgba(124,58,237,0.2)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">💬</div>
              <div>
                <h3 className="font-extrabold text-[18px] tracking-tight mb-1" style={{ color:"#c4b5fd" }}>Ask Anything</h3>
                <p className="text-[13px] leading-[1.65]" style={{ color:T.muted }}>Type any question in plain English. Answers in under 2 seconds, cited from the source.</p>
              </div>
            </div>
            {/* Mini chat demo */}
            <div className="rounded-2xl p-4" style={{ background:"rgba(0,0,0,0.35)", border:`1px solid rgba(124,58,237,0.18)` }}>
              <div className="flex justify-end mb-2.5">
                <span className="text-[12px] px-3 py-2 rounded-[14px_14px_3px_14px] text-white" style={{ background:"linear-gradient(135deg,#7c3aed,#5b21b6)", maxWidth:"80%" }}>
                  What is the cancellation clause in this contract?
                </span>
              </div>
              <div className="flex gap-2">
                <div className="flex-shrink-0 rounded-lg flex items-center justify-center" style={{ width:22, height:22, background:"linear-gradient(135deg,#7c3aed,#06b6d4)" }}>
                  <svg width="10" height="10" fill="white" viewBox="0 0 24 24"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
                </div>
                <div className="text-[12px] px-3 py-2 rounded-[3px_14px_14px_14px]" style={{ background:"rgba(255,255,255,0.07)", border:`1px solid ${T.border}`, color:"rgba(255,255,255,0.85)", lineHeight:1.6 }}>
                  Either party may cancel with <strong style={{ color:"#4ade80" }}>30 days written notice</strong>. Auto-renewal applies unless cancelled <strong style={{ color:"#4ade80" }}>15 days before</strong> the renewal date. (§12.3)
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={FADE_UP} whileHover={{ borderColor:T.borderHi, background:T.surfaceHi }}
            style={{ ...card(), background:"linear-gradient(135deg,rgba(6,182,212,0.08),transparent)", borderColor:"rgba(6,182,212,0.18)" }}>
            <div className="text-3xl mb-4">✨</div>
            <h3 className="font-extrabold text-[17px] tracking-tight mb-2" style={{ color:"#67e8f9" }}>Instant Summaries</h3>
            <p className="text-[13px] leading-[1.68]" style={{ color:T.muted }}>
              One-click summary of any document. Get the key points without reading a single page.
            </p>
            <div className="flex flex-col gap-2 mt-5">
              {["Executive summary","Key clauses identified (7)","Risk flags (2)"].map((item, i) => (
                <div key={item} className="flex items-center gap-2 text-[12px]" style={{ color:"rgba(255,255,255,0.6)" }}>
                  <Check size={12} color="#06b6d4" /> {item}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Row 2 — card C, D, E */}
          <motion.div variants={FADE_UP} whileHover={{ borderColor:T.borderHi, background:T.surfaceHi }}
            style={card()}>
            <div className="text-3xl mb-4">🔍</div>
            <h3 className="font-extrabold text-[17px] tracking-tight mb-2" style={{ color:"#86efac" }}>Smart Extraction</h3>
            <p className="text-[13px] leading-[1.68]" style={{ color:T.muted }}>
              Auto-extract invoices, dates, names, totals, and terms from any format.
            </p>
          </motion.div>

          <motion.div variants={FADE_UP} whileHover={{ borderColor:T.borderHi, background:T.surfaceHi }}
            style={card()}>
            <div className="text-3xl mb-4">📊</div>
            <h3 className="font-extrabold text-[17px] tracking-tight mb-2" style={{ color:"#fcd34d" }}>PDF Compare</h3>
            <p className="text-[13px] leading-[1.68]" style={{ color:T.muted }}>
              Upload two documents and ask what changed. Perfect for contract revisions.
            </p>
          </motion.div>

          <motion.div variants={FADE_UP} whileHover={{ borderColor:T.borderHi, background:T.surfaceHi }}
            style={card()}>
            <div className="text-3xl mb-4">🔗</div>
            <h3 className="font-extrabold text-[17px] tracking-tight mb-2" style={{ color:"#f9a8d4" }}>Share Insights</h3>
            <p className="text-[13px] leading-[1.68]" style={{ color:T.muted }}>
              Generate a shareable link to your chat. Send findings to your team in one click.
            </p>
          </motion.div>

          {/* Row 3 — full-width privacy card */}
          <motion.div variants={FADE_UP} whileHover={{ borderColor:"rgba(124,58,237,0.3)", background:"rgba(124,58,237,0.05)" }}
            style={{ ...card({ padding:"24px 28px" }), gridColumn:"1 / -1", display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:16 }}>
            <div className="flex items-center gap-4">
              <div className="text-3xl">🛡️</div>
              <div>
                <h3 className="font-extrabold text-[17px] tracking-tight mb-1">Private &amp; Secure by Default</h3>
                <p className="text-[13px]" style={{ color:T.muted }}>Files are processed in isolation and never stored. Zero data sharing. Zero training on your content.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {["256-bit encryption","No data retention","GDPR-aligned","Zero third-party sharing"].map(b => (
                <span key={b} className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full"
                  style={{ background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.22)", color:"#c4b5fd" }}>
                  <Check size={11} color="#a78bfa" /> {b}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   HOW IT WORKS
   ══════════════════════════════════════════════════════════════════════════════ */
function HowItWorks() {
  const steps = [
    { n:"01", icon:"📤", color:"#a78bfa", title:"Upload your PDF",      desc:"Drop any PDF — contracts, invoices, research papers, reports. Any size, any topic." },
    { n:"02", icon:"💬", color:"#67e8f9", title:"Ask in plain English",  desc:"Type any question naturally. No commands. No syntax. Just ask like you'd ask a colleague." },
    { n:"03", icon:"⚡", color:"#86efac", title:"Get instant answers",   desc:"Precise, sourced answers in under 2 seconds — pulled directly from your document." },
  ];
  return (
    <section id="how-it-works" className="px-5 sm:px-8 py-24 sm:py-32"
      style={{ background:"rgba(255,255,255,0.014)" }}>
      <div className="max-w-[1000px] mx-auto">
        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={FADE_UP}
          className="text-center mb-16">
          <Pill>How it works</Pill>
          <h2 className="font-black tracking-tight mt-4 mb-3 text-[clamp(26px,5vw,50px)] leading-[1.1]">
            Live in 30 seconds. No setup.
          </h2>
          <p className="text-[16px]" style={{ color:T.muted }}>No learning curve. No config. Just upload and ask.</p>
        </motion.div>

        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={STAGGER(0.14)}
          className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {steps.map((s, i) => (
            <motion.div key={s.n} variants={FADE_UP}
              whileHover={{ y:-5, borderColor:T.borderHi }}
              className="text-center p-7 sm:p-9 rounded-[22px]"
              style={{ background:T.surface, border:`1px solid ${T.border}`, transition:"all 0.25s" }}>
              <div className="relative inline-flex items-center justify-center rounded-2xl mb-5"
                style={{ width:64, height:64, background:"linear-gradient(135deg,rgba(124,58,237,0.18),rgba(6,182,212,0.1))", border:"1px solid rgba(124,58,237,0.28)" }}>
                <span style={{ fontSize:28 }}>{s.icon}</span>
                <div className="absolute flex items-center justify-center rounded-full text-white font-extrabold"
                  style={{ top:-10, right:-10, width:24, height:24, background:"linear-gradient(135deg,#7c3aed,#06b6d4)", fontSize:10, boxShadow:"0 4px 10px rgba(124,58,237,0.4)" }}>
                  {s.n}
                </div>
              </div>
              <h3 className="font-extrabold text-[16px] tracking-tight mb-2" style={{ color:s.color }}>{s.title}</h3>
              <p className="text-[13px] leading-[1.7]" style={{ color:T.muted }}>{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={FADE_UP}
          className="text-center mt-12">
          <motion.a href="/login"
            whileHover={{ opacity:0.88, y:-2 }} whileTap={{ scale:0.97 }}
            className="inline-flex items-center gap-2 font-extrabold text-white text-[14px] rounded-full"
            style={{ background:"linear-gradient(135deg,#7c3aed,#06b6d4)", padding:"13px 34px", textDecoration:"none", boxShadow:"0 6px 24px rgba(124,58,237,0.42)" }}>
            Try it free — Start in 30 seconds <ArrowRight />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   TESTIMONIALS
   ══════════════════════════════════════════════════════════════════════════════ */
function Testimonials() {
  const cards = [
    { quote:"I process 20+ invoices daily. Intellixy cuts my review time by 70%. I just ask 'what's the total amount due?' and it returns the exact figure instantly — from any vendor format.", name:"Arjun S.", role:"Finance Analyst", outcome:"Saves 3 hrs/week", avatar:"#a78bfa", featured:true },
    { quote:"Perfect for long case files. Summarizes judgments in crisp bullet points in seconds. Went from the free trial to paying in 2 days.",                                               name:"Priya M.",  role:"Law Student",     outcome:"Saves 5 hrs/week",  avatar:"#06b6d4" },
    { quote:"Found a hidden auto-renewal clause our whole team missed. Saved us from a deal we almost signed. Worth every rupee.",                                                               name:"Rahul K.",  role:"Startup Founder",  outcome:"Caught 1 bad deal", avatar:"#4ade80" },
  ];
  return (
    <section className="px-5 sm:px-8 py-24 sm:py-32">
      <div className="max-w-[1100px] mx-auto">
        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={FADE_UP}
          className="text-center mb-14">
          <Pill color={T.pink}>Testimonials</Pill>
          <h2 className="font-black tracking-tight mt-4 mb-3 text-[clamp(26px,5vw,50px)] leading-[1.1]">
            Real results. Real people.
          </h2>
          {/* Social proof strip */}
          <div className="inline-flex items-center gap-3 rounded-full px-5 py-2.5 mt-2"
            style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${T.border}` }}>
            <div className="flex">
              {["#a78bfa","#06b6d4","#f472b6","#4ade80","#fbbf24"].map((c,i) => (
                <div key={c} className="rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ width:26, height:26, background:`${c}22`, border:`2px solid ${c}88`, marginLeft:i===0?0:-8, color:c, flexShrink:0 }}>
                  {["A","P","R","S","K"][i]}
                </div>
              ))}
            </div>
            <div className="flex gap-0.5 text-[13px]">{[1,2,3,4,5].map(s=><span key={s} style={{color:T.amber}}>★</span>)}</div>
            <span className="text-[13px] font-semibold" style={{ color:T.muted }}>Loved by <strong style={{ color:T.text }}>1,000+</strong> users</span>
          </div>
        </motion.div>

        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={STAGGER(0.1)}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cards.map(t => (
            <motion.div key={t.name} variants={FADE_UP}
              whileHover={{ y:-5 }}
              className="rounded-[22px] p-7 flex flex-col gap-4"
              style={{
                background: t.featured ? "linear-gradient(135deg,rgba(124,58,237,0.1),rgba(6,182,212,0.05))" : T.surface,
                border: `1px solid ${t.featured ? "rgba(124,58,237,0.28)" : T.border}`,
                transition:"all 0.25s",
              }}>
              <div className="flex gap-0.5 text-[14px]">{[1,2,3,4,5].map(s=><span key={s} style={{color:T.amber}}>★</span>)}</div>
              <p className="text-[14px] leading-[1.78] italic flex-1" style={{ color:"rgba(255,255,255,0.8)" }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="rounded-full flex items-center justify-center font-bold text-[15px] flex-shrink-0"
                  style={{ width:40, height:40, background:`${t.avatar}22`, border:`2px solid ${t.avatar}55`, color:t.avatar }}>
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-[13px] font-bold m-0">{t.name}</p>
                  <p className="text-[11px] m-0" style={{ color:T.faint }}>{t.role} · {t.outcome}</p>
                </div>
                {t.featured && (
                  <span className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.25)", color:"#4ade80" }}>
                    ✓ Pro user
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   PRICING
   ══════════════════════════════════════════════════════════════════════════════ */
function Pricing() {
  return (
    <section id="pricing" className="px-5 sm:px-8 py-24 sm:py-32"
      style={{ background:"rgba(255,255,255,0.014)" }}>
      <div className="max-w-[1060px] mx-auto">

        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={FADE_UP}
          className="text-center mb-16">
          <Pill>Pricing</Pill>
          <h2 className="font-black tracking-tight mt-4 mb-3 text-[clamp(26px,5vw,50px)] leading-[1.1]">
            Start free. Upgrade when ready.
          </h2>
          <p className="text-[16px]" style={{ color:T.muted }}>7-day free Pro trial — no credit card needed.</p>
        </motion.div>

        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={STAGGER(0.1)}
          className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-start">

          {/* FREE */}
          <motion.div variants={FADE_UP} whileHover={{ y:-3, borderColor:T.borderHi }}
            className="rounded-[24px] p-7 flex flex-col"
            style={{ background:T.surface, border:`1px solid ${T.border}`, transition:"all 0.25s" }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color:T.faint }}>Free</p>
            <div className="flex items-end gap-2 mb-1">
              <span className="font-black tracking-tight leading-none" style={{ fontSize:46, letterSpacing:"-2px" }}>₹0</span>
              <span className="text-[13px] pb-2" style={{ color:T.faint }}>forever</span>
            </div>
            <p className="text-[12px] mb-6" style={{ color:T.faint }}>Try before you commit</p>
            <ul className="flex flex-col gap-2.5 list-none p-0 m-0 mb-5 flex-1">
              {["5 PDF uploads","10 questions","AI Q&A chat","Auto summaries","Chat history"].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-[13px]" style={{ color:"rgba(255,255,255,0.65)" }}>
                  <Check /> {f}
                </li>
              ))}
              {["Unlimited uploads","Delete PDFs","PDF Compare"].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-[13px]" style={{ color:T.faint }}>
                  <Xmark /> {f}
                </li>
              ))}
            </ul>
            <a href="/login" className="block w-full text-center font-bold text-[14px] py-3 rounded-[14px] text-white"
              style={{ background:"rgba(255,255,255,0.07)", border:`1px solid ${T.border}`, textDecoration:"none" }}>
              Get started free
            </a>
          </motion.div>

          {/* PRO — gradient border */}
          <motion.div variants={SCALE_IN} style={{ position:"relative", marginTop:-6 }}>
            <div style={{ background:"linear-gradient(135deg,#7c3aed,#06b6d4)", padding:2, borderRadius:26, boxShadow:"0 0 0 1px rgba(124,58,237,0.1), 0 32px 80px rgba(124,58,237,0.28)" }}>
              <motion.div whileHover={{ y:-2 }}
                className="rounded-[23px] p-7 flex flex-col relative"
                style={{ background:"#0f0920", transition:"all 0.25s" }}>
                {/* Badge */}
                <div className="absolute text-[11px] font-extrabold text-white px-4 py-1.5 rounded-full"
                  style={{ top:-16, left:"50%", transform:"translateX(-50%)", background:"linear-gradient(135deg,#7c3aed,#06b6d4)", whiteSpace:"nowrap", boxShadow:"0 4px 14px rgba(124,58,237,0.45)" }}>
                  🔥 Most Popular
                </div>

                <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color:"#a78bfa" }}>Pro</p>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-[14px] font-medium line-through pb-2.5" style={{ color:T.faint }}>₹999</span>
                  <span className="font-black tracking-tight leading-none" style={{ fontSize:46, letterSpacing:"-2px" }}>₹299</span>
                  <span className="text-[13px] pb-2" style={{ color:T.muted }}>/ mo</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background:"rgba(74,222,128,0.14)", border:"1px solid rgba(74,222,128,0.28)", color:"#4ade80" }}>🎉 70% off</span>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background:"rgba(6,182,212,0.1)", border:"1px solid rgba(6,182,212,0.25)", color:"#06b6d4" }}>🎁 7-day free trial</span>
                </div>

                <ul className="flex flex-col gap-2.5 list-none p-0 m-0 mb-5 flex-1">
                  {["Unlimited PDF uploads","Unlimited questions","Delete PDFs anytime","PDF Compare feature","Smart data extraction","Share chat links","Priority AI responses"].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-[13px]" style={{ color:"rgba(255,255,255,0.88)" }}>
                      <Check /> {f}
                    </li>
                  ))}
                </ul>

                {/* Money-back */}
                <div className="flex items-center gap-3 rounded-[14px] px-4 py-3 mb-5"
                  style={{ background:"rgba(74,222,128,0.07)", border:"1px solid rgba(74,222,128,0.18)" }}>
                  <span style={{ fontSize:20 }}>🛡️</span>
                  <div>
                    <p className="text-[12px] font-bold m-0" style={{ color:"#4ade80" }}>7-Day Money-Back Guarantee</p>
                    <p className="text-[11px] m-0" style={{ color:T.faint }}>Not happy? Full refund, no questions.</p>
                  </div>
                </div>

                <ProPlanCTA />
                <p className="text-[11px] text-center mt-2.5" style={{ color:T.faint }}>🔒 Secured by Razorpay · Cancel anytime</p>
              </motion.div>
            </div>
          </motion.div>

          {/* PRO+ */}
          <motion.div variants={FADE_UP} whileHover={{ y:-3, borderColor:"rgba(245,158,11,0.35)" }}
            className="rounded-[24px] p-7 flex flex-col"
            style={{ background:"linear-gradient(135deg,rgba(245,158,11,0.07),transparent)", border:"1px solid rgba(245,158,11,0.22)", transition:"all 0.25s" }}>
            <div className="inline-block text-[10px] font-extrabold text-white px-3 py-1 rounded-full mb-3"
              style={{ background:"linear-gradient(135deg,#b45309,#f59e0b)" }}>
              ⭐ Coming Soon
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color:T.amber }}>PRO+</p>
            <div className="flex items-end gap-2 mb-1">
              <span className="font-black tracking-tight leading-none" style={{ fontSize:46, letterSpacing:"-2px" }}>₹499</span>
              <span className="text-[13px] pb-2" style={{ color:T.faint }}>/ mo</span>
            </div>
            <p className="text-[12px] mb-6" style={{ color:T.faint }}>For teams &amp; power users</p>
            <ul className="flex flex-col gap-2.5 list-none p-0 m-0 mb-6 flex-1">
              {["Everything in Pro","Up to 5 team seats","Bulk PDF processing","API access","Custom AI instructions","Dedicated support"].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-[13px]" style={{ color:"rgba(255,255,255,0.65)" }}>
                  <Check color={T.amber} /> {f}
                </li>
              ))}
            </ul>
            <button disabled className="block w-full text-center font-bold text-[14px] py-3 rounded-[14px]"
              style={{ background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.25)", color:T.amber, cursor:"not-allowed", opacity:0.72 }}>
              Join Waitlist →
            </button>
            <p className="text-[11px] text-center mt-2.5" style={{ color:T.faint }}>Early access — Q3 2026</p>
          </motion.div>
        </motion.div>

        {/* Trust strip */}
        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={FADE_UP}
          className="flex flex-wrap justify-center gap-6 mt-10 pt-8 text-[12px]"
          style={{ borderTop:`1px solid ${T.border}`, color:T.faint }}>
          {["🛡️ 7-day money-back guarantee","🔒 Payments by Razorpay","⚡ Instant activation","✕ Cancel anytime, no fees"].map(t=>(
            <span key={t}>{t}</span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   DEMO VIDEO
   ══════════════════════════════════════════════════════════════════════════════ */
function Demo() {
  const DEMO_VIDEO_ID = "9_hnyQxFUjI";
  return (
    <section id="demo" className="px-5 sm:px-8 py-24 sm:py-32">
      <div className="max-w-[760px] mx-auto">
        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={FADE_UP} className="text-center mb-12">
          <Pill color={T.amber}>Live Demo</Pill>
          <h2 className="font-black tracking-tight mt-4 mb-3 text-[clamp(24px,5vw,48px)] leading-[1.1]">
            See it in 60 seconds
          </h2>
          <p className="text-[15px]" style={{ color:T.muted }}>A real PDF. A real question. An answer in under 2 seconds ⚡</p>
        </motion.div>
        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={SCALE_IN}>
          <div className="rounded-[22px] overflow-hidden" style={{ border:`1px solid ${T.border}`, boxShadow:"0 32px 90px rgba(0,0,0,0.6)" }}>
            <iframe
              width="100%" height="420"
              src={`https://www.youtube.com/embed/${DEMO_VIDEO_ID}?rel=0&modestbranding=1`}
              title="Intellixy Demo" frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen style={{ display:"block" }} />
          </div>
        </motion.div>
        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={FADE_UP}
          className="mt-8 rounded-[22px] p-8 text-center"
          style={{ background:"linear-gradient(135deg,rgba(124,58,237,0.1),rgba(6,182,212,0.04))", border:"1px solid rgba(124,58,237,0.22)" }}>
          <h3 className="font-black text-[22px] tracking-tight mb-2">Your PDFs are next.</h3>
          <p className="text-[14px] mb-5" style={{ color:T.muted }}>Same experience, on your own files, right now.</p>
          <motion.a href="/login" whileHover={{ opacity:0.9, y:-2 }} whileTap={{ scale:0.97 }}
            className="inline-flex items-center gap-2 font-extrabold text-white text-[14px] rounded-full"
            style={{ background:"linear-gradient(135deg,#7c3aed,#06b6d4)", padding:"13px 30px", textDecoration:"none", boxShadow:"0 8px 28px rgba(124,58,237,0.45)" }}>
            Start Free — 7-Day Pro Trial <ArrowRight />
          </motion.a>
          <p className="text-[12px] mt-3" style={{ color:T.faint }}>No credit card · Instant access · Cancel anytime</p>
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   FAQ
   ══════════════════════════════════════════════════════════════════════════════ */
function FAQ() {
  const [open, setOpen] = useState(null);
  const items = [
    { q:"What types of PDFs does Intellixy support?",    a:"Any PDF — contracts, invoices, research papers, medical reports, financial statements, study notes. If it has text, Intellixy can read and answer questions about it." },
    { q:"Is there really a free plan?",                  a:"Yes. The free plan gives you 5 PDF uploads and 10 questions — no credit card required. Most users hit the limit in their first session and upgrade the same day." },
    { q:"How is my data kept private?",                  a:"Files are processed in an isolated environment for your session only. We never store your files after processing, never share them, and never train AI models on your content." },
    { q:"Can I cancel my Pro subscription anytime?",    a:"Yes. Cancel with one click from your dashboard. You keep Pro access until the end of your billing period — no pro-rated charges, no cancellation fees." },
    { q:"What happens after the 7-day free trial?",     a:"After your trial ends, you're automatically downgraded to the free plan. No charges unless you choose to upgrade. You keep all your chat history." },
  ];
  return (
    <section className="px-5 sm:px-8 py-24 sm:py-32"
      style={{ background:"rgba(255,255,255,0.014)" }}>
      <div className="max-w-[660px] mx-auto">
        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={FADE_UP}
          className="text-center mb-14">
          <Pill color={T.cyan}>FAQ</Pill>
          <h2 className="font-black tracking-tight mt-4 text-[clamp(24px,4.5vw,44px)] leading-[1.1]">
            Common questions
          </h2>
        </motion.div>
        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={STAGGER(0.07)}
          className="flex flex-col gap-2.5">
          {items.map((item,i) => (
            <motion.div key={i} variants={FADE_UP}
              className="rounded-2xl overflow-hidden"
              style={{ background:T.surface, border:`1px solid ${open===i ? T.borderHi : T.border}`, transition:"border-color 0.2s" }}>
              <button onClick={() => setOpen(open===i ? null : i)}
                className="w-full flex items-center justify-between gap-3 text-left font-semibold text-[14px]"
                style={{ padding:"18px 22px", background:"none", border:"none", cursor:"pointer", color:T.text }}>
                {item.q}
                <ChevronDown open={open===i} />
              </button>
              <AnimatePresence initial={false}>
                {open===i && (
                  <motion.div key="body"
                    initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }}
                    transition={{ duration:0.3, ease:spring }} style={{ overflow:"hidden" }}>
                    <p className="text-[13px] leading-[1.78] m-0" style={{ padding:"0 22px 20px", color:T.muted }}>{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   FINAL CTA
   ══════════════════════════════════════════════════════════════════════════════ */
function FinalCTA() {
  return (
    <section className="px-5 sm:px-8 pb-24 sm:pb-32">
      <motion.div initial="hidden" whileInView="show" viewport={VP} variants={SCALE_IN}
        className="relative text-center rounded-[30px] overflow-hidden mx-auto"
        style={{ maxWidth:840, padding:"80px 32px", background:"linear-gradient(135deg,rgba(124,58,237,0.15),rgba(6,182,212,0.07))", border:"1px solid rgba(124,58,237,0.26)" }}>
        <div style={{ position:"absolute", top:-80, left:-80, width:320, height:320, borderRadius:"50%", background:"radial-gradient(circle,rgba(124,58,237,0.24),transparent 70%)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-60, right:-60, width:280, height:280, borderRadius:"50%", background:"radial-gradient(circle,rgba(6,182,212,0.16),transparent 70%)", pointerEvents:"none" }} />

        <motion.div style={{ position:"relative" }}>
          <motion.div animate={{ y:[0,-9,0] }} transition={{ duration:3.5, repeat:Infinity, ease:"easeInOut" }}
            className="text-[52px] mb-5">🚀</motion.div>
          <h2 className="font-black tracking-tight mb-4 text-[clamp(26px,5vw,52px)] leading-[1.1]">
            Start chatting with your PDFs today
          </h2>
          <p className="text-[17px] mb-3 mx-auto leading-[1.72]" style={{ color:T.muted, maxWidth:480 }}>
            7-day free trial · No credit card · Cancel anytime.
          </p>
          <p className="text-[13px] mb-10" style={{ color:T.faint }}>
            Join 1,000+ professionals already saving hours every week.
          </p>
          <motion.a href="/login"
            whileHover={{ opacity:0.9, y:-2, boxShadow:"0 28px 72px rgba(124,58,237,0.6)" }}
            whileTap={{ scale:0.97 }}
            className="inline-flex items-center gap-2 font-extrabold text-white text-[16px] rounded-full"
            style={{ background:"linear-gradient(135deg,#7c3aed,#06b6d4)", padding:"17px 44px", textDecoration:"none", boxShadow:"0 10px 42px rgba(124,58,237,0.52)", letterSpacing:"-0.2px" }}>
            Start Free Trial <ArrowRight size={17} />
          </motion.a>
          <div className="flex flex-wrap justify-center gap-5 mt-6 text-[12px]" style={{ color:T.faint }}>
            {["No credit card","7-day money-back guarantee","Your data stays private"].map(t=>(
              <span key={t} className="flex items-center gap-1.5"><Check size={12} /> {t}</span>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   FOOTER
   ══════════════════════════════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="px-5 sm:px-8 pt-12 pb-8" style={{ borderTop:`1px solid ${T.border}` }}>
      <div className="max-w-[1100px] mx-auto">
        <div className="flex flex-wrap gap-12 justify-between mb-10">
          <div style={{ maxWidth:240 }}>
            <a href="/" className="flex items-center gap-2 no-underline mb-4">
              <div className="flex items-center justify-center rounded-xl" style={{ width:28, height:28, background:"linear-gradient(135deg,#7c3aed,#06b6d4)" }}>
                <PdfIcon size={12} />
              </div>
              <span className="font-extrabold text-[14px] text-white">Intellixy</span>
            </a>
            <p className="text-[13px] leading-[1.7] m-0" style={{ color:T.faint }}>
              AI-powered document assistant. Chat with any PDF, extract insights, work smarter.
            </p>
          </div>
          <div className="flex flex-wrap gap-12">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color:T.faint }}>Product</p>
              <div className="flex flex-col gap-2.5">
                {[["Features","#features"],["How it works","#how-it-works"],["Pricing","#pricing"],["Demo","#demo"]].map(([l,h])=>(
                  <a key={l} href={h} className="text-[13px] no-underline" style={{ color:"rgba(255,255,255,0.38)" }}>{l}</a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color:T.faint }}>Legal</p>
              <div className="flex flex-col gap-2.5">
                {[["Privacy Policy","/privacy-policy"],["Terms of Service","/terms"],["Refund Policy","/refund-policy"],["Contact","mailto:support@intellixy.app"]].map(([l,h])=>(
                  <a key={l} href={h} className="text-[13px] no-underline" style={{ color:"rgba(255,255,255,0.38)" }}>{l}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-5" style={{ borderTop:`1px solid ${T.border}` }}>
          <p className="text-[12px] m-0" style={{ color:T.faint }}>© 2026 Intellixy. All rights reserved.</p>
          <p className="text-[12px] m-0" style={{ color:"rgba(255,255,255,0.16)" }}>Made with ♥ using Next.js + GPT-4o</p>
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   ROOT
   ══════════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div style={{
      background: T.bg,
      color: T.text,
      fontFamily: "var(--font-inter, Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
      overflowX: "hidden",
    }}>
      <Navbar />
      <Hero />
      <StatsBar />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <Demo />
      <FAQ />
      <FinalCTA />
      <Footer />
      <ConversionBoosts />
    </div>
  );
}
