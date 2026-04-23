/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Permissions-Policy",
            value: "payment=*, camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              // Framing: self + Razorpay iframes + YouTube demo
              "frame-src 'self' https://*.razorpay.com https://api.razorpay.com https://www.youtube.com https://youtube.com",

              // Scripts: self + Razorpay + Google Analytics/Tag Manager
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'" +
                " https://checkout.razorpay.com" +
                " https://www.googletagmanager.com" +
                " https://www.google-analytics.com" +
                " https://ssl.google-analytics.com",

              // Fetch/XHR: self + Razorpay + Supabase + GA beacon
              "connect-src 'self'" +
                " https://api.razorpay.com https://*.razorpay.com" +
                " wss://*.supabase.co https://*.supabase.co" +
                " https://www.google-analytics.com" +
                " https://analytics.google.com" +
                " https://www.googletagmanager.com" +
                " https://region1.google-analytics.com",

              // Images: allow GA pixel
              "img-src 'self' data: blob:" +
                " https://www.google-analytics.com" +
                " https://www.googletagmanager.com",
            ].join("; "),
          },
        ],
      },
      {
        source: "/((?!api).*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
