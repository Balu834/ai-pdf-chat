const STATS = [
  { num: "1,200+", label: "Professionals" },
  { num: "50K+",   label: "PDFs processed" },
  { num: "98%",    label: "Citation accuracy" },
  { num: "0 bits", label: "Data sold" },
];

export default function Stats() {
  return (
    <section className="lp-stats">
      <div className="lp-stats-grid">
        {STATS.map((s, i) => (
          <div key={i} className="lp-stat-item">
            <div className="lp-stat-num">{s.num}</div>
            <div className="lp-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
