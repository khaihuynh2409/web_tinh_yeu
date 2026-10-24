import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WishList } from "@/components/explore/WishList";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [wishesRes, profilesRes] = await Promise.all([
    supabase
      .from("wishlist_items")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, display_name"),
  ]);

  const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
  const wishes = (wishesRes.data || []).map(w => ({
    ...w,
    profiles: profileMap.get(w.created_by) || null,
  }));

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
            🎁 Wishlist
          </h1>
        </div>

        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginBottom: "2rem" }}>
          Thêm những món mình thích để người ấy biết mà tặng nhé.
        </p>

        <WishList initialWishes={wishes} currentUserId={user.id} />
      </div>
    </main>
  );
}
