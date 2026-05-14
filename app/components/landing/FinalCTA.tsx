import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="lp-final-cta-section">
      <div className="lp-final-cta-inner">
        <p className="lp-final-cta-eyebrow">Get started today</p>
        <h2 className="lp-final-cta-h2">
          Stop reading.<br />Start asking.
        </h2>
        <p className="lp-final-cta-sub">
          Upload your first PDF in seconds. No credit card required.
        </p>
        <div className="lp-final-cta-btns">
          <Link href="/login" className="lp-final-cta-btn-primary">
            Upload a PDF — it&apos;s free →
          </Link>
          <a href="#demo" className="lp-final-cta-btn-ghost">
            See a live demo
          </a>
        </div>
        <p className="lp-final-cta-note">
          14-day money-back guarantee · Cancel anytime
        </p>
      </div>
    </section>
  );
}
