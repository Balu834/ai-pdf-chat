"use client";

import { useEffect } from "react";

/**
 * Failsafe: if Supabase sends ?code= to the homepage instead of /auth/callback,
 * this component detects it and forwards the full query string to /auth/callback.
 * Runs client-side so it works even though the homepage is a Server Component.
 */
export default function AuthCodeHandler() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      // Forward entire query string (code + any other params) to the real handler
      window.location.replace(
        `/auth/callback${window.location.search}`
      );
    }
  }, []);

  return null;
}
