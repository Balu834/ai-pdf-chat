"use client";

import { motion } from "framer-motion";
import { T, FADE_UP, SCALE_IN, STAGGER, VP } from "@/components/ui/tokens";
import { Check, Xmark, Pill } from "@/components/ui/atoms";
import ProPlanCTA from "@/components/ProPlanCTA";

export default function Pricing() {
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
