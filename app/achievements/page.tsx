import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AchievementList } from "@/components/achievements/AchievementList";
import { BottomNav } from "@/components/BottomNav";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Thành tích — Nhật Ký Tình Yêu",
};

export default async function AchievementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("achievements")
    .select("id, title, description, icon, achieved_at")
    .order("achieved_at", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <main style={{
      minHeight: "100dvh",
      backgroundColor: "var(--color-bg)",
      padding: "0 1rem 6rem",
    }}>
      <div style={{ maxWidth: "640px", margin: "0 auto", paddingTop: "2rem" }}>
        <h1 style={{
          fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 800,
          color: "var(--color-text)", margin: "0 0 0.25rem",
        }}>
          🏆 Thành tích
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginBottom: "2rem" }}>
          Những điều hai đứa đã cùng nhau đạt được.
        </p>

        <AchievementList achievements={data ?? []} />
      </div>
      <BottomNav active="/achievements" />
    </main>
  );
}
