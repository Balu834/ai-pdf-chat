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
    <div style={S.browser}>
      {/* Browser chrome */}
      <div style={S.chrome}>
        <div style={S.dots}>
          <span style={{ ...S.dot, background: "#ff5f57" }} />
          <span style={{ ...S.dot, background: "#febc2e" }} />
          <span style={{ ...S.dot, background: "#28c840" }} />
        </div>
        <div style={S.url}>app.intellixy.com/chat/q3-financial-report</div>
      </div>

      <div style={S.panels}>
        {/* PDF preview */}
        <div style={S.pdfPanel}>
          <div style={S.pdfHdr}>
            Q3_Financial_Report.pdf · PAGE <span style={{ color: "#10A37F", fontWeight: 700 }}>14/42</span> · §3.2 REVENUE BREAKDOWN
          </div>
          <p style={S.pdfPara}>
            The consolidated revenue for Q3 FY2024 reached{" "}
            <mark style={S.mark}>₹423.7 crore</mark>, representing a year-on-year growth of{" "}
            <mark style={S.mark}>23.4%</mark> compared to ₹343.2 crore in Q3 FY2023. This
            performance exceeded analyst consensus estimates by approximately 4.2 percentage points.{" "}
            <span style={S.pill}>p.14</span>
          </p>
          <p style={S.pdfPara}>
            Enterprise segment revenues surged to <mark style={S.mark}>₹289 crore</mark>,
            comprising 68.2% of total revenue, driven by expansion in BFSI and healthcare verticals.
            Customer retention rates improved to <mark style={S.mark}>94.7%</mark>, the highest in company history.{" "}
            <span style={S.pill}>chart 3.2.1</span>
          </p>
          <p style={S.pdfPara}>
            Operating margins contracted by 120 basis points to{" "}
            <mark style={S.mark}>18.3%</mark> on account of increased R&D investment (₹42 Cr),
            strategic talent additions, and cloud infrastructure scale-up.{" "}
            <span style={S.pill}>p.38</span>{" "}
            <span style={S.pill}>App. C</span>
          </p>
        </div>

        {/* Chat panel */}
        <div style={S.chatPanel}>
          <div style={S.msgs}>
            {messages.map((m, i) => (
              <div key={i} style={m.role === "user" ? S.msgUser : S.msgAiWrap}>
                {m.role === "ai" ? (
                  <>
                    <div style={S.aiLabel}>
                      <span style={S.aiDot} />
                      Intellixy AI
                    </div>
                    <div style={S.msgAi}>
                      <span>{m.text}</span>
                      {m.cite && (
                        <div style={S.cite}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0d8c6e" strokeWidth="2" style={{ flexShrink: 0 }}>
                            <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z"/>
                            <polyline points="15 3 15 9 21 9"/>
                          </svg>
                          Cited from {m.cite}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={S.msgUser}>{m.text}</div>
                )}
              </div>
            ))}
            {typing && (
              <div style={S.typingRow}>
                <span style={S.typingDot} /><span style={{ ...S.typingDot, animationDelay: ".15s" }} /><span style={{ ...S.typingDot, animationDelay: ".3s" }} />
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div style={S.inputRow}>
            <input
              style={S.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Ask about this document…"
              disabled={typing}
              autoComplete="off"
            />
            <button style={{ ...S.sendBtn, ...(typing ? S.sendBtnDisabled : {}) }} onClick={() => send(input)} disabled={typing} aria-label="Send">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M13 1L1 7l4 2m8-8L7 13l-2-4m8-8L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div style={S.chips}>
            {CHIPS.map((c) => (
              <button key={c} style={S.chip} onClick={() => send(c)} disabled={typing}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes demo-bounce {
          0%,80%,100%{transform:scale(1);opacity:.5}
          40%{transform:scale(1.3);opacity:1}
        }
      `}</style>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  browser: {
    background: "#ffffff",
    border: "1px solid rgba(0,0,0,0.1)",
    boxShadow: "0 20px 60px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.04)",
    borderRadius: 12,
    overflow: "hidden",
  },
  chrome: {
    background: "#f5f5f5",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    padding: "10px 16px",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  dots: { display: "flex", gap: 5 },
  dot: { width: 10, height: 10, borderRadius: "50%", display: "block" },
  url: {
    flex: 1,
    background: "#ffffff",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 6,
    padding: "4px 12px",
    fontFamily: "ui-monospace, monospace",
    fontSize: 11,
    color: "#999",
    textAlign: "center" as const,
  },
  panels: { display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 460 },
  pdfPanel: {
    borderRight: "1px solid rgba(0,0,0,0.08)",
    padding: "20px 22px",
    overflow: "hidden",
    background: "#fafafa",
  },
  pdfHdr: {
    fontFamily: "ui-monospace, monospace",
    fontSize: 10,
    letterSpacing: ".1em",
    textTransform: "uppercase" as const,
    color: "#999",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    paddingBottom: 10,
    marginBottom: 14,
  },
  pdfPara: {
    fontSize: 12.5,
    color: "#444",
    lineHeight: 1.7,
    marginBottom: 13,
  },
  mark: {
    background: "rgba(16,163,127,.12)",
    padding: "0 2px",
    borderRadius: 2,
    color: "#0d8c6e",
    fontWeight: 600,
  },
  pill: {
    display: "inline-block",
    fontFamily: "ui-monospace, monospace",
    fontSize: 9,
    border: "1.5px solid #10A37F",
    color: "#10A37F",
    padding: "1px 5px",
    borderRadius: 4,
    marginLeft: 2,
    verticalAlign: "middle" as const,
  },
  chatPanel: {
    display: "flex",
    flexDirection: "column" as const,
    background: "#ffffff",
    padding: 18,
  },
  msgs: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
    marginBottom: 14,
    minHeight: 260,
    maxHeight: 300,
    overflowY: "auto" as const,
  },
  msgUser: {
    alignSelf: "flex-end" as const,
    background: "#111",
    color: "#fff",
    padding: "9px 13px",
    borderRadius: "12px 12px 3px 12px",
    fontSize: 13,
    lineHeight: 1.5,
    maxWidth: "86%",
  },
  msgAiWrap: {
    alignSelf: "flex-start" as const,
    maxWidth: "92%",
  },
  aiLabel: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: ".06em",
    textTransform: "uppercase" as const,
    color: "#10A37F",
    marginBottom: 4,
  },
  aiDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#10A37F",
    display: "inline-block",
  },
  msgAi: {
    background: "#f5f5f5",
    border: "1px solid rgba(0,0,0,0.07)",
    padding: "10px 13px",
    borderRadius: "3px 12px 12px 12px",
    fontSize: 13,
    lineHeight: 1.65,
    color: "#333",
  },
  cite: {
    display: "flex",
    alignItems: "flex-start",
    gap: 5,
    marginTop: 8,
    paddingTop: 8,
    borderTop: "1px solid rgba(0,0,0,0.08)",
    fontFamily: "ui-monospace, monospace",
    fontSize: 10,
    color: "#0d8c6e",
  },
  typingRow: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "10px 13px",
    background: "#f5f5f5",
    border: "1px solid rgba(0,0,0,0.07)",
    borderRadius: "3px 12px 12px 12px",
    alignSelf: "flex-start" as const,
  },
  typingDot: {
    display: "block",
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#999",
    animation: "demo-bounce .9s infinite ease-in-out",
  },
  inputRow: { display: "flex", gap: 8, alignItems: "center" },
  input: {
    flex: 1,
    border: "1.5px solid rgba(0,0,0,0.1)",
    background: "#f9f9f9",
    padding: "8px 12px",
    fontFamily: "inherit",
    fontSize: 13,
    borderRadius: 8,
    outline: "none",
    color: "#111",
  },
  sendBtn: {
    width: 34,
    height: 34,
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    transition: "background .15s",
  },
  sendBtnDisabled: { opacity: 0.4, cursor: "default" },
  chips: { display: "flex", gap: 6, flexWrap: "wrap" as const, marginTop: 10 },
  chip: {
    fontFamily: "ui-monospace, monospace",
    fontSize: 10,
    border: "1px solid rgba(0,0,0,0.1)",
    padding: "4px 9px",
    borderRadius: 20,
    color: "#666",
    cursor: "pointer",
    background: "none",
    transition: "border-color .15s, color .15s",
    textTransform: "uppercase" as const,
    letterSpacing: ".05em",
  },
};
