"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>(initialQuizzes);
  const [isPending, startTransition] = useTransition();
  const confirm = useConfirm();
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setQuizzes(initialQuizzes);
  }, [initialQuizzes]);

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
      const res = await createQuiz(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setShowForm(false);
        router.refresh();
      }
    });
  }

  async function handleDelete(id: string) {
    const confirmed = await confirm("Xóa câu hỏi này?");
    if (!confirmed) return;
    setQuizzes(prev => prev.filter(q => q.id !== id));
    startTransition(async () => {
      const res = await deleteQuiz(id);
      if (res?.error) {
        setError(res.error);
      } else {
        router.refresh();
      }
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
        {quizzes.map(quiz => {
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
              {/* Question header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <p style={{ margin: 0, fontSize: "1.05rem", color: "var(--color-text)", fontWeight: 700, lineHeight: 1.4 }}>
                  Q: {quiz.question}
                </p>
                {isMine && (
                  <button
                    onClick={() => handleDelete(quiz.id)}
                    style={{
                      background: "none", border: "none", color: "var(--color-text-light)",
                      fontSize: "1.2rem", cursor: "pointer", padding: "0 4px", flexShrink: 0
                    }}
                    title="Xóa"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Hint toggle (chỉ người không tạo câu hỏi) */}
              {!isMine && quiz.hint && !showHint && (
                <button
                  onClick={() => setRevealedHints(prev => ({ ...prev, [quiz.id]: true }))}
                  style={{
                    background: "var(--color-bg)", border: "1px solid var(--color-border)",
                    padding: "0.4rem 0.75rem", borderRadius: "8px", fontSize: "0.8rem",
                    color: "var(--color-text-muted)", cursor: "pointer", marginBottom: "0.75rem", display: "block"
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

              {/* Answer area */}
              {showAns ? (
                <div style={{
                  background: "var(--color-bg)", padding: "0.75rem", borderRadius: "8px",
                  fontSize: "0.95rem", color: "var(--color-primary-dark)", fontWeight: 600,
                  border: "1px solid var(--color-primary)"
                }}>
                  A: {quiz.answer}
                </div>
              ) : (
                <QuizAnswerInput
                  correctAnswer={quiz.answer}
                  onReveal={() => setRevealedAnswers(prev => ({ ...prev, [quiz.id]: true }))}
                />
              )}

              <p style={{ margin: "1rem 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)", fontStyle: "italic", textAlign: "right" }}>
                Đố bởi {quiz.profiles?.display_name || "Unknown"}
              </p>
            </div>
          );
        })}

        {quizzes.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "2rem 0" }}>
            Chưa có câu đố nào. Hãy thử hỏi đối phương một câu nhé!
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Sub-component: ô điền đáp án ───────────────────────────────────────────

type CheckState = "idle" | "correct" | "wrong";

function QuizAnswerInput({
  correctAnswer,
  onReveal,
}: {
  correctAnswer: string;
  onReveal: () => void;
}) {
  const [inputVal, setInputVal] = useState("");
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [submitted, setSubmitted] = useState(false);

  // So sánh không phân biệt hoa/thường, bỏ khoảng trắng thừa
  function normalize(s: string) {
    return s.trim().toLowerCase().replace(/\s+/g, " ");
  }

  function handleCheck() {
    if (!inputVal.trim()) return;
    const isCorrect = normalize(inputVal) === normalize(correctAnswer);
    setCheckState(isCorrect ? "correct" : "wrong");
    setSubmitted(true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleCheck();
  }

  const borderColor =
    checkState === "correct" ? "#22c55e"
    : checkState === "wrong" ? "#f87171"
    : "var(--color-border)";

  const feedbackBg =
    checkState === "correct"
      ? "linear-gradient(135deg, #dcfce7, #bbf7d0)"
      : "linear-gradient(135deg, #fee2e2, #fecaca)";

  return (
    <div>
      {/* Row: input + nút kiểm tra */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: submitted ? "0.75rem" : "0.5rem" }}>
        <input
          type="text"
          value={inputVal}
          onChange={e => {
            setInputVal(e.target.value);
            // Reset trạng thái nếu người dùng sửa lại
            if (submitted) {
              setCheckState("idle");
              setSubmitted(false);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Nhập đáp án của bạn..."
          disabled={checkState === "correct"}
          style={{
            flex: 1,
            padding: "0.7rem 0.9rem",
            borderRadius: "10px",
            border: `2px solid ${borderColor}`,
            background: "var(--color-bg)",
            color: "var(--color-text)",
            fontFamily: "inherit",
            fontSize: "0.95rem",
            outline: "none",
            transition: "border-color 0.25s ease",
            boxSizing: "border-box",
          }}
        />
        {/* Nút kiểm tra — ẩn khi đã đúng */}
        {checkState !== "correct" && (
          <button
            onClick={handleCheck}
            disabled={!inputVal.trim()}
            style={{
              padding: "0.7rem 1rem",
              borderRadius: "10px",
              border: "none",
              background: inputVal.trim() ? "var(--color-primary)" : "var(--color-surface-alt)",
              color: inputVal.trim() ? "var(--color-text)" : "var(--color-text-light)",
              fontWeight: 700,
              cursor: inputVal.trim() ? "pointer" : "not-allowed",
              fontSize: "0.85rem",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
              flexShrink: 0,
            }}
          >
            Kiểm tra ✓
          </button>
        )}
      </div>

      {/* Feedback banner */}
      {submitted && (
        <div
          style={{
            background: feedbackBg,
            borderRadius: "10px",
            padding: "0.75rem 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            animation: "quiz-pop 0.3s ease",
          }}
        >
          <span style={{
            fontSize: "0.9rem",
            fontWeight: 700,
            color: checkState === "correct" ? "#166534" : "#991b1b",
          }}>
            {checkState === "correct"
              ? "🎉 Đúng rồi! Bạn hiểu nhau thật!"
              : "❌ Chưa đúng, thử lại nào~"}
          </span>

          {/* Xem đáp án khi sai */}
          {checkState === "wrong" && (
            <button
              onClick={onReveal}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid #f87171",
                background: "rgba(255,255,255,0.6)",
                color: "#991b1b",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              👁️ Xem đáp án
            </button>
          )}
        </div>
      )}

      {/* Bỏ qua — luôn hiện khi chưa đúng */}
      {checkState !== "correct" && (
        <button
          onClick={onReveal}
          style={{
            marginTop: "0.5rem",
            background: "none",
            border: "none",
            padding: 0,
            fontSize: "0.75rem",
            color: "var(--color-text-light)",
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
          }}
        >
          Bỏ qua, xem đáp án luôn
        </button>
      )}

      <style>{`
        @keyframes quiz-pop {
          0%   { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
