"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion, useInView } from "framer-motion";

/*
 * Looping product demo for the hero: a PDF page and a chat side by side.
 * A question is typed, the answer streams in, a page citation appears and a
 * line draws from the citation to the highlighted passage on the page.
 * Sample content only — clearly a demo, no claims about real users.
 */

const QUESTION = "When is an agreement void?";
const ANSWER =
  "An agreement that is not enforceable by law is void. For example, one made without lawful consideration or for an unlawful object.";
const LOOP_MS = 9000;
const ease = [0.22, 1, 0.36, 1] as const;

// Timeline (ms from loop start)
const T = { type: 300, ask: 1700, think: 2000, answer: 2700, cite: 4600, link: 5000 };

export default function HeroDemo() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-80px" });
  const [t, setT] = useState(reduce ? LOOP_MS : 0);

  useEffect(() => {
    if (reduce || !inView) return;
    let start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      let el = now - start;
      if (el > LOOP_MS) { start = now; el = 0; }
      setT(Math.floor(el / 40) * 40); // ~25 updates/s is plenty; identical values skip re-render
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce, inView]);

  const typed = QUESTION.slice(0, Math.max(0, Math.min(QUESTION.length, Math.floor((t - T.type) / 40))));
  const asked = t >= T.ask;
  const thinking = t >= T.think && t < T.answer;
  const words = ANSWER.split(" ");
  const shownWords = t >= T.answer ? Math.min(words.length, Math.floor((t - T.answer) / 85) + 1) : 0;
  const cited = t >= T.cite;
  const linked = t >= T.link;
  const fading = !reduce && t > LOOP_MS - 500;

  // Measure the chip and the highlighted passage so the connector lands exactly on them.
  const stageRef = useRef<HTMLDivElement>(null);
  const citeRef = useRef<HTMLSpanElement>(null);
  const hlRef = useRef<HTMLDivElement>(null);
  const [link, setLink] = useState<string | null>(null);
  const [endPt, setEndPt] = useState<[number, number] | null>(null);
  useLayoutEffect(() => {
    if (!cited) { setLink(null); return; }
    const measure = () => {
      const s = stageRef.current?.getBoundingClientRect();
      const c = citeRef.current?.getBoundingClientRect();
      const h = hlRef.current?.getBoundingClientRect();
      if (!s || !c || !h) return;
      const sx = c.left - s.left, sy = c.top + c.height / 2 - s.top;
      const ex = h.right - s.left - 4, ey = h.top + h.height / 2 - s.top;
      const dx = Math.max(30, (sx - ex) / 2);
      setLink(`M ${sx} ${sy} C ${sx - dx} ${sy}, ${ex + dx} ${ey}, ${ex} ${ey}`);
      setEndPt([ex, ey]);
    };
    // The chip springs in and the cards slide in on first load, so keep re-measuring
    // every frame for 1.6s until everything has settled, then on resize only.
    let raf = 0;
    const until = performance.now() + 1600;
    const loop = () => { measure(); if (performance.now() < until) raf = requestAnimationFrame(loop); };
    loop();
    const late = setTimeout(measure, 1700);
    window.addEventListener("resize", measure);
    return () => { cancelAnimationFrame(raf); clearTimeout(late); window.removeEventListener("resize", measure); };
  }, [cited]);

  return (
    <div className="lp-hd" ref={ref} aria-label="Animated example of Intellixy answering a question with a page citation">
      <motion.div className="lp-hd-stage" ref={stageRef} animate={{ opacity: fading ? 0 : 1 }} transition={{ duration: 0.4 }}>
        {/* PDF page */}
        <motion.div
          className="lp-hd-pdf"
          initial={reduce ? false : { opacity: 0, y: 24, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: -2 }}
          transition={{ duration: 0.8, delay: 0.2, ease }}
        >
          <div className="lp-hd-pdf-bar">
            <span className="lp-hd-pdf-tag">PDF</span>
            <span className="lp-hd-pdf-name">Contract_Law_Notes.pdf</span>
          </div>
          <div className="lp-hd-pdf-body">
            <div className="lp-hd-pdf-h" />
            {[92, 78, 88, 64].map((w, i) => <div key={i} className="lp-hd-line" style={{ width: `${w}%` }} />)}
            <div ref={hlRef} className={`lp-hd-hl${linked ? " on" : ""}`}>
              <div className="lp-hd-line" style={{ width: "86%" }} />
              <div className="lp-hd-line" style={{ width: "70%" }} />
            </div>
            {[90, 74, 82, 58, 80].map((w, i) => <div key={i} className="lp-hd-line" style={{ width: `${w}%` }} />)}
          </div>
          <div className="lp-hd-pdf-foot">page 42</div>
        </motion.div>

        {/* Chat */}
        <motion.div
          className="lp-hd-chat"
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease }}
        >
          <div className="lp-hd-chat-hdr">
            <span className="lp-hd-dot" />
            Intellixy
          </div>
          <div className="lp-hd-msgs">
            <AnimatePresence>
              {asked && (
                <motion.div
                  key="q"
                  className="lp-hd-q"
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease }}
                >
                  {QUESTION}
                </motion.div>
              )}
              {thinking && (
                <motion.div key="th" className="lp-hd-think" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <span /><span /><span />
                </motion.div>
              )}
              {shownWords > 0 && (
                <motion.div key="a" className="lp-hd-a" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  {words.slice(0, shownWords).join(" ")}
                  {shownWords < words.length && <span className="lp-hd-caret" />}
                  <AnimatePresence>
                    {cited && (
                      <motion.span
                        key="c"
                        ref={citeRef}
                        className={`lp-hd-cite${linked ? " on" : ""}`}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 420, damping: 18 }}
                      >
                        p.42 · Sec. 2(g)
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="lp-hd-input">
            <span className={asked ? "lp-hd-ph" : "lp-hd-typed"}>
              {asked ? "Ask anything about this PDF…" : typed || "Ask anything about this PDF…"}
              {!asked && typed && <span className="lp-hd-caret" />}
            </span>
            <span className={`lp-hd-send${t > T.ask - 250 && t < T.ask + 150 ? " press" : ""}`} aria-hidden>↑</span>
          </div>
        </motion.div>

        {/* Citation connector: drawn from the citation chip to the highlighted passage */}
        <svg className="lp-hd-link" aria-hidden>
          {link && (
            <motion.path
              d={link}
              fill="none"
              stroke="url(#lpHdGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              initial={false}
              animate={{ pathLength: linked ? 1 : 0, opacity: linked ? 1 : 0 }}
              transition={{ duration: 0.7, ease }}
            />
          )}
          {link && linked && endPt && (
            <motion.circle cx={endPt[0]} cy={endPt[1]} r="4" fill="#F7B500"
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: "spring", stiffness: 500, damping: 20 }} />
          )}
          <defs>
            <linearGradient id="lpHdGrad" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#F7B500" />
              <stop offset="100%" stopColor="#FFD56B" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </div>
  );
}
