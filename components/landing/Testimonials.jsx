"use client";

import { motion } from "framer-motion";
import { T, FADE_UP, STAGGER, VP } from "@/components/ui/tokens";
import { Pill } from "@/components/ui/atoms";

export default function Testimonials() {
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
