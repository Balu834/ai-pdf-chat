"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { C } from "./tokens";

export default function CreditsDisplay({ onBuy, compact = false }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCredits = useCallback(async () => {
    try {
      const res = await fetch("/api/credits", { credentials: "include" });
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  if (loading) return null;

  const balance  = data?.credits?.balance ?? 0;
  const low      = balance <= 5;
  const empty    = balance === 0;
  const color    = empty ? "#f87171" : low ? "#f59e0b" : "#4ade80";
  const glow     = empty ? "rgba(239,68,68,0.1)" : low ? "rgba(245,158,11,0.1)" : "rgba(74,222,128,0.08)";

  if (compact) {
    return (
      <motion.button
        onClick={onBuy}
        whileHover={{ scale: 1.04, borderColor: "rgba(124,58,237,0.4)" }}
        whileTap={{ scale: 0.96 }}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: glow, border: `1px solid ${empty ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.1)"}`, borderRadius: 99, cursor: "pointer", transition: "all 0.15s" }}
      >
        <span style={{ fontSize: 13 }}>⚡</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{balance}</span>
        <span style={{ fontSize: 11, color: C.textMuted }}>credits</span>
        {(empty || low) && <span style={{ fontSize: 10, fontWeight: 700, color, marginLeft: 2 }}>+ Add</span>}
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: `linear-gradient(135deg,${glow},rgba(255,255,255,0.02))`, border: `1px solid ${empty ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)"}`, borderRadius: 16, padding: "18px 18px" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>AI Credits</span>
        <span style={{ fontSize: 20 }}>⚡</span>
      </div>
      <p style={{ fontSize: 30, fontWeight: 900, color, margin: "0 0 4px", letterSpacing: "-1px", lineHeight: 1 }}>{balance}</p>
      <p style={{ fontSize: 11, color: C.textMuted, margin: "0 0 12px" }}>
        {empty ? "No credits — buy a pack to keep chatting" : low ? "Running low — top up soon" : "Credits available"}
      </p>

      {(empty || low) && (
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={onBuy}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "linear-gradient(135deg,rgba(124,58,237,0.5),rgba(79,70,229,0.4))", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "white", cursor: "pointer" }}
        >
          ⚡ Buy Credits
        </motion.button>
      )}

      {data?.usage_30d && (
        <p style={{ fontSize: 10, color: C.textMuted, marginTop: 8 }}>
          Last 30d: {data.usage_30d.questions} questions · {data.usage_30d.total_tokens.toLocaleString()} tokens
        </p>
      )}
    </motion.div>
  );
}
