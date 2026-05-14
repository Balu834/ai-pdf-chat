import { FileText, Paperclip } from "lucide-react";

export default function Showcase() {
  return (
    <section className="lp-showcase">
      <div className="lp-browser">

        {/* Browser chrome */}
        <div className="lp-browser-chrome">
          <div className="lp-browser-dots" aria-hidden>
            <span className="lp-dot red"   />
            <span className="lp-dot amber" />
            <span className="lp-dot green" />
          </div>
          <div className="lp-browser-url" aria-hidden>
            intellixy.com/Q3_Financial_Report.pdf
          </div>
        </div>

        {/* Browser body — two-pane */}
        <div className="lp-browser-body">

          {/* Left — faux PDF */}
          <div className="lp-pdf-pane" aria-hidden>
            <div className="lp-pdf-header">
              <FileText size={13} strokeWidth={2} />
              <span>Q3_Financial_Report.pdf · 42 pages</span>
            </div>
            <div className="lp-pdf-lines">
              {[92,78,85,60,88,42,70,55,80,66,90,48,74].map((w,i) => (
                <div key={i} className="lp-pdf-line" style={{ width: `${w}%` }} />
              ))}
              {/* Highlighted passage in PDF */}
              <div className="lp-pdf-highlight">
                Revenue for Q3 FY24 reached{" "}
                <mark className="lp-citation-mark">₹423.7 crore</mark>
                , representing a{" "}
                <mark className="lp-citation-mark">23.4% YoY increase</mark>
                {" "}driven by enterprise...
              </div>
              {[65,80,55].map((w,i) => (
                <div key={i} className="lp-pdf-line" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>

          {/* Right — chat */}
          <div className="lp-chat-pane">

            {/* User message */}
            <div className="lp-chat-user">
              What was Q3 revenue compared to Q2?
            </div>

            {/* AI message */}
            <div className="lp-chat-ai">
              <div className="lp-chat-ai-avatar" aria-hidden>I</div>
              <div className="lp-chat-ai-body">
                <p>
                  Q3 FY24 revenue reached{" "}
                  <mark className="lp-citation-mark">₹423.7 crore</mark>
                  , up{" "}
                  <mark className="lp-citation-mark">23.4% YoY</mark>
                  . The enterprise segment drove{" "}
                  <mark className="lp-citation-mark">68.2%</mark>{" "}
                  of total revenue, beating analyst consensus by 4.2 pp.
                </p>

                {/* Citation chip */}
                <div className="lp-chat-cite">
                  <Paperclip size={11} strokeWidth={2} aria-hidden />
                  Q3 Report · p.14, §3.2 · chart 3.2.1
                </div>
              </div>
            </div>

            {/* Follow-up pills */}
            <div className="lp-chat-pills" aria-hidden>
              <span className="lp-chat-pill">Revenue breakdown?</span>
              <span className="lp-chat-pill">Key risks?</span>
              <span className="lp-chat-pill">Export to Notion</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
