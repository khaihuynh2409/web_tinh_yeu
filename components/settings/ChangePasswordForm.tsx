"use client";

import { useState, useTransition } from "react";
import { changePassword } from "@/lib/actions/settings";

export function ChangePasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Kiểm tra độ mạnh mật khẩu
  const strength =
    newPassword.length === 0
      ? null
      : newPassword.length < 6
      ? "weak"
      : newPassword.length < 10
      ? "medium"
      : "strong";

  const strengthLabel: Record<string, string> = {
    weak: "Yếu",
    medium: "Trung bình",
    strong: "Mạnh",
  };
  const strengthColor: Record<string, string> = {
    weak: "#ef4444",
    medium: "#f59e0b",
    strong: "#22c55e",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    startTransition(async () => {
      const result = await changePassword(currentPassword, newPassword);
      if (result.success) {
        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(result.error || "Có lỗi xảy ra.");
      }
    });
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "12px",
    border: "2px solid var(--color-border)",
    background: "var(--color-bg)",
    color: "var(--color-text)",
    outline: "none",
    fontSize: "1rem",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "0.5rem",
    fontWeight: 600,
    color: "var(--color-text)",
    fontSize: "0.9rem",
  };

  return (
    <div
      style={{
        marginTop: "1.5rem",
        background: "var(--color-surface)",
        padding: "1.5rem",
        borderRadius: "20px",
        boxShadow: "var(--shadow-md)",
        border: "1px solid var(--color-border)",
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
        <span style={{ fontSize: "1.3rem" }}>🔑</span>
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.15rem",
            fontWeight: 700,
            color: "var(--color-text)",
            margin: 0,
          }}
        >
          Đổi mật khẩu
        </h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Mật khẩu hiện tại */}
        <div>
          <label htmlFor="current-pw" style={labelStyle}>
            Mật khẩu hiện tại
          </label>
          <input
            id="current-pw"
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isPending}
            placeholder="••••••••"
            style={inputStyle}
          />
        </div>

        {/* Mật khẩu mới */}
        <div>
          <label htmlFor="new-pw" style={labelStyle}>
            Mật khẩu mới
          </label>
          <input
            id="new-pw"
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isPending}
            placeholder="Ít nhất 6 ký tự"
            style={inputStyle}
          />
          {/* Thanh độ mạnh mật khẩu */}
          {strength && (
            <div style={{ marginTop: "0.4rem" }}>
              <div
                style={{
                  height: "4px",
                  borderRadius: "2px",
                  background: "var(--color-border)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: strength === "weak" ? "33%" : strength === "medium" ? "66%" : "100%",
                    background: strengthColor[strength],
                    transition: "width 0.3s, background 0.3s",
                    borderRadius: "2px",
                  }}
                />
              </div>
              <p style={{ fontSize: "0.75rem", color: strengthColor[strength], marginTop: "0.25rem", fontWeight: 600 }}>
                Độ mạnh: {strengthLabel[strength]}
              </p>
            </div>
          )}
        </div>

        {/* Xác nhận mật khẩu mới */}
        <div>
          <label htmlFor="confirm-pw" style={labelStyle}>
            Xác nhận mật khẩu mới
          </label>
          <input
            id="confirm-pw"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isPending}
            placeholder="Nhập lại mật khẩu mới"
            style={{
              ...inputStyle,
              borderColor:
                confirmPassword && confirmPassword !== newPassword
                  ? "#ef4444"
                  : confirmPassword && confirmPassword === newPassword
                  ? "#22c55e"
                  : "var(--color-border)",
            }}
          />
          {confirmPassword && confirmPassword !== newPassword && (
            <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "0.25rem" }}>
              Mật khẩu không khớp
            </p>
          )}
          {confirmPassword && confirmPassword === newPassword && (
            <p style={{ fontSize: "0.75rem", color: "#22c55e", marginTop: "0.25rem" }}>
              ✓ Mật khẩu khớp
            </p>
          )}
        </div>

        {/* Thông báo lỗi */}
        {error && (
          <div
            role="alert"
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "10px",
              background: "#FDE8EE",
              color: "var(--color-primary-dark)",
              fontSize: "0.875rem",
              border: "1px solid var(--color-border-strong)",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Thông báo thành công */}
        {success && (
          <div
            role="status"
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "10px",
              background: "#dcfce7",
              color: "#166534",
              fontSize: "0.875rem",
              fontWeight: 600,
              border: "1px solid #bbf7d0",
            }}
          >
            ✅ Đổi mật khẩu thành công! Hãy dùng mật khẩu mới cho lần đăng nhập tới.
          </div>
        )}

        {/* Nút submit */}
        <button
          type="submit"
          disabled={
            isPending ||
            !currentPassword ||
            !newPassword ||
            !confirmPassword ||
            newPassword !== confirmPassword ||
            newPassword.length < 6
          }
          style={{
            width: "100%",
            padding: "0.875rem",
            borderRadius: "12px",
            border: "none",
            background: "var(--color-primary)",
            color: "var(--color-text)",
            fontWeight: 700,
            fontSize: "1rem",
            cursor:
              isPending ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword ||
              newPassword !== confirmPassword ||
              newPassword.length < 6
                ? "not-allowed"
                : "pointer",
            opacity:
              isPending ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword ||
              newPassword !== confirmPassword ||
              newPassword.length < 6
                ? 0.6
                : 1,
            transition: "opacity 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          {isPending ? (
            <>
              <span
                style={{
                  display: "inline-block",
                  width: "16px",
                  height: "16px",
                  border: "2px solid currentColor",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Đang đổi mật khẩu...
            </>
          ) : (
            "🔐 Đổi mật khẩu"
          )}
        </button>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
