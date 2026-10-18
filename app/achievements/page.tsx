import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AchievementList } from "@/components/achievements/AchievementList";
import { BottomNav } from "@/components/BottomNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thành tích — Nhật Ký Tình Yêu",
};

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [achievementsRes, profilesRes] = await Promise.all([
    supabase
      .from("achievements")
      .select(
        "id, title, description, icon, achieved_date, is_shared, achieved_by, created_by"
      )
      .order("achieved_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, display_name").eq("is_member", true),
  ]);

  return (
    <main
      style={{
        minHeight: "100dvh",
        backgroundColor: "var(--color-bg)",
        padding: "0 1rem",
        paddingBottom: "max(6rem, calc(env(safe-area-inset-bottom) + 5.5rem))",
      }}
    >
      <div style={{ maxWidth: "640px", margin: "0 auto", paddingTop: "2rem" }}>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "2rem",
            fontWeight: 800,
            color: "var(--color-text)",
            marginBottom: "0.25rem",
          }}
        >
          Thành tích 🏆
        </h1>
        <p
          style={{
            color: "var(--color-text-muted)",
            fontSize: "0.9rem",
            marginBottom: "1.5rem",
          }}
        >
          Những điều hai đứa mình đã đạt được, cùng nhau hoặc riêng lẻ
        </p>

        {achievementsRes.error ? (
          <div
            style={{
              padding: "1rem",
              background: "#FEE2E2",
              color: "#991B1B",
              borderRadius: "12px",
              fontSize: "0.85rem",
            }}
          >
            Chưa thể tải thành tích. Hãy chạy file{" "}
            <code>supabase/migrations/004_achievements_and_push.sql</code> trong
            Supabase SQL Editor rồi tải lại trang.
          </div>
        ) : (
          <AchievementList
            initialItems={achievementsRes.data ?? []}
            profiles={profilesRes.data ?? []}
            currentUserId={user.id}
          />
        )}
      </div>
      <BottomNav active="/achievements" />
    </main>
  );
}
