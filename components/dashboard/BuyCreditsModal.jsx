"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { C } from "./tokens";
import { Events } from "@/lib/analytics";

const PACKS = [
  { id: "starter", credits: 100,  paise: 9900,  label: "Starter",  icon: "⚡", per: "₹0.99/credit", popular: false },
  { id: "popular", credits: 350,  paise: 29900, label: "Popular",  icon: "🔥", per: "₹0.85/credit", popular: true  },
  { id: "power",   credits: 1500, paise: 99900, label: "Power",    icon: "💎", per: "₹0.67/credit", popular: false },
];

function loadRazorpay() {
  return new Promise((resolve) => {
    if (document.getElementById("rzp-script")) { resolve(true); return; }
    const s = document.createElement("script");
    s.id = "rzp-script";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function BuyCreditsModal({ user, onClose, onSuccess }) {
  const [selected, setSelected] = useState("popular");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  async function handleBuy() {
    const pack = PACKS.find((p) => p.id === selected);
    if (!pack) return;
    setError(null);
    setLoading(true);

    try {
      const loaded = await loadRazorpay();
      if (!loaded) { setError("Payment gateway failed to load."); setLoading(false); return; }

      const res = await fetch("/api/razorpay/buy-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack_id: pack.id }),
        credentials: "include",
      });
      const order = await res.json();
      if (!res.ok) { setError(order.error || "Could not create order."); setLoading(false); return; }

      Events.paymentStart?.();

      const options = {
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount:      order.amount,
        currency:    order.currency,
        name:        "Intellixy Credits",
        description: `${pack.label} — ${pack.credits} credits`,
        order_id:    order.id,
        prefill: {
          name:  user?.user_metadata?.full_name || user?.email?.split("@")[0] || "",
          email: user?.email || "",
        },
        theme: { color: "#7c3aed" },
        async handler(response) {
          try {
            const verify = await fetch("/api/razorpay/verify-credits-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                pack_id:             pack.id,
                user_id:             user?.id,
              }),
              credentials: "include",
            });
            const result = await verify.json();
            if (!verify.ok) { setError(result.error || "Verification failed."); setLoading(false); return; }
            setLoading(false);
            onSuccess?.(result.balance, pack.credits);
            onClose?.();
          } catch {
            setError("Verification error. Contact support.");
            setLoading(false);
          }
        },
        modal: { ondismiss() { setLoading(false); } },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (r) => { setError(`Payment failed: ${r.error.description}`); setLoading(false); });
      rzp.open();
    } catch (err) {
      setError("Payment error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose?.()}
        style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.22 }}
          style={{ width: "100%", maxWidth: 480, background: "#0e0c1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: 28, position: "relative", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}
        >
          {/* Close */}
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: C.textMuted, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>

          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 6px" }}>Buy Credits</p>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: C.textPrimary, margin: "0 0 6px", letterSpacing: "-0.5px" }}>Top up your AI credits</h2>
            <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>1 credit = 1 AI question. Credits never expire.</p>
          </div>

          {/* Packs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {PACKS.map((pack) => {
              const active = selected === pack.id;
              return (
                <motion.div
                  key={pack.id}
                  onClick={() => setSelected(pack.id)}
                  whileHover={{ borderColor: "rgba(124,58,237,0.5)" }}
                  style={{ position: "relative", padding: "14px 16px", borderRadius: 14, cursor: "pointer", border: `1px solid ${active ? "#7c3aed" : "rgba(255,255,255,0.08)"}`, background: active ? "rgba(124,58,237,0.08)" : "rgba(255,255,255,0.02)", transition: "all 0.18s" }}
                >
                  {pack.popular && (
                    <span style={{ position: "absolute", top: -10, right: 14, fontSize: 10, fontWeight: 800, color: "white", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", padding: "2px 10px", borderRadius: 99 }}>Most Popular</span>
                  )}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{pack.icon}</span>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, margin: "0 0 2px" }}>{pack.label} — {pack.credits} credits</p>
                        <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>{pack.per}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 18, fontWeight: 900, color: active ? "#a78bfa" : C.textPrimary, margin: 0 }}>₹{pack.paise / 100}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {error && (
            <p style={{ fontSize: 12, color: "#f87171", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px", marginBottom: 14 }}>{error}</p>
          )}

          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 12px 40px rgba(124,58,237,0.5)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBuy}
            disabled={loading}
            style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700, color: "white", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Opening payment…" : `Buy ${PACKS.find((p) => p.id === selected)?.credits} Credits — ₹${(PACKS.find((p) => p.id === selected)?.paise ?? 0) / 100}`}
          </motion.button>

          <p style={{ fontSize: 11, textAlign: "center", color: C.textMuted, marginTop: 10 }}>🔒 Secured by Razorpay · Credits never expire</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
