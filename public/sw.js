const CACHE_NAME = "intellixy-v4";

// Only pre-cache truly static resources that never change URL.
const PRECACHE_URLS = ["/manifest.json"];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: delete all stale caches ───────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function isStaticAsset(url) {
  // /_next/static/ URLs include content hashes — safe to cache indefinitely.
  // Font and image files are also immutable once deployed.
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|ico|woff2?)$/)
  );
}

function isNavigationRequest(request) {
  return request.mode === "navigate";
}

function shouldSkip(request, url) {
  return (
    request.method !== "GET" ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("razorpay.com") ||
    url.hostname.includes("vercel.com") ||
    url.hostname.includes("vercel-insights.com")
  );
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Pass through: non-GET, API calls, auth, external services.
  if (shouldSkip(request, url)) return;

  // ── Static assets (cache-first, content-hashed URLs — safe to cache forever) ─
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(request, clone));
            }
            return res;
          })
          .catch(() =>
            // Offline and not cached — return an empty 503 so the SW doesn't
            // crash. The browser will show a broken image/missing asset rather
            // than a hard service-worker error.
            new Response("", { status: 503, statusText: "Offline" })
          );
      })
    );
    return;
  }

  // ── Navigation (HTML pages) — ALWAYS network-first, NEVER cache the response.
  //
  //    WHY: Next.js inlines `<link rel="preload">` tags whose hrefs point to
  //    the current build's chunk hashes. If the service worker caches this HTML
  //    and serves it after a new deploy, the browser preloads chunks from the
  //    OLD build that no longer exist — causing hundreds of "preloaded but not
  //    used" warnings and broken navigations.
  //
  //    Offline fallback: return the last cached page the user visited so the
  //    app still opens without a connection.
  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        // Last-resort offline shell — serve the cached homepage.
        return (
          (await caches.match("/")) ??
          new Response("You are offline.", {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "text/plain" },
          })
        );
      })
    );
    return;
  }

  // ── Everything else (non-navigation non-static GETs) — network-only.
  //    Fallback to cache if the network fails, and to a 503 Response if the
  //    cache has nothing — so event.respondWith() always receives a Response,
  //    never undefined (which throws "Failed to convert value to 'Response'").
  event.respondWith(
    fetch(request).catch(async () => {
      const cached = await caches.match(request);
      return (
        cached ??
        new Response(JSON.stringify({ error: "Offline" }), {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "application/json" },
        })
      );
    })
  );
});

// ── Push: receive notification from server ────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = { title: "Intellixy", body: "You have a new notification", url: "/dashboard" };
  try {
    payload = { ...payload, ...event.data.json() };
  } catch {
    payload.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body:    payload.body,
      icon:    "/api/pwa-icon?size=192",
      badge:   "/api/pwa-icon?size=96",
      tag:     payload.tag || "intellixy",
      data:    { url: payload.url || "/dashboard" },
      actions: [{ action: "open", title: "Open app" }],
      vibrate: [100, 50, 100],
    })
  );
});

// ── Notification click: focus or open the app ─────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/dashboard";
  const fullUrl   = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.startsWith(self.location.origin));
        if (existing) {
          existing.focus();
          existing.navigate(fullUrl);
          return;
        }
        self.clients.openWindow(fullUrl);
      })
  );
});
