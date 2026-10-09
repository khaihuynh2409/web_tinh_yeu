"use client";
import { useTransition } from "react";
import { permanentDeleteMemory } from "@/lib/actions/memories";
import { useConfirm } from "@/components/ui/ConfirmDialogProvider";
export function PermanentDeleteButton({ memoryId }: { memoryId: string }) {
  const [isPending, startTransition] = useTransition();
  const confirm = useConfirm();
  async function handle() {
    const confirmed = await confirm("Xóa vĩnh viễn? Hành động này không thể hoàn tác!");
    if (!confirmed) return;
    startTransition(async () => { await permanentDeleteMemory(memoryId); });
  }
  return (
    <button
      onClick={handle}
      disabled={isPending}
      style={{
        padding: "0.35rem 0.9rem", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 700,
        background: "#FDE8EE", color: "var(--color-primary-dark)",
        border: "1px solid var(--color-border-strong)", cursor: isPending ? "not-allowed" : "pointer",
        opacity: isPending ? 0.6 : 1, fontFamily: "var(--font-body)",
      }}
    >
      {isPending ? "..." : "💀 Xóa vĩnh viễn"}
    </button>
  );
}
