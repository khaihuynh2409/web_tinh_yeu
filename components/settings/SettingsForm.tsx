"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateSettings } from "@/lib/actions/settings";
import { Decorations } from "@/components/decorations/Decorations";
import { useConfirm } from "@/components/ui/ConfirmDialogProvider";

interface Props {
  initialSettings: {
    name_a: string;
    name_b: string;
    start_date: string;
    theme: string;
  };
}

export function SettingsForm({ initialSettings }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [nameA, setNameA] = useState(initialSettings.name_a);
  const [nameB, setNameB] = useState(initialSettings.name_b);
  const [startDate, setStartDate] = useState(initialSettings.start_date);
  const [theme, setTheme] = useState(initialSettings.theme);

  const isDirty = 
    nameA !== initialSettings.name_a ||
    nameB !== initialSettings.name_b ||
    startDate !== initialSettings.start_date ||
    theme !== initialSettings.theme;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleBack = async () => {
    if (isDirty) {
      const confirmed = await confirm("Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn thoát?");
      if (!confirmed) return;
    }
    router.push("/explore");
  };

  const THEMES = [
    { value: "flower", label: "🌸 Hoa rơi (Mặc định)" },
    { value: "starnight", label: "✨ Đêm sao (Lấp lánh)" },
    { value: "pastel", label: "🫧 Bong bóng (Bồng bềnh)" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(false);
    setError("");

    const formData = new FormData();
    formData.append("name_a", nameA);
    formData.append("name_b", nameB);
    formData.append("start_date", startDate);
    formData.append("theme", theme);

    startTransition(async () => {
      try {
        await updateSettings(formData);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err: any) {
        setError(err.message || "Có lỗi xảy ra");
      }
    });
  }

  return (
    <>
      <style>{`body > .decorations-container { display: none !important; }`}</style>
      <Decorations theme={theme} />

      <div style={{ display: "flex", alignItems: "center", marginBottom: "2rem", position: "relative", zIndex: 10 }}>
        <button onClick={handleBack} style={{
          background: "none", border: "none",
          color: "var(--color-text)", marginRight: "1rem",
          fontSize: "1.5rem", cursor: "pointer", padding: 0
        }}>
          ←
        </button>
        <h1 style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1.75rem", fontWeight: 800,
          color: "var(--color-text)", margin: 0,
        }}>
          Cài đặt
        </h1>
      </div>

      <form onSubmit={handleSubmit} style={{
        display: "flex", flexDirection: "column", gap: "1.5rem",
        background: "var(--color-surface)", padding: "1.5rem",
        borderRadius: "20px", boxShadow: "var(--shadow-md)",
        border: "1px solid var(--color-border)",
        position: "relative", zIndex: 10
      }}>
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: "var(--color-text)" }}>
            Tên bạn nam
          </label>
          <input 
            type="text" 
            value={nameA}
            onChange={e => setNameA(e.target.value)}
            required
            style={{
              width: "100%", padding: "0.75rem", borderRadius: "12px",
              border: "2px solid var(--color-border)",
              background: "var(--color-bg)", color: "var(--color-text)",
              outline: "none"
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: "var(--color-text)" }}>
            Tên bạn nữ
          </label>
          <input 
            type="text" 
            value={nameB}
            onChange={e => setNameB(e.target.value)}
            required
            style={{
              width: "100%", padding: "0.75rem", borderRadius: "12px",
              border: "2px solid var(--color-border)",
              background: "var(--color-bg)", color: "var(--color-text)",
              outline: "none"
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: "var(--color-text)" }}>
            Ngày bắt đầu yêu
          </label>
          <input 
            type="date" 
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            required
            style={{
              width: "100%", padding: "0.75rem", borderRadius: "12px",
              border: "2px solid var(--color-border)",
              background: "var(--color-bg)", color: "var(--color-text)",
              outline: "none"
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: "var(--color-text)" }}>
            Hiệu ứng trang trí (Animations)
          </label>
          <select 
            value={theme}
            onChange={e => setTheme(e.target.value)}
            style={{
              width: "100%", padding: "0.75rem", borderRadius: "12px",
              border: "2px solid var(--color-border)",
              background: "var(--color-bg)", color: "var(--color-text)",
              outline: "none"
            }}
          >
            {THEMES.map(t => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
            Màn hình đang hiển thị hiệu ứng xem trước.
          </p>
        </div>

        {error && (
          <div style={{ color: "red", fontSize: "0.9rem" }}>{error}</div>
        )}
        
        {success && (
          <div style={{ color: "var(--color-primary-dark)", fontSize: "0.9rem", fontWeight: "bold" }}>
            Đã lưu thay đổi thành công!
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || !isDirty}
          style={{
            width: "100%", padding: "1rem", borderRadius: "12px",
            border: "none", background: "var(--color-primary)",
            color: "var(--color-text)", fontWeight: 700,
            cursor: (isPending || !isDirty) ? "not-allowed" : "pointer",
            opacity: (isPending || !isDirty) ? 0.7 : 1,
            marginTop: "1rem",
            transition: "opacity 0.2s"
          }}
        >
          {isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </form>
    </>
  );
}
