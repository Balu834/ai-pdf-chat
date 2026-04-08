export const metadata = {
  title: "Terms of Service — Intellixy",
  description: "Terms and conditions for using Intellixy.",
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
};

export default function Terms() {
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
        <h1 style={S.h1}>Terms of Service</h1>
        <p style={S.meta}>Last updated: April 2026 &nbsp;·&nbsp; Effective immediately</p>

        <p style={S.p}>
          Please read these Terms of Service carefully before using Intellixy. By accessing or using our service, you agree to be bound by these terms.
        </p>

        <hr style={S.divider} />

        <h2 style={S.h2}>1. Acceptance of Terms</h2>
        <p style={S.p}>
          By creating an account or using Intellixy, you confirm that you are at least 13 years old and agree to these Terms of Service and our Privacy Policy.
        </p>

        <h2 style={S.h2}>2. Description of Service</h2>
        <p style={S.p}>
          Intellixy is an AI-powered document assistant that allows users to upload PDF files and interact with them using natural language questions. The service is available on a free tier and a paid Pro subscription.
        </p>

        <h2 style={S.h2}>3. Account Registration</h2>
        <ul style={S.ul}>
          <li style={S.li}>You must provide accurate and complete information when creating an account.</li>
          <li style={S.li}>You are responsible for maintaining the confidentiality of your password.</li>
          <li style={S.li}>You are responsible for all activity that occurs under your account.</li>
          <li style={S.li}>Notify us immediately at <a href="mailto:support@intellixy.app" style={S.a}>support@intellixy.app</a> if you suspect unauthorized access.</li>
        </ul>

        <h2 style={S.h2}>4. Free and Pro Plans</h2>
        <p style={S.p}><strong style={{ color: "white" }}>Free Plan:</strong> Includes 5 PDF uploads and 20 AI questions per day. Free forever.</p>
        <p style={S.p}><strong style={{ color: "white" }}>Pro Plan:</strong> ₹299/month. Includes unlimited PDFs, unlimited questions, PDF comparison, and priority support. Billed monthly. Cancel anytime.</p>

        <h2 style={S.h2}>5. Payments and Billing</h2>
        <ul style={S.ul}>
          <li style={S.li}>Payments are processed securely by Razorpay.</li>
          <li style={S.li}>Pro subscriptions are billed monthly on the date of purchase.</li>
          <li style={S.li}>You can cancel your subscription at any time. Access continues until the end of the billing period.</li>
          <li style={S.li}>We reserve the right to change pricing with 30 days notice.</li>
        </ul>

        <h2 style={S.h2}>6. Acceptable Use</h2>
        <p style={S.p}>You agree not to:</p>
        <ul style={S.ul}>
          <li style={S.li}>Upload documents containing illegal, harmful, or copyrighted content you do not have rights to.</li>
          <li style={S.li}>Use the service to violate any applicable law or regulation.</li>
          <li style={S.li}>Attempt to reverse-engineer, scrape, or abuse the AI system.</li>
          <li style={S.li}>Share your account with others or resell access to the service.</li>
          <li style={S.li}>Use the service to generate spam or misleading content.</li>
        </ul>

        <h2 style={S.h2}>7. Intellectual Property</h2>
        <p style={S.p}>
          You retain ownership of documents you upload. By uploading, you grant Intellixy a limited license to process your documents solely for the purpose of providing the service. Intellixy's software, design, and branding remain our intellectual property.
        </p>

        <h2 style={S.h2}>8. Disclaimer of Warranties</h2>
        <p style={S.p}>
          Intellixy is provided "as is" without warranties of any kind. AI responses may occasionally be inaccurate. We do not guarantee the accuracy, completeness, or reliability of AI-generated answers. Always verify critical information independently.
        </p>

        <h2 style={S.h2}>9. Limitation of Liability</h2>
        <p style={S.p}>
          To the maximum extent permitted by law, Intellixy shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service, including but not limited to loss of data or business interruption.
        </p>

        <h2 style={S.h2}>10. Termination</h2>
        <p style={S.p}>
          We reserve the right to suspend or terminate accounts that violate these terms. You may close your account at any time. Upon termination, your data will be deleted per our Privacy Policy.
        </p>

        <h2 style={S.h2}>11. Governing Law</h2>
        <p style={S.p}>
          These terms are governed by the laws of India. Any disputes shall be resolved in the courts of India.
        </p>

        <h2 style={S.h2}>12. Changes to Terms</h2>
        <p style={S.p}>
          We may update these Terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms.
        </p>

        <h2 style={S.h2}>13. Contact</h2>
        <p style={S.p}>
          Questions about these Terms? Contact us:<br />
          📧 <a href="mailto:support@intellixy.app" style={S.a}>support@intellixy.app</a>
        </p>
      </div>
    </div>
  );
}
