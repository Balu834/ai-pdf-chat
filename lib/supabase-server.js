import { getAdminClient } from "@/lib/admin-client";

// Kept for any legacy imports — delegates to the singleton getter.
export const supabaseAdmin = new Proxy({}, {
  get(_, prop) {
    return getAdminClient()[prop];
  },
});
