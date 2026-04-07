import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI PDF Chat — Chat with any PDF instantly",
  description:
    "Upload invoices, contracts, and reports. Ask questions in plain English. Get precise answers in seconds — powered by AI.",
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
