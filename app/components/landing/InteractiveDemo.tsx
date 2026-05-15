"use client";
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "ai";
  text: string;
  cite?: string;
}

const RESPONSES: Record<string, { text: string; cite: string }> = {
  summarise: {
    text: "Q3 FY24 revenue reached ₹423.7 crore (+23.4% YoY), driven by enterprise (68.2%). EBITDA grew 16.1% to ₹77.5 crore. Customer retention hit an all-time high of 94.7%.",
    cite: "p.1 executive summary · p.14, §3.2 · p.38",
  },
  revenue: {
    text: "Revenue totalled ₹423.7 crore in Q3 FY24, a 23.4% YoY increase. Enterprise contributed ₹289 crore (68.2%). Beats analyst consensus by 4.2pp.",
    cite: "p.14, §3.2 · chart 3.2.1 · p.22",
  },
  risk: {
    text: "Key risks: (1) Margin pressure — R&D costs at ₹42 Cr. (2) Client concentration — top 5 = 34% of revenue. (3) Currency exposure — 22% in USD. (4) Pending DPDPA review.",
    cite: "p.31, §6.1 · p.38, App. C · p.41",
  },
  growth: {
    text: "Growth drivers: Enterprise BFSI (+38% YoY), Healthcare (₹28 Cr first full quarter), International (+41%). Pipeline coverage 3.2× for next quarter.",
    cite: "p.18, §4.1 · p.24 · p.29, §5.3",
  },
  customer: {
    text: "Retention 94.7% (all-time high). NRR 118%. New logos: 47 enterprise accounts. Average contract value up 12.4% to ₹3.8 Cr.",
    cite: "p.26, §5.1 · p.27 customer appendix",
  },
};

function getResponse(q: string) {
  const lq = q.toLowerCase();
  if (lq.includes("summar") || lq.includes("overview")) return RESPONSES.summarise;
  if (lq.includes("revenue") || lq.includes("income"))   return RESPONSES.revenue;
  if (lq.includes("risk") || lq.includes("challenge"))   return RESPONSES.risk;
  if (lq.includes("growth") || lq.includes("driver"))    return RESPONSES.growth;
  if (lq.includes("customer") || lq.includes("retention")) return RESPONSES.customer;
  return { text: "Based on the document, that relates to Q3 FY24 financial performance data. The report provides detailed breakdowns by segment, geography, and product line.", cite: "§1.0 introduction · p.2" };
}

const CHIPS = ["Summarise this", "Revenue breakdown?", "All risks?"];

const INITIAL: Message[] = [
  { role: "user", text: "What was Q3 revenue compared to Q2?" },
  { role: "ai",   text: "Q3 revenue grew 23.4% YoY to ₹423.7 crore, beating consensus by 4.2pp. Q2 was ₹389.1 crore — 8.9% QoQ growth.", cite: "p.14, §3.2 · chart 3.2.1" },
];

export default function InteractiveDemo() {
  const [messages, setMessages] = useState<Message[]>(INITIAL);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > INITIAL.length || typing) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typing]);

  function send(q: string) {
    if (!q.trim() || typing) return;
    setMessages(m => [...m, { role: "user", text: q }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const r = getResponse(q);
      setTyping(false);
      setMessages(m => [...m, { role: "ai", text: r.text, cite: r.cite }]);
    }, 1000 + Math.random() * 600);
  }

  return (
    <div className="lp-demo-window">
      {/* Browser chrome */}
      <div className="lp-demo-chrome">
        <div className="lp-demo-dots" aria-hidden>
          <span className="lp-demo-dot" style={{ background: "#FF5F57" }} />
          <span className="lp-demo-dot" style={{ background: "#FEBC2E" }} />
          <span className="lp-demo-dot" style={{ background: "#28C840" }} />
        </div>
        <div className="lp-demo-url">app.intellixy.com/chat/q3-financial-report</div>
      </div>

      <div className="lp-demo-panels">
        {/* PDF panel */}
        <div className="lp-demo-pdf-panel">
          <div className="lp-demo-pdf-hdr">
            Q3_Financial_Report.pdf · PAGE{" "}
            <span className="lp-demo-hdr-page">14/42</span>
            {" "}· §3.2 REVENUE
          </div>
          <p className="lp-demo-pdf-para">
            Consolidated revenue for Q3 FY2024 reached{" "}
            <mark className="lp-demo-mark">₹423.7 crore</mark>, a year-on-year
            growth of <mark className="lp-demo-mark">23.4%</mark> vs ₹343.2 crore in
            Q3 FY2023. Exceeded analyst consensus by 4.2pp.{" "}
            <span className="lp-demo-pill">p.14</span>
          </p>
          <p className="lp-demo-pdf-para">
            Enterprise segment revenues surged to <mark className="lp-demo-mark">₹289 crore</mark> (68.2% of revenue),
            driven by BFSI and healthcare verticals. Retention{" "}
            <mark className="lp-demo-mark">94.7%</mark>.{" "}
            <span className="lp-demo-pill">chart 3.2.1</span>
          </p>
          <p className="lp-demo-pdf-para">
            Operating margins contracted 120bps to{" "}
            <mark className="lp-demo-mark">18.3%</mark> on elevated R&amp;D
            investment (₹42 Cr).{" "}
            <span className="lp-demo-pill">p.38</span>
          </p>
        </div>

        {/* Chat panel */}
        <div className="lp-demo-chat-panel">
          <div className="lp-demo-msgs">
            {messages.map((m, i) =>
              m.role === "ai" ? (
                <div key={i} className="lp-demo-msg-ai-wrap">
                  <div className="lp-demo-ai-label">
                    <span className="lp-demo-ai-dot" />
                    Intellixy AI
                  </div>
                  <div className="lp-demo-msg-ai">
                    {m.text}
                    {m.cite && (
                      <div className="lp-demo-cite">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                          <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z"/>
                          <polyline points="15 3 15 9 21 9"/>
                        </svg>
                        {m.cite}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div key={i} className="lp-demo-msg-user">{m.text}</div>
              )
            )}
            {typing && (
              <div className="lp-demo-typing-row">
                <span className="lp-demo-typing-dot" />
                <span className="lp-demo-typing-dot" style={{ animationDelay: ".15s" }} />
                <span className="lp-demo-typing-dot" style={{ animationDelay: ".3s" }} />
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="lp-demo-input-row">
            <input
              className="lp-demo-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send(input)}
              placeholder="Ask about this document…"
              disabled={typing}
              autoComplete="off"
            />
            <button
              className="lp-demo-send-btn"
              onClick={() => send(input)}
              disabled={typing}
              aria-label="Send"
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M13 1L1 7l4 2m8-8L7 13l-2-4m8-8L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="lp-demo-chips">
            {CHIPS.map(c => (
              <button
                key={c}
                className="lp-demo-chip"
                onClick={() => send(c)}
                disabled={typing}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
