"use client";
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "ai";
  text: string;
  cite?: string;
}

const RESPONSES: Record<string, { text: string; cite: string }> = {
  summarise: {
    text: "Q3 FY24 revenue reached ₹423.7 crore (+23.4% YoY), driven by the enterprise segment (68.2% of revenue). EBITDA grew 16.1% to ₹77.5 crore despite a 120bps margin compression from increased R&D spend. Customer retention hit an all-time high of 94.7%.",
    cite: "p.1 executive summary · p.14, §3.2 · p.38",
  },
  revenue: {
    text: "Revenue totalled ₹423.7 crore in Q3 FY24, a 23.4% YoY increase. Enterprise segment contributed ₹289 crore (68.2%). This beat analyst consensus by 4.2 percentage points. H2 FY24 total: ₹847 crore.",
    cite: "p.14, §3.2 · chart 3.2.1 · p.22",
  },
  risk: {
    text: "Key risks: (1) Margin pressure — R&D costs elevated at ₹42 Cr. (2) Client concentration — top 5 clients = 34% of revenue. (3) Currency exposure — 22% of contracts in USD. (4) Pending DPDPA compliance review.",
    cite: "p.31, §6.1 · p.38, App. C · p.41 risk register",
  },
  growth: {
    text: "Growth drivers: Enterprise BFSI (+38% YoY), Healthcare vertical (new, ₹28 Cr first full quarter), International markets (+41% from small base). Pipeline coverage ratio stands at 3.2× for next quarter.",
    cite: "p.18, §4.1 · p.24 · p.29, §5.3",
  },
  customer: {
    text: "Customer metrics: Retention rate 94.7% (all-time high). Net Revenue Retention 118%. New logos: 47 enterprise accounts. Average contract value up 12.4% to ₹3.8 Cr.",
    cite: "p.26, §5.1 · p.27 customer appendix",
  },
};

function getResponse(q: string) {
  const lq = q.toLowerCase();
  if (lq.includes("summar") || lq.includes("overview") || lq.includes("brief")) return RESPONSES.summarise;
  if (lq.includes("revenue") || lq.includes("breakdown") || lq.includes("income")) return RESPONSES.revenue;
  if (lq.includes("risk") || lq.includes("concern") || lq.includes("challenge")) return RESPONSES.risk;
  if (lq.includes("growth") || lq.includes("driver") || lq.includes("segment")) return RESPONSES.growth;
  if (lq.includes("customer") || lq.includes("retention") || lq.includes("client")) return RESPONSES.customer;
  return { text: "Based on the document, that relates to the financial performance data across Q3 FY24. The report provides detailed breakdowns by segment, geography, and product line.", cite: "p.2 table of contents · §1.0 introduction" };
}

const CHIPS = ["Summarise this", "Revenue breakdown?", "All risks?"];

const INITIAL: Message[] = [
  { role: "user", text: "What was Q3 revenue compared to Q2?" },
  {
    role: "ai",
    text: "Q3 revenue grew 23.4% YoY to ₹423.7 crore, beating analyst consensus by 4.2 percentage points. Q2 revenue was ₹389.1 crore — so Q3 represented a 8.9% quarter-on-quarter increase.",
    cite: "p.14, §3.2 · chart 3.2.1",
  },
];

export default function InteractiveDemo() {
  const [messages, setMessages] = useState<Message[]>(INITIAL);
  const [input, setInput]       = useState("");
  const [typing, setTyping]     = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > INITIAL.length || typing) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typing]);

  function send(q: string) {
    if (!q.trim() || typing) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const r = getResponse(q);
      setTyping(false);
      setMessages((m) => [...m, { role: "ai", text: r.text, cite: r.cite }]);
    }, 1100 + Math.random() * 500);
  }

  return (
    <div className="l-demo-browser">
      {/* Window chrome */}
      <div className="l-browser-chrome">
        <div className="l-browser-dots">
          <span className="l-bd l-bd-r" /><span className="l-bd l-bd-y" /><span className="l-bd l-bd-g" />
        </div>
        <div className="l-browser-url">app.intellixy.com/chat/q3-financial-report</div>
      </div>

      <div className="l-demo-panels">
        {/* PDF Preview (static) */}
        <div className="l-demo-pdf">
          <div className="l-demo-pdf-hdr">
            Q3_Financial_Report.pdf · PAGE <span className="accent">14/42</span> · §3.2 REVENUE BREAKDOWN
          </div>
          <p className="l-pdf-para">
            The consolidated revenue for Q3 FY2024 reached{" "}
            <mark>₹423.7 crore</mark>, representing a year-on-year growth of{" "}
            <mark>23.4%</mark> compared to ₹343.2 crore in Q3 FY2023. This
            performance exceeded analyst consensus estimates by approximately
            4.2 percentage points.{" "}
            <span className="l-pdf-pill">p.14</span>
          </p>
          <p className="l-pdf-para">
            Enterprise segment revenues surged to <mark>₹289 crore</mark>,
            comprising 68.2% of total revenue, driven by expansion in BFSI and
            healthcare verticals. Customer retention rates improved to{" "}
            <mark>94.7%</mark>, the highest in company history.{" "}
            <span className="l-pdf-pill">chart 3.2.1</span>
          </p>
          <p className="l-pdf-para">
            Operating margins contracted by 120 basis points to{" "}
            <mark>18.3%</mark> on account of increased R&D investment (₹42 Cr),
            strategic talent additions, and cloud infrastructure scale-up.{" "}
            <span className="l-pdf-pill">p.38</span>{" "}
            <span className="l-pdf-pill">App. C</span>
          </p>
        </div>

        {/* Chat panel */}
        <div className="l-demo-chat">
          <div className="l-chat-msgs">
            {messages.map((m, i) => (
              <div key={i} className={`l-chat-msg l-chat-${m.role}`}>
                {m.role === "ai" ? (
                  <>
                    <span>{m.text}</span>
                    {m.cite && <div className="l-chat-cite">📎 cited from {m.cite}</div>}
                  </>
                ) : m.text}
              </div>
            ))}
            {typing && (
              <div className="l-chat-msg l-chat-ai l-chat-typing">
                <span className="l-dot" /><span className="l-dot" /><span className="l-dot" />
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="l-chat-input-row">
            <input
              className="l-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Ask about this document…"
              disabled={typing}
              autoComplete="off"
            />
            <button className="l-chat-send" onClick={() => send(input)} disabled={typing} aria-label="Send">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M13 1L1 7l4 2m8-8L7 13l-2-4m8-8L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="l-chat-chips">
            {CHIPS.map((c) => (
              <button key={c} className="l-chip" onClick={() => send(c)} disabled={typing}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .l-demo-browser { background: var(--paper-2, #f3ede1); border: 1.5px solid var(--ink, #1a1814); box-shadow: 12px 12px 0 var(--ink, #1a1814); border-radius: 4px; overflow: hidden; }
        .l-browser-chrome { background: var(--paper-3, #ede5d3); border-bottom: 1.5px solid var(--rule, #d9d1bf); padding: 11px 16px; display: flex; align-items: center; gap: 12px; }
        .l-browser-dots { display: flex; gap: 6px; }
        .l-bd { width: 11px; height: 11px; border-radius: 50%; border: 1px solid rgba(0,0,0,.12); display: block; }
        .l-bd-r { background: #ff5f57; } .l-bd-y { background: #febc2e; } .l-bd-g { background: #28c840; }
        .l-browser-url { flex: 1; background: var(--paper, #faf6ef); border: 1px solid var(--rule, #d9d1bf); border-radius: 3px; padding: 5px 12px; font-family: var(--font-mono, monospace); font-size: 11px; color: var(--ink-faint, #8a8378); text-align: center; }
        .l-demo-panels { display: grid; grid-template-columns: 1fr 1fr; min-height: 460px; }
        .l-demo-pdf { border-right: 1.5px solid var(--rule, #d9d1bf); padding: 22px; overflow: hidden; }
        .l-demo-pdf-hdr { font-family: var(--font-mono, monospace); font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-faint, #8a8378); border-bottom: 1px solid var(--rule, #d9d1bf); padding-bottom: 10px; margin-bottom: 14px; }
        .accent { color: var(--accent, #b8552d); }
        .l-pdf-para { font-size: 12.5px; color: var(--ink-soft, #4a443d); line-height: 1.7; margin-bottom: 13px; }
        .l-pdf-para mark { background: var(--highlight, #f5e6a8); padding: 0 2px; border-radius: 1px; }
        .l-pdf-pill { display: inline-block; font-family: var(--font-mono, monospace); font-size: 9px; border: 1.5px solid var(--accent, #b8552d); color: var(--accent, #b8552d); padding: 1px 5px; border-radius: 2px; margin-left: 2px; vertical-align: middle; cursor: default; }
        .l-demo-chat { display: flex; flex-direction: column; padding: 18px; }
        .l-chat-msgs { flex: 1; display: flex; flex-direction: column; gap: 12px; margin-bottom: 14px; min-height: 260px; max-height: 300px; overflow-y: auto; }
        .l-chat-msg { max-width: 87%; padding: 10px 13px; border-radius: 3px; font-size: 13px; line-height: 1.6; }
        .l-chat-user { background: var(--ink, #1a1814); color: var(--paper, #faf6ef); align-self: flex-end; border-radius: 3px 3px 0 3px; }
        .l-chat-ai { background: var(--paper-3, #ede5d3); border: 1px solid var(--rule, #d9d1bf); align-self: flex-start; border-radius: 3px 3px 3px 0; color: var(--ink-soft, #4a443d); }
        .l-chat-cite { font-family: var(--font-mono, monospace); font-size: 10px; color: var(--accent, #b8552d); margin-top: 6px; border-top: 1px solid var(--rule, #d9d1bf); padding-top: 6px; }
        .l-chat-typing { display: flex; align-items: center; gap: 5px; }
        .l-dot { display: block; width: 6px; height: 6px; border-radius: 50%; background: var(--ink-faint, #8a8378); animation: l-typing .9s infinite ease-in-out; }
        .l-dot:nth-child(2) { animation-delay: .15s; } .l-dot:nth-child(3) { animation-delay: .3s; }
        @keyframes l-typing { 0%,80%,100%{transform:scale(1);opacity:.5} 40%{transform:scale(1.3);opacity:1} }
        .l-chat-input-row { display: flex; gap: 8px; align-items: center; }
        .l-chat-input { flex: 1; border: 1.5px solid var(--rule, #d9d1bf); background: var(--paper, #faf6ef); padding: 9px 12px; font-family: inherit; font-size: 13px; border-radius: 3px; outline: none; transition: border-color .15s; color: var(--ink, #1a1814); }
        .l-chat-input:focus { border-color: var(--accent, #b8552d); }
        .l-chat-send { width: 36px; height: 36px; background: var(--ink, #1a1814); color: var(--paper, #faf6ef); border: none; border-radius: 3px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .15s; flex-shrink: 0; }
        .l-chat-send:hover:not(:disabled) { background: var(--accent, #b8552d); }
        .l-chat-send:disabled { opacity: .5; cursor: default; }
        .l-chat-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; }
        .l-chip { font-family: var(--font-mono, monospace); font-size: 10px; border: 1px solid var(--rule, #d9d1bf); padding: 4px 8px; border-radius: 2px; color: var(--ink-soft, #4a443d); cursor: pointer; background: none; transition: border-color .15s, color .15s; text-transform: uppercase; letter-spacing: .05em; }
        .l-chip:hover:not(:disabled) { border-color: var(--accent, #b8552d); color: var(--accent, #b8552d); }
        .l-chip:disabled { opacity: .5; cursor: default; }
        @media (max-width: 680px) { .l-demo-panels { grid-template-columns: 1fr; } .l-demo-pdf { border-right: none; border-bottom: 1.5px solid var(--rule, #d9d1bf); } }
      `}</style>
    </div>
  );
}
