import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Analytics from "@/components/Analytics";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://intellixy.vercel.app";

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
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
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
        {children}
        <Analytics />
      </body>
    </html>
  );
}
