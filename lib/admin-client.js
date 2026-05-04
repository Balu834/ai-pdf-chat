import { createClient } from "@supabase/supabase-js";

let _adminClient = null;

/**
 * Returns a singleton Supabase admin client (service-role key).
 * Call this inside route handlers, never at module scope — if the env vars
 * are missing the error is thrown at call time, not at module load time,
 * so it returns a clean 500 instead of crashing the entire Vercel function.
 */
export function getAdminClient() {
  if (_adminClient) return _adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "[admin-client] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. " +
      "Add these to your Vercel environment variables and redeploy."
    );
  }

  _adminClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return _adminClient;
}
