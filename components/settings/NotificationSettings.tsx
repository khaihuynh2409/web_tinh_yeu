"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getPushStatus,
  removePushSubscription,
  savePushSubscription,
  sendTestPush,
} from "@/lib/actions/push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function NotificationSettings() {
  const [isPending, startTransition] = useTransition();
  const [supported, setSupported] = useState(true);
  const [needInstall, setNeedInstall] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function init() {
      // iOS chỉ hỗ trợ Web Push khi đã "Thêm vào Màn hình chính"
      if (isIos() && !isStandalone()) {
        setNeedInstall(true);
        return;
      }
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setSupported(false);
        return;
      }
      const status = await getPushStatus();
      setConfigured(status.configured && !!VAPID_PUBLIC_KEY);
      const reg = await navigator.serviceWorker.getRegistration();
      setEnabled(!!(await reg?.pushManager.getSubscription()));
    }
    void init();
  }, []);

  function enable() {
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setError("Bạn chưa cho phép thông báo. Hãy bật quyền thông báo trong cài đặt trình duyệt.");
          return;
        }
        const reg = await navigator.serviceWorker.ready;
        const sub =
          (await reg.pushManager.getSubscription()) ??
          (await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          }));
        const json = sub.toJSON();
        const res = await savePushSubscription({
          endpoint: sub.endpoint,
          p256dh: json.keys?.p256dh ?? "",
          auth: json.keys?.auth ?? "",
        });
        if (res.error) {
          await sub.unsubscribe();
          setError(res.error);
          return;
        }
        setEnabled(true);
        setMessage("Đã bật thông báo trên thiết bị này!");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Không thể bật thông báo");
      }
    });
  }

  function disable() {
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        if (sub) {
          await removePushSubscription(sub.endpoint);
          await sub.unsubscribe();
        }
        setEnabled(false);
        setMessage("Đã tắt thông báo trên thiết bị này.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Không thể tắt thông báo");
      }
    });
  }

  function test() {
    setError("");
    setMessage("");
    startTransition(async () => {
      const res = await sendTestPush();
      if (res.error) setError(res.error);
      else setMessage("Đã gửi thông báo thử, chờ chút nhé!");
    });
  }

  let hint = "";
  if (needInstall) {
    hint = "Trên iPhone, hãy bấm Chia sẻ → “Thêm vào Màn hình chính”, rồi mở app từ biểu tượng đó để bật thông báo.";
  } else if (!supported) {
    hint = "Trình duyệt này không hỗ trợ thông báo.";
  } else if (!configured) {
    hint = "Chưa cấu hình khóa VAPID trên server (xem README mục Thông báo).";
  }

  const btn = {
    padding: "0.75rem 1rem", borderRadius: "12px", border: "none",
    fontWeight: 700, cursor: "pointer", color: "white",
  } as const;

  return (
    <section style={{
      marginTop: "1.5rem", background: "var(--color-surface)", padding: "1.5rem",
      borderRadius: "20px", boxShadow: "var(--shadow-md)",
      border: "1px solid var(--color-border)", position: "relative", zIndex: 10,
    }}>
      <h2 style={{ margin: "0 0 0.5rem", color: "var(--color-text)", fontSize: "1.2rem" }}>
        🔔 Thông báo
      </h2>
      <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: "0 0 1rem" }}>
        Nhận thông báo khi nửa kia gửi thư hoặc thêm kỷ niệm mới.
      </p>

      {hint ? (
        <p style={{ fontSize: "0.9rem", color: "var(--color-text)", margin: 0 }}>{hint}</p>
      ) : (
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {enabled ? (
            <>
              <button onClick={disable} disabled={isPending}
                style={{ ...btn, background: "var(--color-text-muted)" }}>
                Tắt thông báo
              </button>
              <button onClick={test} disabled={isPending}
                style={{ ...btn, background: "var(--color-primary-dark)" }}>
                Gửi thử
              </button>
            </>
          ) : (
            <button onClick={enable} disabled={isPending}
              style={{ ...btn, background: "var(--color-primary-dark)" }}>
              {isPending ? "Đang xử lý..." : "Bật thông báo"}
            </button>
          )}
        </div>
      )}

      {error && <div style={{ color: "red", fontSize: "0.9rem", marginTop: "0.75rem" }}>{error}</div>}
      {message && (
        <div style={{ color: "var(--color-primary-dark)", fontSize: "0.9rem", fontWeight: "bold", marginTop: "0.75rem" }}>
          {message}
        </div>
      )}
    </section>
  );
}
