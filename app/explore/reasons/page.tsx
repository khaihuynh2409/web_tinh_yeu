import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReasonList } from "@/components/explore/ReasonList";

export default async function ReasonsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: reasons } = await supabase
    .from("reasons")
    .select("*, profiles:created_by(display_name)")
    .order("created_at", { ascending: false });

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
            💝 100 Lý do yêu nhau
          </h1>
        </div>
        
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginBottom: "2rem" }}>
          Mỗi ngày một điều nhỏ bé khiến tình yêu thêm bền chặt.
        </p>

        <ReasonList initialReasons={reasons || []} currentUserId={user.id} />
      </div>
    </main>
  );
}
