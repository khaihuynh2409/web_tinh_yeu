"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createWish, deleteWish, toggleWishGifted } from "@/lib/actions/wishlist";
import { useConfirm } from "@/components/ui/ConfirmDialogProvider";

interface Wish {
  id: string;
  title: string;
  note: string | null;
  link: string | null;
  price: string | null;
  is_gifted: boolean;
  created_by: string;
  created_at: string;
  profiles?: { display_name: string } | null;
}

interface Props {
  initialWishes: Wish[];
  currentUserId: string;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.75rem", borderRadius: "8px",
  border: "1px solid var(--color-border)", marginBottom: "0.75rem",
  background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "inherit",
  boxSizing: "border-box",
};

export function WishList({ initialWishes, currentUserId }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const confirm = useConfirm();
  const [error, setError] = useState<string | null>(null);
  const [wishes, setWishes] = useState<Wish[]>(initialWishes);
  const [tab, setTab] = useState<"partner" | "mine">("partner");

  // Đồng bộ lại khi server trả dữ liệu mới (sau router.refresh)
  const [prevInitial, setPrevInitial] = useState(initialWishes);
  if (prevInitial !== initialWishes) {
    setPrevInitial(initialWishes);
    setWishes(initialWishes);
  }

  useEffect(() => {
    const handleFocus = () => {
      router.refresh();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [router]);

  async function handleAdd(formData: FormData) {
    setError(null);
    const title = formData.get("title") as string;
    if (!title?.trim()) return;

    startTransition(async () => {
      const res = await createWish(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        formRef.current?.reset();
        setTab("mine");
        router.refresh();
      }
    });
  }

  async function handleDelete(id: string) {
    const confirmed = await confirm("Xóa món này khỏi wishlist?");
    if (!confirmed) return;

    setWishes(prev => prev.filter(w => w.id !== id));
    startTransition(async () => {
      const res = await deleteWish(id);
      if (res?.error) setError(res.error);
    });
  }

  function handleToggleGifted(wish: Wish) {
    const next = !wish.is_gifted;
    setWishes(prev => prev.map(w => (w.id === wish.id ? { ...w, is_gifted: next } : w)));
    startTransition(async () => {
      const res = await toggleWishGifted(wish.id, next);
      if (res?.error) {
        setError(res.error);
        setWishes(prev => prev.map(w => (w.id === wish.id ? { ...w, is_gifted: !next } : w)));
      }
    });
  }

  const mine = wishes.filter(w => w.created_by === currentUserId);
  const partner = wishes.filter(w => w.created_by !== currentUserId);
  const shown = tab === "mine" ? mine : partner;

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
        <input name="title" placeholder="Món bạn thích (vd: Gấu bông, son môi...)" required maxLength={200} style={inputStyle} />
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <input name="price" placeholder="Giá (tuỳ chọn)" maxLength={50} style={{ ...inputStyle, flex: 1 }} />
          <input name="link" placeholder="Link mua (tuỳ chọn)" maxLength={1000} inputMode="url" style={{ ...inputStyle, flex: 2 }} />
        </div>
        <textarea
          name="note"
          placeholder="Ghi chú: màu, size, mẫu mình thích..."
          rows={2}
          maxLength={1000}
          style={{ ...inputStyle, resize: "none" }}
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
          {isPending ? "Đang lưu..." : "Thêm vào wishlist"}
        </button>
      </form>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: "0.5rem", marginBottom: "1.25rem",
        background: "var(--color-surface)", padding: "4px", borderRadius: "12px",
        border: "1px solid var(--color-border)",
      }}>
        {([
          ["partner", `Người ấy thích (${partner.length})`],
          ["mine", `Mình thích (${mine.length})`],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            style={{
              flex: 1, padding: "0.6rem", borderRadius: "9px", border: "none",
              background: tab === key ? "var(--color-primary)" : "transparent",
              color: "var(--color-text)", fontWeight: tab === key ? 700 : 500,
              cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {shown.map(wish => {
          const isMine = wish.created_by === currentUserId;
          return (
            <div key={wish.id} style={{
              background: "var(--color-surface)",
              padding: "1.25rem",
              borderRadius: "16px",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-sm)",
              opacity: wish.is_gifted ? 0.65 : 1,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--color-text)",
                    textDecoration: wish.is_gifted ? "line-through" : "none", wordBreak: "break-word",
                  }}>
                    🎁 {wish.title}
                  </p>
                  {wish.price && (
                    <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                      💰 {wish.price}
                    </p>
                  )}
                </div>
                {wish.is_gifted && (
                  <span style={{
                    flexShrink: 0, fontSize: "0.7rem", fontWeight: 700, padding: "3px 8px",
                    borderRadius: "8px", background: "#dcfce7", color: "#166534",
                  }}>
                    Đã tặng
                  </span>
                )}
              </div>

              {wish.note && (
                <p style={{ margin: "0.75rem 0 0", fontSize: "0.95rem", color: "var(--color-text)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                  {wish.note}
                </p>
              )}

              {wish.link && (
                <a
                  href={wish.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-block", marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--color-text)", fontWeight: 600 }}
                >
                  🔗 Xem link mua
                </a>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)", fontStyle: "italic" }}>
                  {wish.profiles?.display_name || "Unknown"} - {new Date(wish.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                </p>
                {isMine ? (
                  <button
                    onClick={() => handleDelete(wish.id)}
                    style={{
                      background: "none", border: "none", color: "var(--color-text-light)",
                      fontSize: "1.2rem", cursor: "pointer", padding: "4px"
                    }}
                    title="Xóa"
                  >
                    ×
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleGifted(wish)}
                    style={{
                      padding: "0.4rem 0.75rem", borderRadius: "8px",
                      border: "1px solid var(--color-border)",
                      background: wish.is_gifted ? "transparent" : "var(--color-accent)",
                      color: "var(--color-text)", fontSize: "0.8rem", fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    {wish.is_gifted ? "Bỏ đánh dấu" : "Đã tặng 🎉"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {shown.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "2rem 0" }}>
            {tab === "mine"
              ? "Bạn chưa thêm món nào. Thêm món đầu tiên để người ấy biết nhé!"
              : "Người ấy chưa thêm món nào vào wishlist."}
          </p>
        )}
      </div>
    </div>
  );
}
