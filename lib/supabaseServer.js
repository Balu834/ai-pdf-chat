import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ─────────────────────────────────────────────────────────────────────────────
// SERVER COMPONENT client — for use in Server Components and layout.js ONLY.
//
// ❌ DO NOT use this in Route Handlers (app/api/**).
//    Route handlers must own the Response object, so they must create their
//    own supabase client with request.cookies / response.cookies directly.
//    See app/auth/callback/route.js for the correct route-handler pattern.
//
// ✅ Safe to use in:
//    - app/**/page.js   (Server Component)
//    - app/**/layout.js (Server Component)
//    - Server Actions
// ─────────────────────────────────────────────────────────────────────────────
export async function createServerSupabase() {
  // cookies() is async in Next.js 15 — always await it.
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        // @supabase/ssr ≥ 0.5 requires getAll / setAll (not get / set / remove)
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll throws in read-only contexts (e.g. during a render).
            // The middleware handles token refresh, so this is safe to ignore.
          }
        },
      },
    }
  );
}
