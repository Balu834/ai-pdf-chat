"use client";

import { useNotifications } from "@/hooks/useNotifications";

export default function NotificationsToggle() {
  const { permission, isSubscribed, isLoading, enable, disable } = useNotifications();

  if (permission === "unsupported") return null;

  if (permission === "denied") {
    return (
      <div style={{
        padding: "12px 16px", borderRadius: 12,
        background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
        fontSize: 12.5, color: "rgba(248,113,113,0.85)", lineHeight: 1.5,
      }}>
        🔕 Notifications blocked in browser settings.
        <br />
        <span style={{ color: "rgba(248,113,113,0.55)" }}>
          To enable: click the 🔒 icon in the address bar → Allow notifications.
        </span>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 16px", borderRadius: 14,
      background: isSubscribed ? "rgba(74,222,128,0.06)" : "rgba(124,58,237,0.06)",
      border: `1px solid ${isSubscribed ? "rgba(74,222,128,0.2)" : "rgba(124,58,237,0.2)"}`,
      gap: 12,
    }}>
      <div>
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#f1f5f9" }}>
          {isSubscribed ? "🔔 Notifications on" : "🔔 Enable notifications"}
        </p>
        <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(241,245,249,0.5)", lineHeight: 1.4 }}>
          {isSubscribed
            ? "We'll remind you when it's time to revisit your PDFs."
            : "Get reminders and stay on top of your documents."}
        </p>
      </div>

      <button
        onClick={isSubscribed ? disable : enable}
        disabled={isLoading}
        style={{
          flexShrink: 0,
          padding: "8px 16px",
          fontSize: 12,
          fontWeight: 700,
          border: "none",
          borderRadius: 10,
          cursor: isLoading ? "not-allowed" : "pointer",
          opacity: isLoading ? 0.6 : 1,
          background: isSubscribed
            ? "rgba(239,68,68,0.12)"
            : "linear-gradient(135deg,#7c3aed,#4f46e5)",
          color: isSubscribed ? "#f87171" : "white",
          transition: "opacity 0.15s",
          whiteSpace: "nowrap",
        }}
      >
        {isLoading ? "…" : isSubscribed ? "Turn off" : "Enable"}
      </button>
    </div>
  );
}
