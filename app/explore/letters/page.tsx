import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LetterList } from "@/components/explore/LetterList";

export default async function LettersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get letters sent to user or by user
  const { data: letters } = await supabase
    .from("letters")
    .select("*, from:from_user(display_name), to:to_user(display_name)")
    .order("open_at", { ascending: true });

  return (
    <main style={{
      minHeight: "100dvh",
      backgroundColor: "var(--color-bg)",
      padding: "0 1rem 4rem",
    }}>
      <div style={{ maxWidth: "640px", margin: "0 auto", paddingTop: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <a
            href="/explore"
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
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
            ✉️ Thư hẹn giờ
          </h1>
        </div>
        
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginBottom: "2rem" }}>
          Gửi gắm tâm tư đến một ngày trong tương lai. Thư chỉ có thể được mở khi đến thời gian đã hẹn.
        </p>

        <LetterList initialLetters={letters || []} currentUserId={user.id} />
      </div>
    </main>
  );
}
