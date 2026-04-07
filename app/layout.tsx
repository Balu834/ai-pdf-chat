import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Intellixy - AI Document Assistant",
  description: "Chat with PDFs, extract insights, and compare documents using AI.",
  metadataBase: new URL("https://intellixy.org"),
  alternates: { canonical: "https://intellixy.org" },
  openGraph: {
    title: "Intellixy - AI Document Assistant",
    description: "Chat with PDFs, extract insights, and compare documents using AI.",
    url: "https://intellixy.org",
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
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
