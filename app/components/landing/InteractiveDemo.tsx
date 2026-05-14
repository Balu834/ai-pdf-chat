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
  return {
    text: "Based on the document, that relates to the financial performance data across Q3 FY24. The report provides detailed breakdowns by segment, geography, and product line.",
    cite: "p.2 table of contents · §1.0 introduction",
  };
}

const CHIPS = ["Summarise this", "Revenue breakdown?", "All risks?"];

const INITIAL: Message[] = [
  { role: "user", text: "What was Q3 revenue compared to Q2?" },
  {
    role: "ai",
    text: "Q3 revenue grew 23.4% YoY to ₹423.7 crore, beating analyst consensus by 4.2 percentage points. Q2 revenue was ₹389.1 crore — so Q3 represented an 8.9% quarter-on-quarter increase.",
    cite: "p.14, §3.2 · chart 3.2.1",
  },
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
    <div className="lp-demo-browser">
      {/* Browser chrome */}
      <div className="lp-demo-chrome">
        <div className="lp-demo-dots" aria-hidden>
          <span className="lp-demo-dot" style={{ background: "#ff5f57" }} />
          <span className="lp-demo-dot" style={{ background: "#febc2e" }} />
          <span className="lp-demo-dot" style={{ background: "#28c840" }} />
        </div>
        <div className="lp-demo-url">app.intellixy.com/chat/q3-financial-report</div>
      </div>

      <div className="lp-demo-panels">
        {/* PDF preview */}
        <div className="lp-demo-pdf-panel">
          <div className="lp-demo-pdf-hdr">
            Q3_Financial_Report.pdf · PAGE{" "}
            <span className="lp-demo-hdr-page">14/42</span>
            {" "}· §3.2 REVENUE BREAKDOWN
          </div>
          <p className="lp-demo-pdf-para">
            The consolidated revenue for Q3 FY2024 reached{" "}
            <mark className="lp-demo-mark">₹423.7 crore</mark>, representing a year-on-year
            growth of <mark className="lp-demo-mark">23.4%</mark> compared to ₹343.2 crore in
            Q3 FY2023. This performance exceeded analyst consensus estimates by approximately
            4.2 percentage points. <span className="lp-demo-pill">p.14</span>
          </p>
          <p className="lp-demo-pdf-para">
            Enterprise segment revenues surged to <mark className="lp-demo-mark">₹289 crore</mark>,
            comprising 68.2% of total revenue, driven by expansion in BFSI and healthcare
            verticals. Customer retention rates improved to{" "}
            <mark className="lp-demo-mark">94.7%</mark>.{" "}
            <span className="lp-demo-pill">chart 3.2.1</span>
          </p>
          <p className="lp-demo-pdf-para">
            Operating margins contracted by 120 basis points to{" "}
            <mark className="lp-demo-mark">18.3%</mark> on account of increased R&amp;D
            investment (₹42 Cr). <span className="lp-demo-pill">p.38</span>{" "}
            <span className="lp-demo-pill">App. C</span>
          </p>
        </div>

        {/* Chat panel */}
        <div className="lp-demo-chat-panel">
          <div className="lp-demo-msgs">
            {messages.map((m, i) => (
              <div key={i}>
                {m.role === "ai" ? (
                  <div className="lp-demo-msg-ai-wrap">
                    <div className="lp-demo-ai-label">
                      <span className="lp-demo-ai-dot" />
                      Intellixy AI
                    </div>
                    <div className="lp-demo-msg-ai">
                      <span>{m.text}</span>
                      {m.cite && (
                        <div className="lp-demo-cite">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                            <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z"/>
                            <polyline points="15 3 15 9 21 9"/>
                          </svg>
                          Cited from {m.cite}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="lp-demo-msg-user">{m.text}</div>
                )}
              </div>
            ))}
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
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
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
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M13 1L1 7l4 2m8-8L7 13l-2-4m8-8L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="lp-demo-chips">
            {CHIPS.map((c) => (
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
