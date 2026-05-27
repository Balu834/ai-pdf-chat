type ErrorType = "upload" | "chat" | "payment" | "auth" | "general";

export async function reportError(opts: {
  type: ErrorType;
  message: string;
  page?: string;
  userEmail?: string;
  details?: string;
}) {
  try {
    await fetch("/api/report-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts),
    });
  } catch {}
}
