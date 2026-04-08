export const metadata = {
  title: "Refund Policy — Intellixy",
  description: "Intellixy cancellation and refund policy.",
};

const S = {
  page: { background: "#07071a", minHeight: "100vh", color: "white", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
  nav: { borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" },
  logo: { display: "flex", alignItems: "center", gap: 10, textDecoration: "none" },
  logoBox: { width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center" },
  body: { maxWidth: 760, margin: "0 auto", padding: "64px 24px 96px" },
  h1: { fontSize: "clamp(1.8rem,4vw,2.4rem)", fontWeight: 900, color: "white", margin: "0 0 8px", letterSpacing: "-0.5px" },
  meta: { fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "0 0 48px" },
  h2: { fontSize: 18, fontWeight: 700, color: "white", margin: "36px 0 10px" },
  p: { fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.8, margin: "0 0 14px" },
  ul: { paddingLeft: 20, margin: "0 0 14px" },
  li: { fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.8, marginBottom: 6 },
  divider: { border: "none", borderTop: "1px solid rgba(255,255,255,0.07)", margin: "40px 0" },
  a: { color: "#a78bfa", textDecoration: "none" },
  box: { background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 14, padding: "20px 24px", marginBottom: 24 },
};

export default function RefundPolicy() {
  return (
    <div style={S.page}>
      <nav style={S.nav}>
        <a href="/" style={S.logo}>
          <div style={S.logoBox}><span style={{ fontSize: 15, fontWeight: 900, color: "white" }}>I</span></div>
          <span style={{ fontSize: 15, fontWeight: 800, color: "white" }}>Intellixy</span>
        </a>
        <a href="/" style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>← Back to home</a>
      </nav>

      <div style={S.body}>
        <h1 style={S.h1}>Refund & Cancellation Policy</h1>
        <p style={S.meta}>Last updated: April 2026 &nbsp;·&nbsp; Effective immediately</p>

        <div style={S.box}>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", margin: 0, lineHeight: 1.7 }}>
            <strong style={{ color: "white" }}>Summary:</strong> We offer a 7-day refund for first-time Pro subscribers if you are not satisfied. Cancellations stop future billing immediately. Contact us within 7 days at{" "}
            <a href="mailto:support@intellixy.app" style={S.a}>support@intellixy.app</a>.
          </p>
        </div>

        <hr style={S.divider} />

        <h2 style={S.h2}>1. Subscription Model</h2>
        <p style={S.p}>
          Intellixy Pro is a monthly subscription at ₹299/month, processed via Razorpay. Your subscription renews automatically each month on the date of your original purchase.
        </p>

        <h2 style={S.h2}>2. Cancellation Policy</h2>
        <ul style={S.ul}>
          <li style={S.li}>You may cancel your Pro subscription at any time.</li>
          <li style={S.li}>After cancellation, you will retain Pro access until the end of the current billing period.</li>
          <li style={S.li}>No charges will be made after cancellation.</li>
          <li style={S.li}>To cancel, email us at <a href="mailto:support@intellixy.app" style={S.a}>support@intellixy.app</a> with your registered email.</li>
        </ul>

        <h2 style={S.h2}>3. Refund Policy</h2>
        <p style={S.p}><strong style={{ color: "white" }}>Eligible for refund:</strong></p>
        <ul style={S.ul}>
          <li style={S.li}>First-time subscribers who request a refund within <strong style={{ color: "white" }}>7 days</strong> of their initial payment.</li>
          <li style={S.li}>Technical issues on our side that prevented you from using the service.</li>
          <li style={S.li}>Duplicate charges due to payment errors.</li>
        </ul>

        <p style={S.p}><strong style={{ color: "white" }}>Not eligible for refund:</strong></p>
        <ul style={S.ul}>
          <li style={S.li}>Renewal charges after the initial subscription period.</li>
          <li style={S.li}>Requests made after 7 days from payment date.</li>
          <li style={S.li}>Accounts that violate our Terms of Service.</li>
          <li style={S.li}>Partial months — we do not pro-rate refunds for unused days.</li>
        </ul>

        <h2 style={S.h2}>4. How to Request a Refund</h2>
        <p style={S.p}>To request a refund:</p>
        <ul style={S.ul}>
          <li style={S.li}>Email <a href="mailto:support@intellixy.app" style={S.a}>support@intellixy.app</a> within 7 days of payment.</li>
          <li style={S.li}>Include your registered email address and Razorpay payment ID.</li>
          <li style={S.li}>Describe the reason for your refund request.</li>
        </ul>
        <p style={S.p}>
          We will review and process eligible refunds within <strong style={{ color: "white" }}>5–7 business days</strong>. Refunds are credited to the original payment method.
        </p>

        <h2 style={S.h2}>5. Payment Processing</h2>
        <p style={S.p}>
          All payments are processed by Razorpay. Razorpay's payment processing terms also apply. We do not store your card or bank details.
        </p>

        <h2 style={S.h2}>6. Free Plan</h2>
        <p style={S.p}>
          The free plan is available at no cost and does not require payment. No refunds apply to the free plan.
        </p>

        <h2 style={S.h2}>7. Contact Us</h2>
        <p style={S.p}>
          For refund or cancellation requests:<br />
          📧 <a href="mailto:support@intellixy.app" style={S.a}>support@intellixy.app</a><br />
          We respond within 24 hours on business days.
        </p>
      </div>
    </div>
  );
}
