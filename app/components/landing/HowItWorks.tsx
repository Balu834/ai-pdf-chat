const STEPS = [
  {
    n: "1",
    title: "Upload your PDF",
    body: "Drop any PDF — research papers, contracts, financial reports, lecture notes. We index it instantly, no size limit on Pro.",
    tag: "⚡ Ready in seconds",
  },
  {
    n: "2",
    title: "Ask in plain English",
    body: "Type any question naturally. No need to scroll through 100 pages — just ask what you want to know.",
    tag: "💬 Conversational AI",
  },
  {
    n: "3",
    title: "Get cited answers",
    body: "Every answer includes exact page and section references. Click to jump to the source instantly. No hallucinations.",
    tag: "📎 Verified citations",
  },
];

export default function HowItWorks() {
  return (
    <section className="lp-workflow-section" id="how-it-works">
      <div className="lp-workflow-inner">
        <div className="lp-section-head">
          <p className="lp-section-eyebrow">How it works</p>
          <h2 className="lp-section-title">Three steps to instant insight</h2>
          <p className="lp-section-sub">
            From upload to cited answer in under 30 seconds.
          </p>
        </div>

        <div className="lp-workflow-steps">
          {STEPS.map(s => (
            <div key={s.n} className="lp-workflow-step">
              <div className="lp-workflow-num">{s.n}</div>
              <div>
                <div className="lp-workflow-title">{s.title}</div>
                <div className="lp-workflow-body">{s.body}</div>
                <div className="lp-workflow-tag">{s.tag}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
