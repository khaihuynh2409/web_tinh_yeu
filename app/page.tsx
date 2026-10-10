import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoveCounter } from "@/components/hero/LoveCounter";
import { TimelineList } from "@/components/timeline/TimelineList";
import { TimelineSort } from "@/components/timeline/TimelineSort";
import { BottomNav } from "@/components/BottomNav";
import { getDaysTogether, getNextMilestone } from "@/lib/utils/date";

export default async function HomePage(props: { searchParams: Promise<{ sort?: string }> }) {
  const searchParams = await props.searchParams;
  const sortOrder = searchParams.sort === "oldest" ? "oldest" : "newest";
  const ascending = sortOrder === "oldest";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [settingsRes, memoriesRes, profileRes] = await Promise.all([
    supabase.from("couple_settings").select("*").eq("id", 1).single(),
    supabase
      .from("memories")
      .select(`
        id, title, content, memory_date, tags,
        media ( id, storage_path, type )
      `)
      .is("deleted_at", null)
      .order("memory_date", { ascending })
      .limit(20),
    supabase.from("profiles").select("display_name").eq("id", user.id).single()
  ]);

  const settings = settingsRes.data;
  const rawMemories = memoriesRes.data || [];
  const profile = profileRes.data;

  // Tạo signed urls cho cover media
  const pathsToSign: string[] = [];
  rawMemories.forEach(m => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const firstMedia = (m.media as any[])?.[0];
    if (firstMedia) pathsToSign.push(firstMedia.storage_path);
  });

  let signedUrls: Record<string, string> = {};
  if (pathsToSign.length > 0) {
    const { data: urls, error: signError } = await supabase.storage.from("memories").createSignedUrls(pathsToSign, 3600);
    console.log("createSignedUrls paths:", pathsToSign, "urls:", urls, "error:", signError);
    if (urls) {
      urls.forEach(u => {
        if (!u.error && u.signedUrl && u.path) signedUrls[u.path] = u.signedUrl;
      });
    }
  }

  const memories = rawMemories.map(m => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const firstMedia = (m.media as any[])?.[0];
    return {
      id: m.id,
      title: m.title,
      content: m.content,
      memory_date: m.memory_date,
      tags: m.tags,
      coverUrl: firstMedia ? signedUrls[firstMedia.storage_path] : undefined,
      coverType: firstMedia ? firstMedia.type : undefined
    };
  });

  if (!settings) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Lỗi: Chưa có couple_settings trong DB.
      </div>
    );
  }

  const daysTogether = getDaysTogether(settings.start_date);
  const milestone = getNextMilestone(settings.start_date);

  return (
    <main style={{
      minHeight: "100dvh",
      overflowX: "hidden",
      position: "relative",
      backgroundColor: "var(--color-bg)",
      paddingBottom: "max(6rem, calc(env(safe-area-inset-bottom) + 5.5rem))",
    }}>
      {/* Background gradient - z:0, thấp nhất */}
      <div style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        background: "radial-gradient(ellipse at 50% 0%, var(--color-primary-bg) 0%, transparent 60%), linear-gradient(180deg, var(--color-bg) 0%, var(--color-bg-alt) 100%)"
      }} />

      {/* Logout Button (Top Right) */}
      <div style={{
        position: "absolute",
        top: "1.5rem",
        right: "1.5rem",
        zIndex: 10,
      }}>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            style={{
              fontSize: "12px",
              fontWeight: 600,
              padding: "0.4rem 0.8rem",
              borderRadius: "999px",
              color: "var(--color-text-muted)",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              boxShadow: "var(--shadow-sm)",
            }}
            title={`Đăng xuất khỏi ${profile?.display_name}`}
          >
            Đăng xuất
          </button>
        </form>
      </div>

      {/* HERO SECTION - z:2 */}
      <section style={{
        position: "relative",
        zIndex: 2,
        maxWidth: "900px",
        margin: "0 auto",
        padding: "3rem 1.5rem 2rem",
        textAlign: "center",
      }}>
        <p style={{
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--color-primary)",
          marginBottom: "0.5rem",
        }}>
          Ngày thứ
        </p>

        <h1 style={{
          fontFamily: "var(--font-heading)",
          fontStyle: "italic",
          fontSize: "clamp(4rem, 15vw, 9rem)",
          fontWeight: 800,
          lineHeight: 1,
          background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          marginBottom: "1rem",
        }}>
          {daysTogether.toLocaleString()}
        </h1>

        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          fontSize: "1.5rem",
          fontFamily: "var(--font-heading)",
          color: "var(--color-text)",
          marginBottom: "1.5rem",
        }}>
          <span style={{ fontWeight: 600 }}>{settings.name_a}</span>
          <span style={{ fontSize: "1.5rem", color: "var(--color-primary-light)" }}>❤️</span>
          <span style={{ fontWeight: 600 }}>{settings.name_b}</span>
        </div>

        {/* Realtime Counter */}
        <LoveCounter startDate={settings.start_date} />

        {/* Milestone badge */}
        <div style={{
          display: "inline-block",
          marginTop: "1rem",
          padding: "0.4rem 1.2rem",
          borderRadius: "9999px",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          background: "var(--color-surface)",
          color: "var(--color-text-muted)",
          border: "1px solid var(--color-border)",
        }}>
          ✨ Sắp tới: Kỷ niệm {milestone.yearCount} năm
        </div>
      </section>

      {/* TIMELINE SECTION - z:2 */}
      <section style={{
        position: "relative",
        zIndex: 2,
        maxWidth: "900px",
        margin: "0 auto",
        padding: "0 1.5rem",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2rem",
        }}>
          <h2 style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--color-text)",
          }}>
            Hành trình của chúng mình
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <TimelineSort currentSort={sortOrder} />
            <a
              href="/memories/new"
              style={{
                padding: "0.4rem 1rem",
                borderRadius: "9999px",
                fontSize: "0.85rem",
                fontWeight: 600,
                background: "var(--color-primary)",
                color: "white",
                border: "none",
                textDecoration: "none",
                cursor: "pointer",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              + Thêm kỷ niệm
            </a>
          </div>
        </div>

        <TimelineList memories={memories} startDate={settings.start_date} />
      </section>



      {/* Bottom Navigation */}
      <BottomNav active="/" />
    </main>
  );
}
