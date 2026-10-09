import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AlbumGrid } from "@/components/album/AlbumGrid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Album ảnh — Nhật Ký Tình Yêu",
};

export default async function AlbumPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch tất cả media loại ảnh (join với memories để lấy ngày, thẻ, tiêu đề)
  const { data: rawMedia } = await supabase
    .from("media")
    .select(
      `
      id, storage_path, type, created_at,
      memories!inner (
        id, title, memory_date, tags, deleted_at
      )
    `
    )
    .eq("type", "image")
    // Filter ra những kỷ niệm chưa bị xóa
    .is("memories.deleted_at", null)
    .order("created_at", { ascending: false });

  const mediaList = rawMedia ?? [];

  // Tạo signed URLs cho tất cả ảnh trong 1 batch
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
  const items = mediaList.map((m: any) => ({
    id: m.id,
    memory_id: m.memories?.id ?? "",
    storage_path: m.storage_path,
    type: m.type as "image" | "video",
    signedUrl: signedMap[m.storage_path] ?? "",
    memory_date: m.memories?.memory_date ?? "",
    memory_title: m.memories?.title ?? "",
    tags: m.memories?.tags ?? [],
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
          maxWidth: "900px",
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
            Album ảnh
          </h1>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
            Những khoảnh khắc đáng nhớ của hai đứa mình
          </p>
        </div>
        {/* Quick link to videos */}
        <a
          href="/videos"
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
          🎬 Video
        </a>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 1.25rem" }}>
        <AlbumGrid items={items} />
      </div>
    </main>
  );
}
