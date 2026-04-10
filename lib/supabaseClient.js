"use client";

import { createBrowserClient } from "@supabase/ssr";

// Singleton browser client — safe to import in any "use client" component.
// createBrowserClient stores the PKCE verifier as a cookie (NOT localStorage),
// which is critical: the server callback can read cookies but not localStorage.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
