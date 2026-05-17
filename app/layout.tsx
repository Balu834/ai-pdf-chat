import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Geist } from "next/font/google";
import { Suspense } from "react";
import Script from "next/script";
import "./globals.css";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Analytics from "@/components/Analytics";
import RouteAnalytics from "@/components/RouteAnalytics";
import AnimatedBackground from "@/components/AnimatedBackground";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import InstallPopup from "@/components/InstallPopup";
import GlobalErrorHandler from "@/app/components/GlobalErrorHandler";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
  preload: false,
});


const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://intellixy.vercel.app";

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID?.trim();

export const viewport: Viewport = {
  themeColor: "#F5B942",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Intellixy – Chat with PDFs using AI",
    template: "%s | Intellixy",
  },
  description:
    "Upload any PDF and ask questions using AI. Get answers, summaries, and insights from your documents. Free plan available — no credit card needed.",
  metadataBase: new URL(APP_URL),
  alternates: { canonical: APP_URL },
  keywords: [
    "AI PDF chat",
    "chat with PDF",
    "PDF summarizer",
    "AI document assistant",
    "PDF question answer",
    "Intellixy",
  ],
  openGraph: {
    title: "Intellixy – Chat with PDFs using AI",
    description:
      "Upload any PDF and ask questions using AI. Get answers, summaries, and insights from your documents.",
    url: APP_URL,
    siteName: "Intellixy",
    type: "website",
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Intellixy – AI PDF Chat",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Intellixy – Chat with PDFs using AI",
    description:
      "Upload any PDF and ask questions using AI. Get answers, summaries, and insights from your documents.",
    images: [`${APP_URL}/og-image.png`],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Intellixy",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${geist.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning>
        {/* ── Meta Pixel noscript fallback (JS-disabled users) ────────── */}
        {FB_PIXEL_ID && (
          // eslint-disable-next-line @next/next/no-img-element
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        )}

        <GlobalErrorHandler />
        <AnimatedBackground />
        {children}

        {/* ── Google Analytics 4, Microsoft Clarity ───────────────────── */}
        <Analytics />

        {/* ── Meta Pixel — placed directly in root layout (not a sub-component)
             so next/script can reliably hoist it. strategy="afterInteractive"
             defers execution until after React hydration — zero render blocking.
             The built-in `if(f.fbq)return` guard prevents double-initialization.
             To add new tracking events anywhere: import from @/lib/facebookPixel ── */}
        {FB_PIXEL_ID && (
          <Script id="meta-pixel" strategy="afterInteractive">{`
            !function(f,b,e,v,n,t,s){
              if(f.fbq)return;
              n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;
              n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)
            }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init','${FB_PIXEL_ID}');
            fbq('track','PageView');
          `}</Script>
        )}

        {/* ── SPA route-change tracking (GA4 + Meta Pixel PageView) ───── */}
        <Suspense fallback={null}><RouteAnalytics /></Suspense>

        {/* ── Vercel observability (production only) ───────────────────── */}
        {process.env.VERCEL === "1" && <VercelAnalytics />}
        {process.env.VERCEL === "1" && <SpeedInsights />}

        <ServiceWorkerRegistration />
        <InstallPopup />
      </body>
    </html>
  );
}
