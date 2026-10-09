"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createMemory, updateMemory } from "@/lib/actions/memories";
import { DeleteMemoryButton } from "@/components/memories/DeleteMemoryButton";

type Memory = {
  id: string;
  title: string;
  content: string | null;
  memory_date: string;
  tags: string[];
};

interface Props {
  memory?: Memory; // nếu có → chế độ sửa
}

export function MemoryForm({ memory }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [tagInput, setTagInput] = useState(memory?.tags?.join(", ") ?? "");

  const isEdit = !!memory;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    formData.set("tags", tagInput);

    startTransition(async () => {
      try {
        if (isEdit) {
          await updateMemory(memory.id, formData);
        } else {
          await createMemory(formData);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  // Ngày mặc định = hôm nay
  const todayStr = new Date().toISOString().split("T")[0];
  const defaultDate = memory?.memory_date ?? todayStr;

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Tiêu đề */}
      <div>
        <label style={labelStyle} htmlFor="mem-title">Tiêu đề *</label>
        <input
          id="mem-title"
          name="title"
          required
          maxLength={200}
          defaultValue={memory?.title ?? ""}
          placeholder="Lần đầu gặp nhau..."
          disabled={isPending}
          style={inputStyle}
        />
      </div>

      {/* Ngày */}
      <div>
        <label style={labelStyle} htmlFor="mem-date">Ngày xảy ra *</label>
        <input
          id="mem-date"
          name="memory_date"
          type="date"
          required
          defaultValue={defaultDate}
          disabled={isPending}
          style={inputStyle}
        />
      </div>

      {/* Nội dung */}
      <div>
        <label style={labelStyle} htmlFor="mem-content">Nội dung</label>
        <textarea
          id="mem-content"
          name="content"
          rows={5}
          maxLength={5000}
          defaultValue={memory?.content ?? ""}
          placeholder="Kể về kỷ niệm đó... Hai đứa mình đã..."
          disabled={isPending}
          style={{ ...inputStyle, resize: "vertical", minHeight: "120px" }}
        />
      </div>

      {/* Tags */}
      <div>
        <label style={labelStyle} htmlFor="mem-tags">
          Tags <span style={{ fontWeight: 400, opacity: 0.6 }}>(ngăn cách bằng dấu phẩy)</span>
        </label>
        <input
          id="mem-tags"
          placeholder="du-lich, sinh-nhat, bua-an..."
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          disabled={isPending}
          style={inputStyle}
        />
        {/* Preview tags */}
        {tagInput.trim() && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.5rem" }}>
            {tagInput.split(",").map(t => t.trim()).filter(Boolean).map(tag => (
              <span key={tag} style={tagBadgeStyle}>#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: "0.75rem 1rem",
          borderRadius: "12px",
          background: "var(--color-primary-bg)",
          color: "var(--color-primary-dark)",
          fontSize: "0.875rem",
          border: "1px solid var(--color-border-strong)",
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", paddingTop: "0.5rem", alignItems: "center" }}>
        {isEdit && <DeleteMemoryButton memoryId={memory.id} />}
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isPending}
          style={{
            padding: "0.6rem 1.5rem",
            borderRadius: "999px",
            fontSize: "0.9rem",
            fontWeight: 600,
            background: "var(--color-surface-alt)",
            color: "var(--color-text-muted)",
            border: "1px solid var(--color-border)",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
          }}
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: "0.6rem 1.8rem",
            borderRadius: "999px",
            fontSize: "0.9rem",
            fontWeight: 700,
            background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
            color: "white",
            border: "none",
            cursor: isPending ? "not-allowed" : "pointer",
            opacity: isPending ? 0.7 : 1,
            fontFamily: "var(--font-body)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {isPending ? "Đang lưu..." : "Thêm ảnh đi vợ iu"}
        </button>
      </div>
    </form>
  );
}

// ── Shared styles ──────────────────────────────
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.85rem",
  fontWeight: 700,
  color: "var(--color-text-muted)",
  marginBottom: "0.5rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "44px",
  padding: "10px 16px",
  background: "var(--color-surface)",
  border: "1.5px solid var(--color-border)",
  borderRadius: "12px",
  fontFamily: "var(--font-body)",
  fontSize: "15px",
  color: "var(--color-text)",
  outline: "none",
  boxSizing: "border-box",
};

const tagBadgeStyle: React.CSSProperties = {
  padding: "2px 10px",
  borderRadius: "999px",
  fontSize: "10px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  background: "var(--color-primary-bg)",
  color: "var(--color-primary-dark)",
  border: "1px solid var(--color-border-strong)",
};
