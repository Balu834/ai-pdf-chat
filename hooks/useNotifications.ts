"use client";

import { useState, useEffect, useCallback } from "react";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

interface UseNotifications {
  permission: PermissionState;
  isSubscribed: boolean;
  isLoading: boolean;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return view;
}

export function useNotifications(): UseNotifications {
  const [permission, setPermission] = useState<PermissionState>("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PermissionState);

    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) setSubscription(sub);
      })
    );
  }, []);

  const enable = useCallback(async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    setIsLoading(true);

    try {
      const result = await Notification.requestPermission();
      setPermission(result as PermissionState);
      if (result !== "granted") return;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      setSubscription(sub);

      // Store in DB via API
      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
        credentials: "include",
      });

      localStorage.setItem("push-enabled", "1");
    } catch (err) {
      console.warn("[useNotifications] enable failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disable = useCallback(async () => {
    if (!subscription) return;
    setIsLoading(true);
    try {
      const json = subscription.toJSON();
      await subscription.unsubscribe();
      setSubscription(null);
      localStorage.removeItem("push-enabled");

      await fetch("/api/push/subscribe", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ endpoint: json.endpoint }),
        credentials: "include",
      });
    } catch (err) {
      console.warn("[useNotifications] disable failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [subscription]);

  return {
    permission,
    isSubscribed: !!subscription,
    isLoading,
    enable,
    disable,
  };
}
