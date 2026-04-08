"use client";

import RazorpayButton from "./RazorpayButton";

const CTA_STYLE = {
  display: "block",
  width: "100%",
  textAlign: "center",
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 700,
  color: "white",
  padding: "13px",
  borderRadius: 12,
  background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
  border: "none",
  cursor: "pointer",
  boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
  transition: "opacity 0.2s",
  letterSpacing: "-0.1px",
};

export default function ProPlanCTA() {
  return (
    <RazorpayButton style={CTA_STYLE}>
      Upgrade to Pro ₹299/month
    </RazorpayButton>
  );
}
