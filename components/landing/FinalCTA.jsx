"use client";

import { motion } from "framer-motion";
import { T, SCALE_IN, VP } from "@/components/ui/tokens";
import { Check, ArrowRight } from "@/components/ui/atoms";

export default function FinalCTA() {
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
