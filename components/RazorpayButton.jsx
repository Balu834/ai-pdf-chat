"use client";

import { useState } from "react";
import { Events } from "@/lib/analytics";

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
 *   user      — Supabase user object (for prefill)
 *   couponData — validated coupon object from /api/coupons/validate
 *                If present → one-time discounted order (no auto-renew)
 *                If absent  → monthly subscription (auto-renew)
 *   style     — button style override
 *   children  — button label
 *   onError   — (message: string) => void  called instead of alert() on any error
 *   onSuccess — () => void  called on successful payment (default: redirect to /success)
 */
export default function RazorpayButton({ user, couponData, style, children, onError, onSuccess }) {
  const [loading, setLoading] = useState(false);

  function handleError(message) {
    setLoading(false);
    if (onError) onError(message);
    else console.error("[RazorpayButton]", message);
  }

  async function handlePayment() {
    Events.paymentStart();
    setLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        handleError("Failed to load payment gateway. Check your internet connection.");
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
        let orderBody = {};
        try { orderBody = await res.json(); } catch { orderBody = {}; }
        if (!res.ok) {
          handleError(orderBody.error || "Could not create discounted order.");
          return;
        }

        const options = {
          key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount:      orderBody.amount,
          currency:    orderBody.currency,
          name:        "Intellixy",
          description: `Pro Plan — ₹${orderBody.amount / 100} (coupon: ${couponData.code})`,
          order_id:    orderBody.id,
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
                  user_id:               user?.id,
                }),
                credentials: "include",
              });
              if (!verify.ok) {
                handleError(`Payment received but verification failed. Contact support with Payment ID: ${response.razorpay_payment_id}`);
                return;
              }
              Events.paymentSuccess(couponData.final_amount_paise);
              setLoading(false);
              if (onSuccess) onSuccess();
              else window.location.href = "/success";
            } catch {
              handleError("Verification error. Please contact support.");
            }
          },
          modal: { ondismiss() { setLoading(false); } },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", () => { Events.paymentFailed(); handleError(`Payment failed: ${r.error.description}`); });
        rzp.open();

      } else {
        // ── Subscription path: auto-renewing monthly subscription ───────────
        const res = await fetch("/api/create-subscription", { method: "POST", credentials: "include" });
        let subBody = {};
        try { subBody = await res.json(); } catch { subBody = {}; }
        if (!res.ok) {
          handleError(subBody.error || "Could not initiate payment. Please try again.");
          return;
        }
        const { subscription_id } = subBody;

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
                  user_id:                  user?.id,
                }),
                credentials: "include",
              });
              if (!verify.ok) {
                handleError(`Payment received but verification failed. Contact support with Payment ID: ${response.razorpay_payment_id}`);
                return;
              }
              Events.paymentSuccess(29900);
              setLoading(false);
              if (onSuccess) onSuccess();
              else window.location.href = "/success";
            } catch {
              handleError("Verification error. Please contact support.");
            }
          },
          modal: { ondismiss() { setLoading(false); } },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (r) => { Events.paymentFailed(); handleError(`Payment failed: ${r.error.description}`); });
        rzp.open();
      }
    } catch (err) {
      handleError("Payment error. Please try again.");
    }
  }

  return (
    <button onClick={handlePayment} disabled={loading} style={style}>
      {loading ? "Opening payment…" : (children || "Upgrade to Pro ₹299/month")}
    </button>
  );
}
