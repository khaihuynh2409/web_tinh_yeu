"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createLetter } from "@/lib/actions/letters";

interface Letter {
  id: string;
  from_user: string;
  to_user: string;
  title: string;
  content: string;
  open_at: string;
  created_at: string;
  from?: { display_name: string } | null;
  to?: { display_name: string } | null;
}

interface Props {
  initialLetters: Letter[];
  currentUserId: string;
}

export function LetterList({ initialLetters, currentUserId }: Props) {
  const router = useRouter();
  const [letters, setLetters] = useState<Letter[]>(initialLetters);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setLetters(initialLetters);
  }, [initialLetters]);

  useEffect(() => {
    const handleFocus = () => {
      router.refresh();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [router]);

  async function handleAdd(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createLetter(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setShowForm(false);
        router.refresh();
      }
    });
  }

  // Phân loại thư
  const receivedLetters = letters.filter(l => l.to_user === currentUserId);
  const sentLetters = letters.filter(l => l.from_user === currentUserId);

  const renderLetter = (letter: Letter, isSent: boolean) => {
    const createdDate = new Date(letter.created_at).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div key={letter.id} style={{
        background: "var(--color-surface)",
        padding: "1.25rem",
        borderRadius: "16px",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-sm)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
          <h4 style={{ margin: 0, fontSize: "1.1rem", color: "var(--color-text)", fontWeight: 700 }}>
            {letter.title}
          </h4>
          <span style={{ fontSize: "1.25rem" }}>💌</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            {isSent ? `Gửi đến: ${letter.to?.display_name || "Người ấy"}` : `Từ: ${letter.from?.display_name || "Người ấy"}`}
          </p>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-light)" }}>
            {createdDate}
          </span>
        </div>

        <div style={{
          background: "var(--color-bg)",
          padding: "1rem",
          borderRadius: "12px",
          border: "1px solid var(--color-border)",
        }}>
          <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--color-text)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
            {letter.content}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div>
      {error && (
        <div style={{ padding: "0.75rem", background: "#FEE2E2", color: "#991B1B", borderRadius: "12px", marginBottom: "1rem", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          style={{
            width: "100%", padding: "1rem", borderRadius: "12px",
            border: "2px dashed var(--color-border-strong)", background: "transparent",
            color: "var(--color-primary-dark)", fontWeight: 700, cursor: "pointer",
            marginBottom: "2rem"
          }}
        >
          + Viết thư mới
        </button>
      ) : (
        <form action={handleAdd} style={{
          background: "var(--color-surface)",
          padding: "1.25rem",
          borderRadius: "16px",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-sm)",
          marginBottom: "2rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1rem", margin: 0, color: "var(--color-text)" }}>Viết thư gửi người ấy 💌</h3>
            <button type="button" onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}>Hủy</button>
          </div>

          <input
            type="text"
            name="title"
            placeholder="Tiêu đề (VD: Gửi em yêu, Ngày kỷ niệm...)"
            required
            style={{
              width: "100%", padding: "0.75rem", borderRadius: "8px",
              border: "1px solid var(--color-border)", marginBottom: "0.75rem",
              background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "inherit"
            }}
          />
          <textarea
            name="content"
            placeholder="Nội dung thư gửi gắm tâm tư..."
            rows={6}
            required
            style={{
              width: "100%", padding: "0.75rem", borderRadius: "8px",
              border: "1px solid var(--color-border)", marginBottom: "1.25rem",
              background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "inherit", resize: "none"
            }}
          />

          <button
            type="submit"
            disabled={isPending}
            style={{
              width: "100%", padding: "0.85rem", borderRadius: "8px",
              border: "none", background: "var(--color-primary)", color: "var(--color-text)",
              fontWeight: 700, cursor: isPending ? "wait" : "pointer", opacity: isPending ? 0.7 : 1
            }}
          >
            {isPending ? "Đang gửi..." : "Gửi thư 💌"}
          </button>
        </form>
      )}

      {/* Danh sách thư */}
      <h3 style={{ fontSize: "1.1rem", margin: "0 0 1rem", color: "var(--color-text)", borderBottom: "2px solid var(--color-border)", paddingBottom: "0.5rem" }}>
        Thư nhận được
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
        {receivedLetters.length > 0
          ? receivedLetters.map(l => renderLetter(l, false))
          : <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>Chưa có thư nào được gửi đến bạn.</p>
        }
      </div>

      <h3 style={{ fontSize: "1.1rem", margin: "0 0 1rem", color: "var(--color-text)", borderBottom: "2px solid var(--color-border)", paddingBottom: "0.5rem" }}>
        Thư đã gửi
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {sentLetters.length > 0
          ? sentLetters.map(l => renderLetter(l, true))
          : <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>Bạn chưa gửi thư nào.</p>
        }
      </div>
    </div>
  );
}
