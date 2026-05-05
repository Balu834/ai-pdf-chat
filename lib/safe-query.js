/**
 * safeQuery — wraps any Supabase query builder call so it never throws.
 *
 * Usage:
 *   const { data, error } = await safeQuery(() =>
 *     getAdminClient().from("users").select("*").eq("id", userId).maybeSingle()
 *   );
 *
 * Returns { data: null, error: Error } on unexpected throws (network, env var
 * missing, etc.) so callers always get the same { data, error } shape.
 */
export async function safeQuery(queryFn, fallback = null) {
  try {
    const result = await queryFn();
    return result;
  } catch (err) {
    console.error("[safeQuery] unexpected throw:", err?.message ?? err);
    return { data: fallback, error: err };
  }
}

/**
 * safeJson — wraps a Next.js Route Handler so every unhandled exception
 * returns a clean 500 JSON instead of crashing the serverless function.
 *
 * Usage (in route.js):
 *   export const GET = safeJson(async (req) => {
 *     ...
 *     return NextResponse.json({ ok: true });
 *   });
 */
export function safeJson(handler, { status = 500, message = "Internal server error" } = {}) {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error("[safeJson]", err?.message ?? err);
      const { NextResponse } = await import("next/server");
      return NextResponse.json({ error: message }, { status });
    }
  };
}
