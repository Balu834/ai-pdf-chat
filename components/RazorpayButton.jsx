"use client";

import { useState } from "react";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RazorpayButton({ user, style, children }) {
  const [loading, setLoading] = useState(false);

  async function handlePayment() {
    setLoading(true);
    try {
      // Load Razorpay script dynamically
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert("Failed to load payment gateway. Check your internet connection.");
        return;
      }

      // Create order on backend
      const res = await fetch("/api/razorpay/create-order", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        console.error("[RazorpayButton] Order creation failed:", data.error);
        alert("Could not initiate payment. Please try again.");
        return;
      }
      const order = await res.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Intellixy",
        description: "Pro Plan ₹299",
        order_id: order.id,
        prefill: {
          name: user?.name || user?.email?.split("@")[0] || "",
          email: user?.email || "",
        },
        theme: { color: "#7c3aed" },
        handler(response) {
          console.log("[RazorpayButton] Payment success:", response);
          // TODO: save user as PRO in database
          // Call your API here: POST /api/razorpay/verify with response data
          window.location.href = "/dashboard?upgraded=1";
        },
        modal: {
          ondismiss() {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        console.error("[RazorpayButton] Payment failed:", response.error);
        alert(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error("[RazorpayButton] Error:", err);
      alert("Payment error. Please try again.");
    } finally {
      // Don't set loading false here — Razorpay modal is still open
      // setLoading(false) is called in ondismiss / handler
    }
  }

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      style={style}
    >
      {loading ? "Opening payment…" : (children || "Upgrade to Pro ₹299/month")}
    </button>
  );
}
