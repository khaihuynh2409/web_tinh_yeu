"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createReason, deleteReason } from "@/lib/actions/reasons";
import { useConfirm } from "@/components/ui/ConfirmDialogProvider";

interface Reason {
  id: string;
  content: string;
  created_by: string;
  created_at: string;
  profiles?: { display_name: string } | null;
}

interface Props {
  initialReasons: Reason[];
  currentUserId: string;
}

export function ReasonList({ initialReasons, currentUserId }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const confirm = useConfirm();
  const [error, setError] = useState<string | null>(null);
  const [optimisticReasons, setOptimisticReasons] = useState<Reason[]>(initialReasons);

  useEffect(() => {
    setOptimisticReasons(initialReasons);
  }, [initialReasons]);

  useEffect(() => {
    const handleFocus = () => {
      router.refresh();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [router]);

  async function handleAdd(formData: FormData) {
    setError(null);
    const content = formData.get("content") as string;
    if (!content?.trim()) return;

    startTransition(async () => {
      const res = await createReason(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        formRef.current?.reset();
        router.refresh();
      }
    });
  }

  async function handleDelete(id: string) {
    const confirmed = await confirm("Xóa lý do này?");
    if (!confirmed) return;

    setOptimisticReasons(prev => prev.filter(r => r.id !== id));
    startTransition(async () => {
      const res = await deleteReason(id);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div>
      {error && (
        <div style={{ padding: "0.75rem", background: "#FEE2E2", color: "#991B1B", borderRadius: "12px", marginBottom: "1rem", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {/* Add Form */}
      <form ref={formRef} action={handleAdd} style={{
        background: "var(--color-surface)",
        padding: "1.25rem",
        borderRadius: "16px",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-sm)",
        marginBottom: "2rem",
      }}>
        <textarea
          name="content"
          placeholder="Lý do khiến bạn yêu người ấy..."
          rows={3}
          required
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
          {isPending ? "Đang lưu..." : "Thêm lý do"}
        </button>
      </form>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {optimisticReasons.length > 0 && <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>Đã lưu {optimisticReasons.length} lý do</p>}
        {optimisticReasons.map((reason, index) => {
          const isMine = reason.created_by === currentUserId;
          return (
            <div key={reason.id} style={{
              background: "var(--color-surface)",
              padding: "1.25rem",
              borderRadius: "16px",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-sm)",
              position: "relative",
            }}>
              <div style={{
                position: "absolute", top: "-12px", left: "16px",
                background: "var(--color-accent)", color: "var(--color-text)",
                padding: "2px 8px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 800,
                border: "1px solid var(--color-border)"
              }}>
                #{optimisticReasons.length - index}
              </div>

              <p style={{ margin: "0.5rem 0 1rem", fontSize: "1.05rem", color: "var(--color-text)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                {reason.content}
              </p>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)", fontStyle: "italic" }}>
                  Bởi {reason.profiles?.display_name || "Unknown"} - {new Date(reason.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                </p>
                {isMine && (
                  <button
                    onClick={() => handleDelete(reason.id)}
                    style={{
                      background: "none", border: "none", color: "var(--color-text-light)",
                      fontSize: "1.2rem", cursor: "pointer", padding: "4px"
                    }}
                    title="Xóa"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {optimisticReasons.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "2rem 0" }}>
            Chưa có lý do nào. Hãy viết lý do đầu tiên nhé!
          </p>
        )}
      </div>
    </div>
  );
}
