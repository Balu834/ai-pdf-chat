"use client";

import { motion } from "framer-motion";
import { T, FADE_UP, SCALE_IN } from "@/components/ui/tokens";
import { Check, PdfIcon, ArrowRight } from "@/components/ui/atoms";

export default function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center overflow-hidden text-center"
      style={{ minHeight:"100svh", paddingTop:60 }}>

      {/* Animated mesh gradient background */}
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

        {/* Product mockup */}
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
