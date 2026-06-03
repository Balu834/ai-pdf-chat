"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePWAInstall } from "@/hooks/usePWAInstall";

const DISMISSED_KEY = "pwa-install-dismissed";

export default function InstallPopup() {
  const { isInstallable, installApp } = usePWAInstall();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isInstallable) return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    // Show after 4 seconds — enough time for the page to feel stable
    const timer = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(timer);
  }, [isInstallable]);

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem(DISMISSED_KEY, "1");
  }

  async function handleInstall() {
    setVisible(false);
    await installApp();
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 30 }}
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            width: "calc(100% - 32px)",
            maxWidth: 420,
            zIndex: 9999,
            background: "rgba(255,255,255,0.96)",
            border: "1px solid #EAEAEA",
            borderRadius: 20,
            padding: "18px 20px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            {/* Icon */}
            <div style={{
              width: 46, height: 46, borderRadius: 12, flexShrink: 0,
              background: "linear-gradient(135deg,#F59E0B,#F97316)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 14px rgba(245,158,11,0.35)",
              fontSize: 22,
            }}>
              📄
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: "#0A0A0A", letterSpacing: "-0.2px" }}>
                Install Intellixy
              </p>
              <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "#5F6368", lineHeight: 1.5 }}>
                Get faster access — chat with PDFs right from your home screen.
              </p>
            </div>

            {/* Close */}
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#9AA0A6", fontSize: 18, padding: "0 0 0 4px",
                lineHeight: 1, flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button
              onClick={dismiss}
              style={{
                flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 600,
                background: "transparent", border: "1px solid #EAEAEA",
                borderRadius: 12, color: "#5F6368", cursor: "pointer",
              }}
            >
              Not now
            </button>
            <button
              onClick={handleInstall}
              style={{
                flex: 2, padding: "10px 0", fontSize: 13, fontWeight: 800,
                background: "linear-gradient(135deg,#F59E0B,#F97316)",
                border: "none", borderRadius: 12, color: "#0A0A0A", cursor: "pointer",
                boxShadow: "0 4px 14px rgba(245,158,11,0.35)",
                letterSpacing: "-0.1px",
              }}
            >
              Install App
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
