import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RestoreButton } from "@/components/memories/RestoreButton";
import { PermanentDeleteButton } from "@/components/memories/PermanentDeleteButton";
import { BottomNav } from "@/components/BottomNav";
import { formatVietnameseDate } from "@/lib/utils/date";

export default async function TrashPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: deleted } = await supabase
    .from("memories")
    .select("id, title, memory_date, deleted_at")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  const memories = deleted ?? [];

  return (
    <main style={{
      minHeight: "100dvh",
      backgroundColor: "var(--color-bg)",
      padding: "0 1rem 3rem",
    }}>
      <div style={{ maxWidth: "640px", margin: "0 auto", paddingTop: "2rem" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
          <a
            href="/"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 36, height: 36, borderRadius: "50%",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              textDecoration: "none", fontSize: "1rem", flexShrink: 0,
            }}
          >
            ←
          </a>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontStyle: "italic", color: "var(--color-text)", margin: 0 }}>
            🗑️ Thùng rác
          </h1>
        </div>

        {memories.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-text-muted)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>✨</div>
            <p>Thùng rác trống</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {memories.map(m => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "16px",
                  padding: "1rem 1.25rem",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    color: "var(--color-text)",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {m.title}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0.2rem 0 0" }}>
                    {formatVietnameseDate(m.memory_date)}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  <RestoreButton memoryId={m.id} />
                  <PermanentDeleteButton memoryId={m.id} />
                </div>
              </div>
            ))}
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--color-text-light)", marginTop: "2rem" }}>
          Kỷ niệm trong thùng rác không hiển thị ở trang chủ
        </p>
      </div>
      <BottomNav active="/trash" />
    </main>
  );
}
