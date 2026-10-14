"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Floating flower petal component
function Petal({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="absolute pointer-events-none select-none"
      style={style}
      aria-hidden="true"
    >
      🌸
    </div>
  );
}

// Generate random petals on first render (stable via useMemo pattern)
const PETALS = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  style: {
    left: `${(i * 8.33 + 2) % 100}%`,
    top: `${(i * 11 + 5) % 90}%`,
    fontSize: `${14 + (i % 3) * 6}px`,
    opacity: 0.12 + (i % 4) * 0.06,
    animation: `float-up ${8 + (i % 4) * 2}s linear ${i * 0.5}s infinite`,
  } as React.CSSProperties,
}));

/** Inner login form - uses useSearchParams, must be inside Suspense */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError) {
      // Thông báo lỗi tiếng Việt thân thiện - không lộ chi tiết kỹ thuật
      if (authError.message.includes("Invalid login")) {
        setError("Email hoặc mật khẩu không đúng. Vui lòng thử lại.");
      } else if (authError.message.includes("Email not confirmed")) {
        setError("Tài khoản chưa được xác nhận. Hãy liên hệ để được hỗ trợ.");
      } else if (authError.message.includes("Too many requests")) {
        setError("Quá nhiều lần thử. Vui lòng đợi một lúc rồi thử lại.");
      } else {
        setError("Đăng nhập thất bại. Vui lòng thử lại sau.");
      }
      setLoading(false);
      return;
    }

    // Kiểm tra is_member sau khi đăng nhập
    // Dùng .eq('id', user.id) để lọc đúng profile của user hiện tại
    // Dùng .maybeSingle() thay .single() để tránh lỗi 406 khi RLS chặn
    const userId = authData.user?.id;
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_member")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.is_member) {
      await supabase.auth.signOut();
      setError("Tài khoản này không có quyền truy cập.");
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  return (
    <form onSubmit={handleLogin} noValidate>
      {/* Email */}
      <div className="mb-4">
        <label
          htmlFor="email"
          className="block text-sm font-semibold mb-1.5"
          style={{ color: "var(--color-text-muted)" }}
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          className="input"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Password */}
      <div className="mb-6">
        <label
          htmlFor="password"
          className="block text-sm font-semibold mb-1.5"
          style={{ color: "var(--color-text-muted)" }}
        >
          Mật khẩu
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Error message */}
      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-xl text-sm text-center"
          role="alert"
          style={{
            background: "#FDE8EE",
            color: "var(--color-primary-dark)",
            border: "1px solid var(--color-border-strong)",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Submit */}
      <button
        id="login-btn"
        type="submit"
        className="btn btn-primary w-full"
        disabled={loading || !email || !password}
        style={{ fontSize: "16px" }}
      >
        {loading ? (
          <>
            <span
              className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              style={{ animation: "spin 0.8s linear infinite" }}
              aria-hidden="true"
            />
            Đang đăng nhập...
          </>
        ) : (
          "💕 Đăng nhập"
        )}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-dvh relative flex flex-col items-center justify-center overflow-hidden px-4 py-8 pt-safe pb-safe">
      {/* Nền gradient hoa */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 20% 20%, #FDDDE6 0%, transparent 50%), " +
            "radial-gradient(ellipse at 80% 80%, #FEE8F0 0%, transparent 50%), " +
            "linear-gradient(135deg, #FFF8F9 0%, #FFF0F3 100%)",
        }}
        aria-hidden="true"
      />

      {/* Cánh hoa bay */}
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        {PETALS.map((p) => (
          <Petal key={p.id} style={p.style} />
        ))}
      </div>

      {/* Logo & Tiêu đề */}
      <div className="text-center mb-8 animate-fade-in">
        <div
          className="text-5xl mb-3"
          role="img"
          aria-label="Hoa anh đào"
          style={{ filter: "drop-shadow(0 4px 12px rgba(212,104,126,0.3))" }}
        >
          🌸
        </div>
        <h1
          className="text-3xl font-heading gradient-text"
          style={{ fontStyle: "italic" }}
        >
          Nhật Ký Tình Yêu
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
          Chỉ dành riêng cho hai ta
        </p>
      </div>

      {/* Card đăng nhập */}
      <div
        className="w-full max-w-sm glass card animate-fade-in"
        style={{
          animationDelay: "0.1s",
          padding: "28px 24px",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <h2
          className="text-xl font-heading text-center mb-6"
          style={{ fontStyle: "italic" }}
        >
          Đăng nhập
        </h2>

        {/* Wrap LoginForm (uses useSearchParams) in Suspense */}
        <Suspense
          fallback={
            <div className="py-8 text-center" style={{ color: "var(--color-text-muted)" }}>
              <div
                className="inline-block w-6 h-6 border-2 rounded-full"
                style={{
                  borderColor: "var(--color-primary-light)",
                  borderTopColor: "var(--color-primary)",
                  animation: "spin 0.8s linear infinite",
                }}
              />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
