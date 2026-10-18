/**
 * Service Worker cho PWA - Chỉ cache app shell và static assets.
 * KHÔNG cache API responses, signed URLs hay dữ liệu riêng tư.
 *
 * File này được compile bởi Serwist khi build production.
 * Trong dev, service worker bị tắt (disable: NODE_ENV !== "production").
 */

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

// Khai báo global scope cho service worker context
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

// Cast self sang ServiceWorkerGlobalScope để TypeScript hiểu đúng
declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  // Chỉ cache static assets - KHÔNG cache /api/* hay Supabase URLs
  runtimeCaching: defaultCache.filter((entry) => {
    const matcherStr = entry.matcher?.toString() ?? "";
    return (
      !matcherStr.includes("/api/") && !matcherStr.includes("supabase")
    );
  }),
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }: { request: Request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

// Khi đăng xuất → xóa runtime cache để bảo mật
self.addEventListener("message", (event) => {
  const data = event.data as { type?: string } | undefined;
  if (data?.type === "LOGOUT") {
    void caches.keys().then((keys) => {
      keys.forEach((key) => {
        // Chỉ xóa runtime cache, giữ precache để app vẫn load được
        if (!key.includes("serwist-precache")) {
          void caches.delete(key);
        }
      });
    });
  }
});

// ────────────────────────────────────────────────
// Web Push: hiển thị thông báo khi có nội dung mới
// ────────────────────────────────────────────────
interface PushLikeEvent extends ExtendableEvent {
  data: { json(): unknown; text(): string } | null;
}

interface NotificationClickLikeEvent extends ExtendableEvent {
  notification: Notification;
}

self.addEventListener("push", ((event: PushLikeEvent) => {
  let payload: { title?: string; body?: string; url?: string } = {};
  try {
    payload = (event.data?.json() as typeof payload) ?? {};
  } catch {
    payload = { body: event.data?.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "Nhật Ký Tình Yêu", {
      body: payload.body || "Có điều mới dành cho bạn 💕",
      icon: "/icons/icon.svg",
      data: { url: payload.url || "/" },
    })
  );
}) as EventListener);

// Bấm vào thông báo → mở/focus app và đi tới đúng trang
self.addEventListener("notificationclick", ((event: NotificationClickLikeEvent) => {
  event.notification.close();
  const target = new URL(
    (event.notification.data as { url?: string } | undefined)?.url || "/",
    self.location.origin
  ).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of windows) {
        await client.focus();
        if ("navigate" in client) await client.navigate(target);
        return;
      }
      await self.clients.openWindow(target);
    })()
  );
}) as EventListener);
