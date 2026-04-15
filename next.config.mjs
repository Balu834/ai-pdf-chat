/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: [
          {
            key: "Permissions-Policy",
            // Allow the Web Payment API so Razorpay checkout works
            value: "payment=*, camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              // Allow Razorpay's checkout iframe
              "frame-src 'self' https://*.razorpay.com https://api.razorpay.com",
              // Allow Razorpay's SDK script
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com",
              // Allow API calls to Razorpay + Supabase realtime
              "connect-src 'self' https://api.razorpay.com https://*.razorpay.com wss://*.supabase.co https://*.supabase.co",
            ].join("; "),
          },
        ],
      },
      {
        // Clickjacking protection — pages only, not API routes
        source: "/((?!api).*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          // SAMEORIGIN instead of DENY so Razorpay's parent-frame comms work
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
