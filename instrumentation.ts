/**
 * Next.js instrumentation hook — runs once on server startup (Node.js runtime).
 * Validates required environment variables and logs a clear error if any are
 * missing, so misconfiguration is obvious in Vercel function logs immediately.
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  // Only run in Node.js (not in Edge runtime or client)
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const required: Record<string, string> = {
    NEXT_PUBLIC_SUPABASE_URL:    "https://udgcixztydnkhvfurgdj.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "(your anon key)",
    SUPABASE_SERVICE_ROLE_KEY:   "(your service role key — KEEP SECRET)",
    NEXT_PUBLIC_APP_URL:         "https://intellixy.vercel.app",
  };

  const missing: string[] = [];

  for (const [key, example] of Object.entries(required)) {
    if (!process.env[key]) {
      missing.push(`  ${key}   → example: ${example}`);
    }
  }

  if (missing.length > 0) {
    console.error(
      "\n[intellixy] ❌ MISSING ENVIRONMENT VARIABLES — auth will fail:\n" +
      missing.join("\n") +
      "\n\nFix: Vercel → Project → Settings → Environment Variables\n"
    );
  } else {
    console.log(
      "[intellixy] ✓ All required environment variables are set. " +
      `Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`
    );
  }
}
