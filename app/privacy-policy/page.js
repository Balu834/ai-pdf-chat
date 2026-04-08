export const metadata = {
  title: "Privacy Policy — Intellixy",
  description: "How Intellixy collects, uses, and protects your personal data.",
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

export default function PrivacyPolicy() {
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
        <h1 style={S.h1}>Privacy Policy</h1>
        <p style={S.meta}>Last updated: April 2026 &nbsp;·&nbsp; Effective immediately</p>

        <p style={S.p}>
          Intellixy ("we", "our", or "us") operates the website{" "}
          <a href="https://intellixy.vercel.app" style={S.a}>intellixy.vercel.app</a>.
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our service.
        </p>

        <hr style={S.divider} />

        <h2 style={S.h2}>1. Information We Collect</h2>
        <p style={S.p}>We collect the following categories of information:</p>
        <ul style={S.ul}>
          <li style={S.li}><strong style={{ color: "white" }}>Account information</strong> — email address and password when you register.</li>
          <li style={S.li}><strong style={{ color: "white" }}>Uploaded documents</strong> — PDF files you upload to use our service. These are stored securely and only accessible by you.</li>
          <li style={S.li}><strong style={{ color: "white" }}>Usage data</strong> — pages visited, features used, questions asked, and timestamps.</li>
          <li style={S.li}><strong style={{ color: "white" }}>Payment information</strong> — processed securely by Razorpay. We do not store card details on our servers.</li>
          <li style={S.li}><strong style={{ color: "white" }}>Device/browser data</strong> — IP address, browser type, and operating system for security and analytics.</li>
        </ul>

        <h2 style={S.h2}>2. How We Use Your Information</h2>
        <ul style={S.ul}>
          <li style={S.li}>To provide and operate the Intellixy service.</li>
          <li style={S.li}>To process payments and manage your subscription.</li>
          <li style={S.li}>To generate AI responses based on your uploaded documents.</li>
          <li style={S.li}>To send transactional emails (account confirmation, password reset).</li>
          <li style={S.li}>To monitor and improve performance, security, and reliability.</li>
          <li style={S.li}>To comply with legal obligations.</li>
        </ul>

        <h2 style={S.h2}>3. Document Storage & AI Processing</h2>
        <p style={S.p}>
          PDFs you upload are stored in Supabase secure cloud storage. Document content is sent to OpenAI's API solely for generating answers to your questions. We do not use your documents to train AI models. Documents are private and accessible only to your account.
        </p>

        <h2 style={S.h2}>4. Data Sharing</h2>
        <p style={S.p}>We do not sell your personal data. We share data only with:</p>
        <ul style={S.ul}>
          <li style={S.li}><strong style={{ color: "white" }}>Supabase</strong> — database and storage provider.</li>
          <li style={S.li}><strong style={{ color: "white" }}>OpenAI</strong> — AI processing of document content.</li>
          <li style={S.li}><strong style={{ color: "white" }}>Razorpay</strong> — payment processing.</li>
          <li style={S.li}><strong style={{ color: "white" }}>Vercel</strong> — hosting and deployment.</li>
          <li style={S.li}>Law enforcement, if required by applicable law.</li>
        </ul>

        <h2 style={S.h2}>5. Data Retention</h2>
        <p style={S.p}>
          We retain your account data and uploaded documents as long as your account is active. You may delete your documents at any time from the dashboard. Upon account deletion, all your data is permanently removed within 30 days.
        </p>

        <h2 style={S.h2}>6. Security</h2>
        <p style={S.p}>
          We implement industry-standard security measures including HTTPS encryption, secure cloud storage, and access controls. However, no method of transmission over the internet is 100% secure.
        </p>

        <h2 style={S.h2}>7. Cookies</h2>
        <p style={S.p}>
          We use essential cookies for authentication session management. We do not use third-party advertising or tracking cookies.
        </p>

        <h2 style={S.h2}>8. Your Rights</h2>
        <ul style={S.ul}>
          <li style={S.li}>Access or export your personal data.</li>
          <li style={S.li}>Correct inaccurate data.</li>
          <li style={S.li}>Request deletion of your account and data.</li>
          <li style={S.li}>Opt out of non-essential communications.</li>
        </ul>
        <p style={S.p}>To exercise these rights, email us at <a href="mailto:support@intellixy.app" style={S.a}>support@intellixy.app</a>.</p>

        <h2 style={S.h2}>9. Children's Privacy</h2>
        <p style={S.p}>
          Intellixy is not directed to children under 13. We do not knowingly collect personal information from children.
        </p>

        <h2 style={S.h2}>10. Changes to This Policy</h2>
        <p style={S.p}>
          We may update this Privacy Policy. We will notify you of significant changes by posting the new policy on this page with an updated date.
        </p>

        <h2 style={S.h2}>11. Contact Us</h2>
        <p style={S.p}>
          For privacy-related questions, contact us at:<br />
          📧 <a href="mailto:support@intellixy.app" style={S.a}>support@intellixy.app</a><br />
          🌐 <a href="https://intellixy.vercel.app" style={S.a}>intellixy.vercel.app</a>
        </p>
      </div>
    </div>
  );
}
