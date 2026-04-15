"use client";

import { motion } from "framer-motion";
import { C } from "./tokens";
import { LogoutIcon } from "./icons";

export default function SettingsView({ user, onSignOut }) {
  const email    = user?.email || "";
  const initial  = email.charAt(0).toUpperCase();
  const provider = user?.app_metadata?.provider || "email";
  const joined   = user?.created_at ? new Date(user.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—";

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 28px 40px", maxWidth: 560 }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Account</p>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: C.textPrimary, margin: 0, letterSpacing: "-0.5px" }}>Settings</h1>
      </div>

      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 20, padding: "22px", marginBottom: 14 }}
      >
        <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px" }}>Profile</p>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "white", flexShrink: 0 }}>{initial}</div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary, margin: "0 0 3px" }}>{email}</p>
            <p style={{ fontSize: 12, color: C.textMuted, margin: 0, textTransform: "capitalize" }}>Signed in via {provider}</p>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "Email", value: email },
            { label: "Account created", value: joined },
            { label: "Auth provider", value: provider.charAt(0).toUpperCase() + provider.slice(1) },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10 }}>
              <span style={{ fontSize: 12, color: C.textMuted }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary }}>{value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Sign out */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.14)", borderRadius: 20, padding: "22px" }}
      >
        <p style={{ fontSize: 11, fontWeight: 700, color: "#f87171", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>Session</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, margin: "0 0 3px" }}>Sign out</p>
            <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>End your current session</p>
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} onClick={onSignOut}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.22)", borderRadius: 10, fontSize: 12, fontWeight: 600, color: "#f87171", cursor: "pointer" }}>
            <LogoutIcon /> Sign Out
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
