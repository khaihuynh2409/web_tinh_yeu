"use client";

import { useTransition } from "react";
import { softDeleteMemory } from "@/lib/actions/memories";
import { useConfirm } from "@/components/ui/ConfirmDialogProvider";

export function DeleteMemoryButton({ memoryId }: { memoryId: string }) {
  const [isPending, startTransition] = useTransition();
  const confirm = useConfirm();

  async function handleDelete() {
    const confirmed = await confirm("Chuyển kỷ niệm này vào thùng rác?");
    if (!confirmed) return;
    startTransition(async () => {
      await softDeleteMemory(memoryId);
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      style={{
        padding: "0.4rem 1rem",
        borderRadius: "999px",
        fontSize: "0.8rem",
        fontWeight: 700,
        background: "#FDE8EE",
        color: "var(--color-primary-dark)",
        border: "1px solid var(--color-border-strong)",
        cursor: isPending ? "not-allowed" : "pointer",
        opacity: isPending ? 0.6 : 1,
        fontFamily: "var(--font-body)",
      }}
    >
      {isPending ? "..." : "🗑️ Xóa"}
    </button>
  );
}
