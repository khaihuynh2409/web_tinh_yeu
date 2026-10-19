"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAchievement, deleteAchievement } from "@/lib/actions/achievements";
import { useConfirm } from "@/components/ui/ConfirmDialogProvider";
import { formatVietnameseDate } from "@/lib/utils/date";

interface Achievement {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  achieved_at: string;
}

const ICONS = ["🏆", "🎉", "💖", "✈️", "🏠", "🎓", "💍", "🍽️", "🎬", "📚", "💪", "🌟"];

const inputStyle = {
  width: "100%", padding: "0.75rem", borderRadius: "8px",
  border: "1px solid var(--color-border)", marginBottom: "0.75rem",
  background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "inherit",
} as const;

export function AchievementList({ achievements }: { achievements: Achievement[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [icon, setIcon] = useState(ICONS[0]);
  const today = new Date().toISOString().split("T")[0];

  function handleAdd(formData: FormData) {
    setError(null);
    formData.set("icon", icon);
    startTransition(async () => {
      const res = await createAchievement(formData);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  async function handleDelete(id: string) {
    if (!(await confirm("Xóa thành tích này?"))) return;
    startTransition(async () => {
      const res = await deleteAchievement(id);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div>
      {error && (
        <div style={{ padding: "0.75rem", background: "#FEE2E2", color: "#991B1B", borderRadius: "12px", marginBottom: "1rem", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      <form action={handleAdd} style={{
        background: "var(--color-surface)", padding: "1.25rem", borderRadius: "16px",
        border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)", marginBottom: "2rem",
      }}>
        <h3 style={{ fontSize: "1rem", margin: "0 0 1rem", color: "var(--color-text)" }}>Thêm thành tích mới</h3>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
          {ICONS.map((i) => (
            <button
              key={i} type="button" onClick={() => setIcon(i)} aria-label={`Biểu tượng ${i}`}
              style={{
                width: 40, height: 40, borderRadius: "12px", fontSize: "1.25rem", cursor: "pointer",
                border: icon === i ? "2px solid var(--color-primary-dark)" : "1px solid var(--color-border)",
                background: icon === i ? "var(--color-primary)" : "var(--color-bg)",
              }}
            >
              {i}
            </button>
          ))}
        </div>

        <input
          type="text" name="title" required
          placeholder="Tên thành tích (VD: Cùng nhau chạy 5km)"
          style={inputStyle}
        />
        <textarea
          name="description" rows={2} placeholder="Ghi chú thêm (không bắt buộc)"
          style={{ ...inputStyle, resize: "none" }}
        />
        <label style={{ display: "block", fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
          Ngày đạt được
        </label>
        <input type="date" name="achieved_at" defaultValue={today} required style={{ ...inputStyle, marginBottom: "1rem" }} />

        <button
          type="submit" disabled={isPending}
          style={{
            width: "100%", padding: "0.75rem", borderRadius: "8px", border: "none",
            background: "var(--color-primary)", color: "var(--color-text)", fontWeight: 700,
            cursor: isPending ? "wait" : "pointer", opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending ? "Đang lưu..." : "Thêm thành tích"}
        </button>
      </form>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {achievements.map((a) => (
          <div key={a.id} style={{
            background: "var(--color-surface)", padding: "1rem", borderRadius: "16px",
            border: "1px solid var(--color-border)", display: "flex", alignItems: "flex-start", gap: "1rem",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: "16px", flexShrink: 0, fontSize: "1.6rem",
              background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {a.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ margin: "0 0 0.25rem", fontSize: "1.05rem", color: "var(--color-text)" }}>{a.title}</h4>
              {a.description && (
                <p style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", color: "var(--color-text-muted)", whiteSpace: "pre-wrap" }}>
                  {a.description}
                </p>
              )}
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-primary-dark)", fontWeight: 600 }}>
                {formatVietnameseDate(a.achieved_at)}
              </p>
            </div>
            <button
              onClick={() => handleDelete(a.id)} title="Xóa"
              style={{ background: "none", border: "none", color: "var(--color-text-light)", fontSize: "1.2rem", cursor: "pointer", padding: "4px" }}
            >
              ×
            </button>
          </div>
        ))}
        {achievements.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "2rem 0" }}>
            Chưa có thành tích nào. Hãy ghi lại điều hai đứa đã cùng nhau đạt được nhé!
          </p>
        )}
      </div>
    </div>
  );
}
