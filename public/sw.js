const CACHE_NAME = "intellixy-v2";

const PRECACHE_URLS = ["/", "/dashboard", "/manifest.json"];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: delete stale caches ────────────────────────────────────────────
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

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("razorpay.com") ||
    url.pathname.startsWith("/auth/")
  ) {
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|ico|woff2?)$/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
            return res;
          })
      )
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        return res;
      })
      .catch(() => caches.match(request))
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
      // Vibrate pattern for Android
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
        // Focus existing tab if already open
        const existing = clients.find((c) => c.url.startsWith(self.location.origin));
        if (existing) {
          existing.focus();
          existing.navigate(fullUrl);
          return;
        }
        // Otherwise open a new window
        self.clients.openWindow(fullUrl);
      })
  );
});
