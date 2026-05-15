/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["crypto"],
  webpack(config, { isServer }) {
    // pdf.js needs canvas — alias to false to avoid SSR errors
    config.resolve.alias.canvas = false;
    // crypto is a Node.js built-in; prevent webpack from trying to bundle it
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, crypto: false };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Permissions-Policy",
            value: "payment=*, camera=(), microphone=*, geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              // Service workers + pdf.js workers (blob: from webpack bundling)
              "worker-src 'self' blob:",

              // Media (TTS audio, blob: URLs)
              "media-src 'self' blob:",

              // Framing: self + Razorpay + YouTube + Vercel live/toolbar
              "frame-src 'self' https://*.razorpay.com https://api.razorpay.com https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://vercel.live https://*.vercel.live",

              // Scripts: explicit script-src-elem required — browsers don't
              // always fall back to script-src for <script src="..."> elements
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'" +
                " https://checkout.razorpay.com" +
                " https://www.googletagmanager.com" +
                " https://www.google-analytics.com" +
                " https://ssl.google-analytics.com" +
                " https://connect.facebook.net" +
                " https://vercel.live https://*.vercel-scripts.com",

              "script-src-elem 'self' 'unsafe-inline'" +
                " https://checkout.razorpay.com" +
                " https://www.googletagmanager.com" +
                " https://www.google-analytics.com" +
                " https://ssl.google-analytics.com" +
                " https://connect.facebook.net" +
                " https://vercel.live https://*.vercel-scripts.com",

              // Styles
              "style-src 'self' 'unsafe-inline'",

              // Fonts
              "font-src 'self' data:",

              // Fetch/XHR — includes OAuth provider endpoints for any
              // client-side token/profile calls, and OpenAI for streaming
              "connect-src 'self' blob:" +
                " https://api.razorpay.com https://*.razorpay.com" +
                " wss://*.supabase.co https://*.supabase.co" +
                " https://www.google-analytics.com" +
                " https://analytics.google.com" +
                " https://www.googletagmanager.com" +
                " https://region1.google-analytics.com" +
                " https://vercel.live wss://vercel.live https://*.vercel-scripts.com" +
                " https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com" +
                " https://slack.com https://api.slack.com" +
                " https://api.notion.com" +
                " https://api.openai.com" +
                " https://connect.facebook.net https://www.facebook.com" +
                " https://*.birch.events" +
                " https://*.awsapprunner.com",

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
