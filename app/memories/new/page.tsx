import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MemoryForm } from "@/components/memories/MemoryForm";
import { BottomNav } from "@/components/BottomNav";

export default async function NewMemoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main style={{
      minHeight: "100dvh",
      backgroundColor: "var(--color-bg)",
      padding: "0 1rem 3rem",
    }}>
      {/* Header */}
      <div style={{
        maxWidth: "640px",
        margin: "0 auto",
        paddingTop: "2rem",
        paddingBottom: "1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
      }}>
        <a
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            textDecoration: "none",
            fontSize: "1rem",
            flexShrink: 0,
          }}
          aria-label="Quay lại"
        >
          ←
        </a>
        <div>
          <h1 style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.5rem",
            fontStyle: "italic",
            color: "var(--color-text)",
            margin: 0,
          }}>
            Thêm kỷ niệm mới
          </h1>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "0.2rem 0 0" }}>
            Ghi lại một khoảnh khắc đáng nhớ
          </p>
        </div>
      </div>

      {/* Form card */}
      <div style={{
        maxWidth: "640px",
        margin: "0 auto",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "24px",
        padding: "1.75rem 1.5rem",
        boxShadow: "var(--shadow-lg)",
      }}>
        <MemoryForm />
      </div>

      {/* Note về upload */}
      <p style={{
        maxWidth: "640px",
        margin: "1rem auto 0",
        fontSize: "0.75rem",
        color: "var(--color-text-light)",
        textAlign: "center",
      }}>
        💡 Sau khi lưu, mình có thể thêm ảnh &amp; video vào kỷ niệm này
      </p>
      <BottomNav active="/memories/new" />
    </main>
  );
}
