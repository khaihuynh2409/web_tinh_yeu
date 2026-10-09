import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VideoList } from "@/components/album/VideoList";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Video — Nhật Ký Tình Yêu",
};

export default async function VideosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch tất cả video (join với memories để lấy ngày, thẻ, tiêu đề)
  const { data: rawMedia } = await supabase
    .from("media")
    .select(
      `
      id, storage_path, type, size_bytes, created_at,
      memories!inner (
        id, title, memory_date, tags, deleted_at
      )
    `
    )
    .eq("type", "video")
    .is("memories.deleted_at", null)
    .order("created_at", { ascending: false });

  const mediaList = rawMedia ?? [];

  // Tạo signed URLs theo batch
  const paths = mediaList.map((m) => m.storage_path);
  let signedMap: Record<string, string> = {};

  if (paths.length > 0) {
    const { data: urls } = await supabase.storage
      .from("memories")
      .createSignedUrls(paths, 3600);
    if (urls) {
      urls.forEach((u) => {
        if (!u.error && u.signedUrl && u.path) signedMap[u.path] = u.signedUrl;
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const videos = mediaList.map((m: any) => ({
    id: m.id,
    memory_id: m.memories?.id ?? "",
    signedUrl: signedMap[m.storage_path] ?? "",
    memory_title: m.memories?.title ?? "",
    memory_date: m.memories?.memory_date ?? "",
    tags: m.memories?.tags ?? [],
    size_bytes: m.size_bytes ?? null,
  }));

  return (
    <main
      style={{
        minHeight: "100dvh",
        backgroundColor: "var(--color-bg)",
        paddingBottom: "max(3rem, env(safe-area-inset-bottom))",
      }}
    >
      {/* Header */}
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "2rem 1.25rem 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <a
          href="/"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
            fontSize: "1.1rem",
            flexShrink: 0,
            boxShadow: "var(--shadow-sm)",
          }}
          aria-label="Quay lại"
        >
          ←
        </a>
        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.6rem",
              fontStyle: "italic",
              fontWeight: 800,
              color: "var(--color-text)",
              lineHeight: 1.2,
            }}
          >
            Video kỷ niệm
          </h1>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
            Những khoảnh khắc sống động của hai đứa
          </p>
        </div>
        {/* Quick link to album */}
        <a
          href="/album"
          style={{
            padding: "0.4rem 1rem",
            borderRadius: "999px",
            fontSize: "0.8rem",
            fontWeight: 600,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          🖼️ Album
        </a>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 1.25rem" }}>
        <VideoList videos={videos} />
      </div>
    </main>
  );
}
