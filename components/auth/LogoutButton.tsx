"use client";

import { useState } from "react";
import { releasePushForLogout } from "@/components/notifications/PushManager";

/**
 * Nút đăng xuất: gỡ thiết bị khỏi danh sách nhận thông báo TRƯỚC khi
 * đăng xuất, để máy không còn đăng nhập sẽ không nhận thông báo nữa.
 */
export function LogoutButton({ displayName }: { displayName?: string | null }) {
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const form = e.currentTarget;
    try {
      await Promise.race([
        releasePushForLogout(),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
    } catch {
      /* bỏ qua, vẫn đăng xuất */
    }
    form.submit();
  }

  return (
    <form action="/api/auth/signout" method="POST" onSubmit={handleSubmit}>
      <button
        type="submit"
        disabled={busy}
        style={{
          fontSize: "12px",
          fontWeight: 600,
          padding: "0.4rem 0.8rem",
          borderRadius: "999px",
          color: "var(--color-text-muted)",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          cursor: busy ? "wait" : "pointer",
          fontFamily: "var(--font-body)",
          boxShadow: "var(--shadow-sm)",
        }}
        title={displayName ? `Đăng xuất khỏi ${displayName}` : "Đăng xuất"}
      >
        Đăng xuất
      </button>
    </form>
  );
}
