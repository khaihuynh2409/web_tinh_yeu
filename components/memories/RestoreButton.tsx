"use client";
import { useTransition } from "react";
import { restoreMemory } from "@/lib/actions/memories";
export function RestoreButton({ memoryId }: { memoryId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(async () => { await restoreMemory(memoryId); })}
      disabled={isPending}
      style={{
        padding: "0.35rem 0.9rem", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 700,
        background: "var(--color-surface)", color: "var(--color-text-muted)",
        border: "1px solid var(--color-border)", cursor: isPending ? "not-allowed" : "pointer",
        opacity: isPending ? 0.6 : 1, fontFamily: "var(--font-body)",
      }}
    >
      {isPending ? "..." : "↩️ Khôi phục"}
    </button>
  );
}
