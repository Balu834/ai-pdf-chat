const TESTIMONIALS = [
  {
    quote: "I read 40-page contracts in 3 minutes now. Intellixy finds the renewal traps and liability clauses my paralegal would take hours to locate.",
    name:  "Priya Venkataraman",
    role:  "M&A Associate, Mumbai",
    init:  "PV",
  },
  {
    quote: "Our equity research team dropped average report-reading time by 70%. The citation accuracy is the only reason our compliance team approved it.",
    name:  "Rohan Mehta",
    role:  "VP Research, NBFC",
    init:  "RM",
  },
  {
    quote: "I used to spend Sunday nights reading board packs. Now I ask questions. The cited answers mean I can push back in meetings with exact page numbers.",
    name:  "Anika Singh",
    role:  "CFO, Series B SaaS",
    init:  "AS",
  },
];

function Stars() {
  return (
    <div className="lp-testi-stars" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="lp-testimonials">
      <div className="lp-section-head">
        <p className="lp-section-eyebrow">Testimonials</p>
        <h2 className="lp-section-title">Trusted by professionals who read for a living</h2>
      </div>

      <div className="lp-testi-grid">
        {TESTIMONIALS.map(t => (
          <div key={t.name} className="lp-testi-card">
            <Stars />
            <blockquote className="lp-testi-quote">&ldquo;{t.quote}&rdquo;</blockquote>
            <div className="lp-testi-author">
              <div className="lp-testi-avatar" aria-hidden>{t.init}</div>
              <div>
                <div className="lp-testi-name">{t.name}</div>
                <div className="lp-testi-role">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
