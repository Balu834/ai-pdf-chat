"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0d0d1a", color: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: 480 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f8fafc", marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p style={{ color: "#94a3b8", marginBottom: 32, lineHeight: 1.6 }}>
            An unexpected error occurred. Your data is safe — please try again.
          </p>
          <button
            onClick={reset}
            style={{ padding: "12px 28px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none", borderRadius: 10, color: "white", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
          <p style={{ marginTop: 16, fontSize: 13, color: "#64748b" }}>
            If this keeps happening, refresh the page.
          </p>
        </div>
      </body>
    </html>
  );
}
