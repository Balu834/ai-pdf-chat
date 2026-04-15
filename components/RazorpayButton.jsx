"use client";

import { useState } from "react";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) { resolve(true); return; }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * RazorpayButton
 *
 * props:
 *   user       — Supabase user object (for prefill)
 *   couponData — validated coupon object from /api/coupons/validate
 *                If present → one-time discounted order (no auto-renew)
 *                If absent  → monthly subscription (auto-renew)
 *   style      — button style override
 *   children   — button label
 */
export default function RazorpayButton({ user, couponData, style, children }) {
  const [loading, setLoading] = useState(false);

  async function handlePayment() {
    setLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert("Failed to load payment gateway. Check your internet connection.");
        setLoading(false);
        return;
      }

      if (couponData) {
        // ── Coupon path: one-time discounted order ──────────────────────────
        const res = await fetch("/api/razorpay/create-discounted-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coupon_code: couponData.code }),
          credentials: "include",
        });
        if (!res.ok) {
          const d = await res.json();
          alert(d.error || "Could not create discounted order.");
          setLoading(false);
          return;
        }
        const order = await res.json();

        const options = {
          key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount:      order.amount,
          currency:    order.currency,
          name:        "Intellixy",
          description: `Pro Plan — ₹${order.amount / 100} (coupon: ${couponData.code})`,
          order_id:    order.id,
          prefill: {
            name:  user?.user_metadata?.full_name || user?.email?.split("@")[0] || "",
            email: user?.email || "",
          },
          theme: { color: "#7c3aed" },
          async handler(response) {
            try {
              const verify = await fetch("/api/razorpay/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id:     response.razorpay_order_id,
                  razorpay_payment_id:   response.razorpay_payment_id,
                  razorpay_signature:    response.razorpay_signature,
                  coupon_code:           couponData.code,
                  coupon_id:             couponData.coupon_id,
                  original_amount_paise: couponData.original_amount_paise,
                  discount_paise:        couponData.discount_amount_paise,
                  final_amount_paise:    couponData.final_amount_paise,
                }),
                credentials: "include",
              });
              if (!verify.ok) {
                const err = await verify.json();
                alert("Payment received but verification failed. Contact support with Payment ID: " + response.razorpay_payment_id);
                setLoading(false);
                return;
              }
              window.location.href = "/success";
            } catch {
              alert("Verification error. Contact support.");
              setLoading(false);
            }
          },
          modal: { ondismiss() { setLoading(false); } },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (r) => { alert(`Payment failed: ${r.error.description}`); setLoading(false); });
        rzp.open();

      } else {
        // ── Subscription path: auto-renewing monthly subscription ───────────
        const res = await fetch("/api/create-subscription", { method: "POST", credentials: "include" });
        if (!res.ok) {
          const d = await res.json();
          alert(d.error || "Could not initiate payment. Please try again.");
          setLoading(false);
          return;
        }
        const { subscription_id } = await res.json();

        const options = {
          key:             process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          subscription_id,
          name:            "Intellixy",
          description:     "Pro Plan — ₹299/month",
          prefill: {
            name:  user?.user_metadata?.full_name || user?.email?.split("@")[0] || "",
            email: user?.email || "",
          },
          theme: { color: "#7c3aed" },
          async handler(response) {
            try {
              const verify = await fetch("/api/razorpay/verify-subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_payment_id:      response.razorpay_payment_id,
                  razorpay_subscription_id: response.razorpay_subscription_id,
                  razorpay_signature:       response.razorpay_signature,
                }),
                credentials: "include",
              });
              if (!verify.ok) {
                const err = await verify.json();
                alert("Payment received but verification failed. Contact support with Payment ID: " + response.razorpay_payment_id);
                setLoading(false);
                return;
              }
              window.location.href = "/success";
            } catch {
              alert("Verification error. Contact support.");
              setLoading(false);
            }
          },
          modal: { ondismiss() { setLoading(false); } },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (r) => { alert(`Payment failed: ${r.error.description}`); setLoading(false); });
        rzp.open();
      }
    } catch (err) {
      console.error("[RazorpayButton]", err);
      alert("Payment error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <button onClick={handlePayment} disabled={loading} style={style}>
      {loading ? "Opening payment…" : (children || "Upgrade to Pro ₹299/month")}
    </button>
  );
}
