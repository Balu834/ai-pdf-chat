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
              // Framing: self + Razorpay + YouTube demo
              "frame-src 'self' https://*.razorpay.com https://api.razorpay.com https://www.youtube.com https://youtube.com",

              // Scripts: explicit script-src-elem required — browsers don't
              // always fall back to script-src for <script src="..."> elements
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'" +
                " https://checkout.razorpay.com" +
                " https://www.googletagmanager.com" +
                " https://www.google-analytics.com" +
                " https://ssl.google-analytics.com" +
                " https://vercel.live",

              "script-src-elem 'self' 'unsafe-inline'" +
                " https://checkout.razorpay.com" +
                " https://www.googletagmanager.com" +
                " https://www.google-analytics.com" +
                " https://ssl.google-analytics.com" +
                " https://vercel.live",

              // Styles
              "style-src 'self' 'unsafe-inline'",

              // Fonts
              "font-src 'self' data:",

              // Fetch/XHR
              "connect-src 'self'" +
                " https://api.razorpay.com https://*.razorpay.com" +
                " wss://*.supabase.co https://*.supabase.co" +
                " https://www.google-analytics.com" +
                " https://analytics.google.com" +
                " https://www.googletagmanager.com" +
                " https://region1.google-analytics.com" +
                " https://vercel.live wss://vercel.live",

              // Images
              "img-src 'self' data: blob: https:",
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
