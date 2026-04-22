"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { T, FADE_UP, STAGGER, VP } from "@/components/ui/tokens";
import { Pill } from "@/components/ui/atoms";
import { Events } from "@/lib/analytics";

const APK_URL = "/intellixy.apk"; // put the APK in /public/intellixy.apk

const STEPS = [
  {
    num: "1",
    title: "Download the APK",
    desc: "Tap the download button below. The APK file (~8 MB) will save to your device.",
    icon: "⬇️",
  },
  {
    num: "2",
    title: 'Allow "Install unknown apps"',
    desc: 'Go to Settings → Security → Install unknown apps → allow your browser. This is a one-time step.',
    icon: "🔓",
  },
  {
    num: "3",
    title: "Open & Install",
    desc: "Open the downloaded APK from your notifications or Downloads folder and tap Install.",
    icon: "📦",
  },
  {
    num: "4",
    title: "Launch Intellixy",
    desc: "Open the app, sign in, and start chatting with your PDFs instantly.",
    icon: "🚀",
  },
];

export default function AppInstall() {
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    setIsAndroid(/Android/i.test(navigator.userAgent));
  }, []);

  return (
    <section id="install-app" className="px-5 sm:px-8 py-24 sm:py-32">
      <div className="max-w-[900px] mx-auto">

        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={FADE_UP}
          className="text-center mb-14">
          <Pill>Android App</Pill>
          <h2 className="font-black tracking-tight mt-4 mb-3 text-[clamp(26px,5vw,48px)] leading-[1.1]">
            Get the Android app
          </h2>
          <p className="text-[16px] mx-auto" style={{ color:T.muted, maxWidth:480 }}>
            Faster access, offline launch, and a native app feel —
            right on your phone.
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={STAGGER(0.1)}
          className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
          {STEPS.map((s) => (
            <motion.div key={s.num} variants={FADE_UP}
              className="rounded-[20px] p-6 flex gap-4 items-start"
              style={{ background:T.surface, border:`1px solid ${T.border}` }}>
              <div className="flex-shrink-0 flex items-center justify-center rounded-[14px] text-[22px]"
                style={{ width:48, height:48, background:"rgba(124,58,237,0.12)", border:"1px solid rgba(124,58,237,0.25)" }}>
                {s.icon}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color:"#a78bfa" }}>
                  Step {s.num}
                </p>
                <p className="font-bold text-[15px] mb-1" style={{ color:T.text }}>{s.title}</p>
                <p className="text-[13px] leading-[1.65]" style={{ color:T.muted }}>{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Download CTA */}
        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={FADE_UP}
          className="rounded-[28px] p-8 sm:p-12 text-center relative overflow-hidden"
          style={{ background:"linear-gradient(135deg,rgba(124,58,237,0.14),rgba(6,182,212,0.07))", border:"1px solid rgba(124,58,237,0.26)" }}>

          <div style={{ position:"absolute", top:-60, right:-60, width:220, height:220, borderRadius:"50%", background:"radial-gradient(circle,rgba(124,58,237,0.2),transparent 70%)", pointerEvents:"none" }} />

          <div className="relative">
            <div className="text-[48px] mb-4">📱</div>
            <h3 className="font-black text-[clamp(20px,4vw,32px)] tracking-tight mb-2">
              Intellixy for Android
            </h3>
            <p className="text-[14px] mb-2" style={{ color:T.muted }}>
              Version 1.0 · ~8 MB · Requires Android 7.0+
            </p>

            {/* Safety note */}
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-8 text-[12px]"
              style={{ background:"rgba(74,222,128,0.08)", border:"1px solid rgba(74,222,128,0.22)", color:"#4ade80" }}>
              🔒 Safe to install — same app as intellixy.vercel.app
            </div>

            {/* Primary download */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <motion.a
                href={APK_URL}
                download="intellixy.apk"
                onClick={Events.apkDownloadClick}
                whileHover={{ opacity:0.9, y:-2, boxShadow:"0 20px 56px rgba(124,58,237,0.55)" }}
                whileTap={{ scale:0.97 }}
                className="inline-flex items-center gap-2.5 font-extrabold text-white text-[15px] rounded-full"
                style={{ background:"linear-gradient(135deg,#7c3aed,#06b6d4)", padding:"15px 36px", textDecoration:"none", boxShadow:"0 8px 32px rgba(124,58,237,0.42)", letterSpacing:"-0.2px" }}>
                <span style={{ fontSize:18 }}>⬇</span> Download APK (Free)
              </motion.a>

              <motion.a
                href="/login"
                whileHover={{ background:"rgba(255,255,255,0.08)", y:-2 }}
                whileTap={{ scale:0.97 }}
                className="inline-flex items-center gap-2 font-bold text-[14px] rounded-full"
                style={{ background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}`, padding:"15px 28px", color:T.text, textDecoration:"none" }}>
                Use web app instead →
              </motion.a>
            </div>

            {/* APK warning — friendly explanation */}
            <p className="text-[12px] mt-6 mx-auto leading-[1.6]" style={{ color:T.faint, maxWidth:440 }}>
              <strong style={{ color:"rgba(255,255,255,0.4)" }}>Why "unknown sources"?</strong>{" "}
              Android warns about APKs not from the Play Store. This is normal for direct downloads.
              Intellixy is safe — it's the exact same app you use in your browser.
              We're working on Play Store listing.
            </p>
          </div>
        </motion.div>

        {/* Desktop note */}
        {!isAndroid && (
          <motion.p initial="hidden" whileInView="show" viewport={VP} variants={FADE_UP}
            className="text-center text-[13px] mt-6" style={{ color:T.faint }}>
            On a desktop? Visit this page from your Android phone to download the app,
            or{" "}
            <a href="/login" style={{ color:"#a78bfa", textDecoration:"none" }}>
              use the web app right here →
            </a>
          </motion.p>
        )}
      </div>
    </section>
  );
}
