import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Analytics from "@/components/Analytics";
import AnimatedBackground from "@/components/AnimatedBackground";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import InstallPopup from "@/components/InstallPopup";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://intellixy.vercel.app";

export const viewport: Viewport = {
  themeColor: "#7c3aed",
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
    "Upload any PDF and get instant AI answers, summaries, and key insights in seconds. Free plan available — no credit card needed.",
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
      "Upload any PDF and get instant AI answers, summaries, and key insights in seconds.",
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
      "Upload any PDF and get instant AI answers, summaries, and key insights in seconds.",
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
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body suppressHydrationWarning>
        <AnimatedBackground />
        {children}
        <Analytics />
        <VercelAnalytics />
        <SpeedInsights />
        <ServiceWorkerRegistration />
        <InstallPopup />
      </body>
    </html>
  );
}
