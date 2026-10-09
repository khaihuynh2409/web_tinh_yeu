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
