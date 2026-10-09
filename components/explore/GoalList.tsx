"use client";

import { useState, useTransition } from "react";

import { createGoal, toggleGoal, deleteGoal } from "@/lib/actions/goals";
import { useConfirm } from "@/components/ui/ConfirmDialogProvider";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  done: boolean;
  done_by: string | null;
  created_at: string;
  profiles?: { display_name: string } | null;
}

interface Props {
  initialGoals: Goal[];
  currentUserId: string;
}

export function GoalList({ initialGoals, currentUserId }: Props) {
  const [isPending, startTransition] = useTransition();
  const confirm = useConfirm();
  const [error, setError] = useState<string | null>(null);
  
  // Optimistic UI state
  const [optimisticGoals, setOptimisticGoals] = useState<Goal[]>(initialGoals);

  // Sync when initialGoals change
  if (initialGoals !== optimisticGoals && !isPending) {
    setOptimisticGoals(initialGoals);
  }

  async function handleAdd(formData: FormData) {
    setError(null);
    const title = formData.get("title") as string;
    const desc = formData.get("description") as string;
    if (!title.trim()) return;

    // Optional: Optimistic add logic could go here, but simple wait is fine for adding.
    startTransition(async () => {
      const res = await createGoal(formData);
      if (res?.error) setError(res.error);
    });
  }

  function handleToggle(id: string, currentDone: boolean) {
    const nextDone = !currentDone;
    
    // Optimistic update
    setOptimisticGoals(prev => prev.map(g => 
      g.id === id ? { ...g, done: nextDone } : g
    ));

    startTransition(async () => {
      const res = await toggleGoal(id, nextDone);
      if (res?.error) setError(res.error);
    });
  }

  async function handleDelete(id: string) {
    const confirmed = await confirm("Xóa mục tiêu này?");
    if (!confirmed) return;
    
    // Optimistic update
    setOptimisticGoals(prev => prev.filter(g => g.id !== id));

    startTransition(async () => {
      const res = await deleteGoal(id);
      if (res?.error) setError(res.error);
    });
  }

  const doneCount = optimisticGoals.filter(g => g.done).length;
  const totalCount = optimisticGoals.length;
  const progress = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  return (
    <div>
      {error && (
        <div style={{ padding: "0.75rem", background: "#FEE2E2", color: "#991B1B", borderRadius: "12px", marginBottom: "1rem", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {/* Progress Bar */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-primary-dark)" }}>
          <span>Tiến độ hoàn thành</span>
          <span>{progress}%</span>
        </div>
        <div style={{ height: 8, background: "var(--color-border)", borderRadius: "4px", overflow: "hidden" }}>
          <div style={{ 
            height: "100%", 
            background: "var(--color-primary)", 
            width: `${progress}%`,
            transition: "width 0.3s ease" 
          }} />
        </div>
      </div>

      {/* Add Form */}
      <form action={handleAdd} style={{
        background: "var(--color-surface)",
        padding: "1.25rem",
        borderRadius: "16px",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-sm)",
        marginBottom: "2rem",
      }}>
        <h3 style={{ fontSize: "1rem", margin: "0 0 1rem", color: "var(--color-text)" }}>Thêm mục tiêu mới</h3>
        <input 
          type="text" 
          name="title" 
          placeholder="Tên mục tiêu (VD: Đi du lịch Đà Lạt)"
          required
          style={{
            width: "100%", padding: "0.75rem", borderRadius: "8px", 
            border: "1px solid var(--color-border)", marginBottom: "0.75rem",
            background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "inherit"
          }}
        />
        <textarea 
          name="description" 
          placeholder="Ghi chú thêm (không bắt buộc)"
          rows={2}
          style={{
            width: "100%", padding: "0.75rem", borderRadius: "8px", 
            border: "1px solid var(--color-border)", marginBottom: "1rem",
            background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "inherit", resize: "none"
          }}
        />
        <button 
          type="submit" 
          disabled={isPending}
          style={{
            width: "100%", padding: "0.75rem", borderRadius: "8px", 
            border: "none", background: "var(--color-primary)", color: "var(--color-text)",
            fontWeight: 700, cursor: isPending ? "wait" : "pointer", opacity: isPending ? 0.7 : 1
          }}
        >
          {isPending ? "Đang lưu..." : "Thêm vào danh sách"}
        </button>
      </form>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {optimisticGoals.map(goal => (
          <div key={goal.id} style={{
            background: "var(--color-surface)",
            padding: "1rem",
            borderRadius: "16px",
            border: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "flex-start",
            gap: "1rem",
            opacity: goal.done ? 0.7 : 1,
            transition: "opacity 0.2s"
          }}>
            <button 
              onClick={() => handleToggle(goal.id, goal.done)}
              style={{
                width: 24, height: 24, borderRadius: "6px",
                border: goal.done ? "none" : "2px solid var(--color-border-strong)",
                background: goal.done ? "var(--color-primary)" : "transparent",
                color: "var(--color-text)", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0, marginTop: "2px"
              }}
            >
              {goal.done && "✓"}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{
                margin: "0 0 0.25rem", fontSize: "1.05rem", color: "var(--color-text)",
                textDecoration: goal.done ? "line-through" : "none"
              }}>
                {goal.title}
              </h4>
              {goal.description && (
                <p style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", color: "var(--color-text-muted)", whiteSpace: "pre-wrap" }}>
                  {goal.description}
                </p>
              )}
              {goal.done && goal.profiles && (
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-primary-dark)", fontWeight: 600 }}>
                  Đánh dấu hoàn thành bởi {goal.profiles.display_name}
                </p>
              )}
            </div>
            <button 
              onClick={() => handleDelete(goal.id)}
              style={{
                background: "none", border: "none", color: "var(--color-text-light)",
                fontSize: "1.2rem", cursor: "pointer", padding: "4px"
              }}
              title="Xóa"
            >
              ×
            </button>
          </div>
        ))}
        {optimisticGoals.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "2rem 0" }}>
            Chưa có mục tiêu nào. Hãy thêm một điều muốn làm cùng nhau nhé!
          </p>
        )}
      </div>
    </div>
  );
}
