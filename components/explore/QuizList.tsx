"use client";

import { useState, useTransition } from "react";

import { createQuiz, deleteQuiz } from "@/lib/actions/quiz";
import { useConfirm } from "@/components/ui/ConfirmDialogProvider";

interface Quiz {
  id: string;
  question: string;
  answer: string;
  hint: string | null;
  created_by: string;
  created_at: string;
  profiles?: { display_name: string } | null;
}

interface Props {
  initialQuizzes: Quiz[];
  currentUserId: string;
}

export function QuizList({ initialQuizzes, currentUserId }: Props) {
  const [isPending, startTransition] = useTransition();
  const confirm = useConfirm();
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});

  async function handleAdd(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createQuiz(formData);
      if (res?.error) setError(res.error);
      else setShowForm(false);
    });
  }

  async function handleDelete(id: string) {
    const confirmed = await confirm("Xóa câu hỏi này?");
    if (!confirmed) return;
    startTransition(async () => {
      const res = await deleteQuiz(id);
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
          + Thêm câu đố
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
            <h3 style={{ fontSize: "1rem", margin: 0, color: "var(--color-text)" }}>Thêm câu đố mới</h3>
            <button type="button" onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "var(--color-text-muted)" }}>Hủy</button>
          </div>
          
          <input 
            type="text" 
            name="question" 
            placeholder="Câu hỏi (VD: Món ăn anh ghét nhất là gì?)"
            required
            style={{
              width: "100%", padding: "0.75rem", borderRadius: "8px", 
              border: "1px solid var(--color-border)", marginBottom: "0.75rem",
              background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "inherit"
            }}
          />
          <input 
            type="text" 
            name="answer" 
            placeholder="Câu trả lời (VD: Hành lá)"
            required
            style={{
              width: "100%", padding: "0.75rem", borderRadius: "8px", 
              border: "1px solid var(--color-border)", marginBottom: "0.75rem",
              background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "inherit"
            }}
          />
          <input 
            type="text" 
            name="hint" 
            placeholder="Gợi ý (tùy chọn)"
            style={{
              width: "100%", padding: "0.75rem", borderRadius: "8px", 
              border: "1px solid var(--color-border)", marginBottom: "1rem",
              background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "inherit"
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
            {isPending ? "Đang lưu..." : "Lưu câu hỏi"}
          </button>
        </form>
      )}

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {initialQuizzes.map(quiz => {
          const isMine = quiz.created_by === currentUserId;
          const showAns = revealedAnswers[quiz.id] || isMine;
          const showHint = revealedHints[quiz.id] || isMine;

          return (
            <div key={quiz.id} style={{
              background: "var(--color-surface)",
              padding: "1.25rem",
              borderRadius: "16px",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-sm)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <p style={{ margin: 0, fontSize: "1.05rem", color: "var(--color-text)", fontWeight: 700, lineHeight: 1.4 }}>
                  Q: {quiz.question}
                </p>
                {isMine && (
                  <button 
                    onClick={() => handleDelete(quiz.id)}
                    style={{
                      background: "none", border: "none", color: "var(--color-text-light)",
                      fontSize: "1.2rem", cursor: "pointer", padding: "0 4px"
                    }}
                    title="Xóa"
                  >
                    ×
                  </button>
                )}
              </div>

              {!isMine && quiz.hint && !showHint && (
                <button 
                  onClick={() => setRevealedHints(prev => ({ ...prev, [quiz.id]: true }))}
                  style={{
                    background: "var(--color-bg)", border: "1px solid var(--color-border)",
                    padding: "0.4rem 0.75rem", borderRadius: "8px", fontSize: "0.8rem",
                    color: "var(--color-text-muted)", cursor: "pointer", marginBottom: "0.75rem"
                  }}
                >
                  💡 Xem gợi ý
                </button>
              )}

              {showHint && quiz.hint && (
                <div style={{ 
                  background: "var(--color-bg)", padding: "0.75rem", borderRadius: "8px",
                  fontSize: "0.85rem", color: "var(--color-text)", marginBottom: "0.75rem",
                  borderLeft: "3px solid var(--color-accent)"
                }}>
                  💡 <strong>Gợi ý:</strong> {quiz.hint}
                </div>
              )}

              {showAns ? (
                <div style={{ 
                  background: "var(--color-bg)", padding: "0.75rem", borderRadius: "8px",
                  fontSize: "0.95rem", color: "var(--color-primary-dark)", fontWeight: 600,
                  border: "1px solid var(--color-primary)"
                }}>
                  A: {quiz.answer}
                </div>
              ) : (
                <button 
                  onClick={() => setRevealedAnswers(prev => ({ ...prev, [quiz.id]: true }))}
                  style={{
                    width: "100%", background: "var(--color-primary)", color: "var(--color-text)",
                    border: "none", padding: "0.75rem", borderRadius: "8px", fontWeight: 700,
                    cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem"
                  }}
                >
                  <span>👁️</span> Xem đáp án
                </button>
              )}

              <p style={{ margin: "1rem 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)", fontStyle: "italic", textAlign: "right" }}>
                Đố bởi {quiz.profiles?.display_name || "Unknown"}
              </p>
            </div>
          );
        })}
        
        {initialQuizzes.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "2rem 0" }}>
            Chưa có câu đố nào. Hãy thử hỏi đối phương một câu nhé!
          </p>
        )}
      </div>
    </div>
  );
}
