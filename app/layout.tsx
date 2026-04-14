import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Intellixy - AI Document Assistant",
  description: "Chat with PDFs, extract insights, and compare documents using AI.",
  metadataBase: new URL("https://intellixy.vercel.app"),
  alternates: { canonical: "https://intellixy.vercel.app" },
  openGraph: {
    title: "Intellixy - AI Document Assistant",
    description: "Chat with PDFs, extract insights, and compare documents using AI.",
    url: "https://intellixy.vercel.app",
    siteName: "Intellixy",
    type: "website",
  },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
