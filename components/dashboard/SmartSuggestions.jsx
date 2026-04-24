"use client";

import { motion, AnimatePresence } from "framer-motion";
import { C } from "./tokens";

/* Skeleton placeholder while suggestions are loading */
function SuggestionSkeleton() {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {[100, 130, 110].map((w, i) => (
        <div
          key={i}
          style={{
            height: 28,
            width: w,
            borderRadius: 99,
            background: "rgba(124,58,237,0.06)",
            border: "1px solid rgba(124,58,237,0.12)",
            animation: "shimmer 1.6s ease-in-out infinite",
            backgroundImage: "linear-gradient(90deg,transparent 25%,rgba(124,58,237,0.08) 50%,transparent 75%)",
            backgroundSize: "200% 100%",
          }}
        />
      ))}
    </div>
  );
}

export default function SmartSuggestions({ suggestions, loading, onSelect }) {
  const visible = loading || suggestions?.length > 0;
  if (!visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="suggestions"
          initial={{ opacity: 0, y: 6, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{ overflow: "hidden", maxWidth: 740, margin: "0 auto", paddingBottom: 6 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: "rgba(167,139,250,0.5)",
              textTransform: "uppercase", letterSpacing: "0.08em",
              whiteSpace: "nowrap", flexShrink: 0,
            }}>
              Ask next →
            </span>

            {loading ? (
              <SuggestionSkeleton />
            ) : (
              suggestions.map((text, i) => (
                <motion.button
                  key={text}
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06, duration: 0.18 }}
                  whileHover={{ scale: 1.04, backgroundColor: "rgba(124,58,237,0.14)", borderColor: "rgba(124,58,237,0.35)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelect(text)}
                  style={{
                    padding: "5px 13px",
                    background: "rgba(124,58,237,0.07)",
                    border: "1px solid rgba(124,58,237,0.2)",
                    borderRadius: 99,
                    fontSize: 12,
                    fontWeight: 500,
                    color: C.accentLight,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    backdropFilter: "blur(8px)",
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                >
                  {text}
                </motion.button>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
