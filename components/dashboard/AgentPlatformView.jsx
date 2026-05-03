"use client";

import { useState, useEffect } from "react";
import AgentChat         from "./AgentChat";
import TaskMonitor       from "./TaskMonitor";
import IntegrationsPanel from "./IntegrationsPanel";

const C = {
  bg:          "#0f1117",
  card:        "#16181f",
  border:      "rgba(255,255,255,0.07)",
  textPrimary: "#f0f2f5",
  textMuted:   "rgba(240,242,245,0.45)",
  accent:      "#6366f1",
};

const TABS = [
  { id: "chat",         label: "Agent Chat",    icon: "🤖" },
  { id: "tasks",        label: "Task Queue",    icon: "⚙️" },
  { id: "integrations", label: "Integrations",  icon: "🔗" },
];

export default function AgentPlatformView({ fileUrl, lang }) {
  const [activeTab, setActiveTab] = useState("chat");

  // Auto-switch to integrations tab if OAuth redirect params are present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("oauth_success") || params.get("oauth_error")) {
      setActiveTab("integrations");
    }
    // Auto-switch to tasks if a confirmation is pending
    if (params.get("confirm_pending")) {
      setActiveTab("tasks");
    }
  }, []);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: C.bg }}>

      {/* Tab bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 4, padding: "0 20px",
        borderBottom: `1px solid ${C.border}`, background: C.bg, flexShrink: 0,
      }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "12px 14px", fontSize: 13, fontWeight: 600,
              cursor: "pointer", border: "none", background: "transparent",
              color: activeTab === tab.id ? C.textPrimary : C.textMuted,
              borderBottom: activeTab === tab.id ? `2px solid ${C.accent}` : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {activeTab === "chat" && (
          <AgentChat fileUrl={fileUrl} lang={lang} />
        )}
        {activeTab === "tasks" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "0 24px" }}>
            <TaskMonitor />
          </div>
        )}
        {activeTab === "integrations" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "0 24px" }}>
            <IntegrationsPanel />
          </div>
        )}
      </div>
    </div>
  );
}
