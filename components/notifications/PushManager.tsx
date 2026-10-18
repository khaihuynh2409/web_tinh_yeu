"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const DISABLED_KEY = "push-disabled";
const PROMPT_DISMISSED_KEY = "push-prompt-dismissed";

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────
function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string, value: boolean) {
  try {
    if (value) localStorage.setItem(key, "1");
    else localStorage.removeItem(key);
  } catch {
    /* localStorage có thể bị chặn */
  }
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const buffer = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Service worker chỉ được đăng ký ở bản production → chờ tối đa vài giây */
async function getReadyRegistration(timeoutMs = 5000) {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}

async function saveSubscription(sub: PushSubscription) {
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub.toJSON()),
  });
  return res.ok;
}

async function getOrCreateSubscription(
  reg: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;

  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapid) return null;
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapid),
  });
}

export type EnableResult =
  | { ok: true }
  | { ok: false; reason: "unsupported" | "no-key" | "denied" | "no-sw" | "server" };

/** Xin quyền + đăng ký thiết bị này nhận thông báo (phải gọi từ thao tác bấm) */
export async function enablePush(): Promise<EnableResult> {
  if (!isPushSupported()) return { ok: false, reason: "unsupported" };
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return { ok: false, reason: "no-key" };

  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;
  if (permission !== "granted") return { ok: false, reason: "denied" };

  const reg = await getReadyRegistration();
  if (!reg) return { ok: false, reason: "no-sw" };

  try {
    const sub = await getOrCreateSubscription(reg);
    if (!sub) return { ok: false, reason: "no-key" };
    if (!(await saveSubscription(sub))) return { ok: false, reason: "server" };
  } catch {
    return { ok: false, reason: "server" };
  }

  writeFlag(DISABLED_KEY, false);
  return { ok: true };
}

/** Gỡ thiết bị này khỏi server + huỷ đăng ký push trên trình duyệt */
async function detachSubscription() {
  if (!isPushSupported()) return;
  const reg = await getReadyRegistration(2000);
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  try {
    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
  } catch {
    /* offline: vẫn huỷ đăng ký cục bộ */
  }
  await sub.unsubscribe().catch(() => undefined);
}

/** Người dùng chủ động tắt thông báo → nhớ lại để không tự bật lại */
export async function disablePush() {
  writeFlag(DISABLED_KEY, true);
  await detachSubscription();
}

/** Khi đăng xuất: gỡ thiết bị nhưng KHÔNG đánh dấu tắt (đăng nhập lại sẽ tự bật) */
export async function releasePushForLogout() {
  await detachSubscription();
}

// ────────────────────────────────────────────────
// Tự đồng bộ thiết bị với tài khoản đang đăng nhập
// ────────────────────────────────────────────────
export function PushSync() {
  const pathname = usePathname();
  const synced = useRef(false);

  useEffect(() => {
    if (pathname.startsWith("/login") || pathname.startsWith("/offline")) {
      synced.current = false; // đăng nhập xong sẽ đồng bộ lại cho tài khoản mới
      return;
    }
    if (synced.current) return;
    if (!isPushSupported() || Notification.permission !== "granted") return;
    if (readFlag(DISABLED_KEY)) return;

    synced.current = true;
    (async () => {
      try {
        const reg = await getReadyRegistration();
        if (!reg) return;
        const sub = await getOrCreateSubscription(reg);
        if (sub) await saveSubscription(sub);
      } catch {
        synced.current = false;
      }
    })();
  }, [pathname]);

  return null;
}

// ────────────────────────────────────────────────
// Thẻ bật/tắt thông báo (dùng trong Cài đặt)
// ────────────────────────────────────────────────
type Status = "loading" | "unsupported" | "denied" | "off" | "on";

const ERROR_TEXT: Record<string, string> = {
  denied: "Bạn chưa cho phép thông báo. Hãy cấp quyền trong cài đặt trình duyệt.",
  "no-key": "Chưa cấu hình khóa VAPID trên server (xem README mục Thông báo).",
  "no-sw": "Service worker chưa sẵn sàng. Thông báo chỉ hoạt động ở bản production (npm run build).",
  server: "Không thể lưu thiết bị. Thử lại sau nhé.",
  unsupported: "Trình duyệt này chưa hỗ trợ thông báo.",
};

export function NotificationToggle() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isPushSupported()) return !cancelled && setStatus("unsupported");
      if (Notification.permission === "denied") return !cancelled && setStatus("denied");
      if (Notification.permission !== "granted" || readFlag(DISABLED_KEY)) {
        return !cancelled && setStatus("off");
      }
      const reg = await getReadyRegistration(2000);
      const sub = await reg?.pushManager.getSubscription();
      if (!cancelled) setStatus(sub ? "on" : "off");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleToggle() {
    setBusy(true);
    setMessage(null);
    if (status === "on") {
      await disablePush();
      setStatus("off");
    } else {
      const res = await enablePush();
      if (res.ok) setStatus("on");
      else {
        setMessage(ERROR_TEXT[res.reason]);
        if (res.reason === "denied" && Notification.permission === "denied") setStatus("denied");
      }
    }
    setBusy(false);
  }

  async function handleTest() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      setMessage(res.ok ? "Đã gửi thông báo thử, kiểm tra thiết bị của bạn nhé!" : "Gửi thử thất bại.");
    } catch {
      setMessage("Gửi thử thất bại.");
    }
    setBusy(false);
  }

  const isIos =
    typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <section
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "16px",
        padding: "1.25rem",
        boxShadow: "var(--shadow-sm)",
        marginTop: "1.5rem",
      }}
    >
      <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.05rem", color: "var(--color-text)" }}>
        🔔 Thông báo
      </h3>
      <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
        Nhận thông báo trên thiết bị này khi người ấy thêm kỷ niệm, thành tích, thư mới...
      </p>

      {status === "unsupported" && (
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          {ERROR_TEXT.unsupported}
          {isIos && " Trên iPhone/iPad (iOS 16.4+), hãy bấm Chia sẻ → “Thêm vào Màn hình chính” rồi mở ứng dụng từ đó."}
        </p>
      )}

      {status === "denied" && (
        <p style={{ margin: 0, fontSize: "0.85rem", color: "#991B1B" }}>{ERROR_TEXT.denied}</p>
      )}

      {(status === "on" || status === "off") && (
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleToggle}
            disabled={busy}
            style={{
              padding: "0.65rem 1.25rem",
              borderRadius: "10px",
              border: status === "on" ? "1px solid var(--color-border-strong)" : "none",
              background: status === "on" ? "transparent" : "var(--color-primary)",
              color: "var(--color-text)",
              fontWeight: 700,
              cursor: busy ? "wait" : "pointer",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {status === "on" ? "Tắt thông báo" : "Bật thông báo"}
          </button>
          {status === "on" && (
            <button
              type="button"
              onClick={handleTest}
              disabled={busy}
              style={{
                padding: "0.65rem 1.25rem",
                borderRadius: "10px",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg)",
                color: "var(--color-text)",
                fontWeight: 600,
                cursor: busy ? "wait" : "pointer",
              }}
            >
              Gửi thử
            </button>
          )}
        </div>
      )}

      {message && (
        <p style={{ margin: "0.75rem 0 0", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
          {message}
        </p>
      )}
    </section>
  );
}

// ────────────────────────────────────────────────
// Banner mời bật thông báo (trang chủ)
// ────────────────────────────────────────────────
export function NotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    if (Notification.permission !== "default") return;
    if (readFlag(PROMPT_DISMISSED_KEY)) return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  async function handleEnable() {
    setBusy(true);
    await enablePush();
    setVisible(false);
  }

  function handleDismiss() {
    writeFlag(PROMPT_DISMISSED_KEY, true);
    setVisible(false);
  }

  return (
    <div
      role="region"
      aria-label="Bật thông báo"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        flexWrap: "wrap",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "16px",
        padding: "0.85rem 1rem",
        boxShadow: "var(--shadow-sm)",
        marginBottom: "1.5rem",
      }}
    >
      <span style={{ fontSize: "1.4rem" }}>🔔</span>
      <p style={{ flex: 1, minWidth: 180, margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
        Bật thông báo để không bỏ lỡ kỷ niệm, thành tích và thư mới của người ấy.
      </p>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            padding: "0.4rem 0.8rem",
            borderRadius: "999px",
            border: "1px solid var(--color-border)",
            background: "transparent",
            color: "var(--color-text-muted)",
            fontSize: "0.8rem",
            cursor: "pointer",
          }}
        >
          Để sau
        </button>
        <button
          type="button"
          onClick={handleEnable}
          disabled={busy}
          style={{
            padding: "0.4rem 1rem",
            borderRadius: "999px",
            border: "none",
            background: "var(--color-primary)",
            color: "var(--color-text)",
            fontSize: "0.8rem",
            fontWeight: 700,
            cursor: busy ? "wait" : "pointer",
          }}
        >
          Bật
        </button>
      </div>
    </div>
  );
}
