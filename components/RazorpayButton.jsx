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
      // 1. Load Razorpay checkout script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert("Failed to load payment gateway. Check your internet connection.");
        setLoading(false);
        return;
      }

      // 2. Create order on backend (never call Razorpay directly from frontend)
      const res = await fetch("/api/razorpay/create-order", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        console.error("[RazorpayButton] Order creation failed:", data.error);
        alert(data.error || "Could not initiate payment. Please try again.");
        setLoading(false);
        return;
      }
      const order = await res.json();

      // 3. Open Razorpay checkout with order_id
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Intellixy",
        description: "Pro Plan — ₹299/month",
        order_id: order.id,
        prefill: {
          name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "",
          email: user?.email || "",
        },
        theme: { color: "#7c3aed" },

        // 4. On success — verify server-side then redirect
        async handler(response) {
          try {
            const verify = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
              }),
            });

            if (!verify.ok) {
              const err = await verify.json();
              console.error("[RazorpayButton] Verification failed:", err.error);
              alert(
                "Payment received but verification failed. Contact support with Payment ID: " +
                response.razorpay_payment_id
              );
              setLoading(false);
              return;
            }

            // Success — go to success page
            window.location.href = "/success";
          } catch (err) {
            console.error("[RazorpayButton] Verify error:", err);
            alert("Verification error. Contact support.");
            setLoading(false);
          }
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
      setLoading(false);
    }
  }

  return (
    <button onClick={handlePayment} disabled={loading} style={style}>
      {loading ? "Opening payment…" : (children || "Upgrade to Pro ₹299/month")}
    </button>
  );
}
