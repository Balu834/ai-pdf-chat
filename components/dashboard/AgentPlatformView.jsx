"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AgentChat         from "./AgentChat";
import TaskMonitor       from "./TaskMonitor";
import IntegrationsPanel from "./IntegrationsPanel";

const TABS = [
  { id: "chat",         label: "Agent Chat",   icon: "🤖", desc: "Chat with your AI agent" },
  { id: "tasks",        label: "Task Queue",   icon: "⚙️",  desc: "Monitor running tasks"  },
  { id: "integrations", label: "Integrations", icon: "🔗", desc: "Connect your tools"     },
];

export default function AgentPlatformView({ fileUrl, lang }) {
  const [activeTab, setActiveTab] = useState("chat");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("oauth_success") || params.get("oauth_error")) setActiveTab("integrations");
    if (params.get("confirm_pending")) setActiveTab("tasks");
  }, []);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#07071a", position: "relative" }}>

      {/* Ambient glow */}
      <div style={{ position: "absolute", top: 0, left: "20%", width: 400, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "20%", right: "10%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Page header */}
      <div style={{ padding: "28px 28px 0", flexShrink: 0 }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(240,240,248,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>AI Platform</p>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#f0f0f8", margin: "0 0 20px", letterSpacing: "-0.4px" }}>
            Agent{" "}
            <span style={{ background: "linear-gradient(135deg,#a78bfa,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Workspace
            </span>
          </h1>
        </motion.div>

        {/* Premium pill tabs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.35 }}
          style={{ display: "flex", gap: 6, padding: "5px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, width: "fit-content" }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={active ? {} : { background: "rgba(255,255,255,0.05)" }}
                whileTap={{ scale: 0.96 }}
                style={{
                  position: "relative", display: "flex", alignItems: "center", gap: 7,
                  padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: active ? 700 : 500,
                  cursor: "pointer", border: "none", transition: "all 0.2s",
                  background: active ? "rgba(124,58,237,0.2)" : "transparent",
                  color: active ? "#c4b5fd" : "rgba(240,240,248,0.45)",
                  boxShadow: active ? "0 0 0 1px rgba(124,58,237,0.35), 0 4px 16px rgba(124,58,237,0.15)" : "none",
                }}
              >
                <span style={{ fontSize: 15 }}>{tab.icon}</span>
                <span>{tab.label}</span>
                {active && (
                  <motion.div
                    layoutId="tab-indicator"
                    style={{ position: "absolute", inset: 0, borderRadius: 10, background: "rgba(124,58,237,0.08)", zIndex: -1 }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
                  />
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "16px 0 0", flexShrink: 0 }} />

      {/* Tab content */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}
          >
            {activeTab === "chat" && <AgentChat fileUrl={fileUrl} lang={lang} />}
            {activeTab === "tasks" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "0 28px" }}>
                <TaskMonitor />
              </div>
            )}
            {activeTab === "integrations" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "0 28px" }}>
                <IntegrationsPanel />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
