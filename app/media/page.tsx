import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AlbumGrid } from "@/components/album/AlbumGrid";
import { VideoList } from "@/components/album/VideoList";
import { BottomNav } from "@/components/BottomNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đa phương tiện — Nhật Ký Tình Yêu",
};

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab === "video" ? "video" : "image";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch media của tab đang chọn (join với memories để lấy ngày, thẻ, tiêu đề)
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
    .eq("type", activeTab)
    .is("memories.deleted_at", null)
    .order("created_at", { ascending: false });

  const mediaList = rawMedia ?? [];

  // Tạo signed URLs theo batch
  const paths = mediaList.map((m) => m.storage_path);
  const signedMap: Record<string, string> = {};

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
    size_bytes: m.size_bytes ?? null,
  }));

  const tabs = [
    { key: "image", label: "🖼️ Ảnh", href: "/media" },
    { key: "video", label: "🎬 Video", href: "/media?tab=video" },
  ];

  return (
    <main
      style={{
        minHeight: "100dvh",
        backgroundColor: "var(--color-bg)",
        paddingBottom: "max(6rem, env(safe-area-inset-bottom))",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "2rem 1.25rem 1rem",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.6rem",
            fontStyle: "italic",
            fontWeight: 800,
            color: "var(--color-text)",
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          Đa phương tiện
        </h1>
        <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "2px 0 1rem" }}>
          Ảnh và video những khoảnh khắc của hai đứa mình
        </p>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          {tabs.map((t) => {
            const isActive = t.key === activeTab;
            return (
              <a
                key={t.key}
                href={t.href}
                aria-current={isActive ? "page" : undefined}
                style={{
                  padding: "0.45rem 1.1rem",
                  borderRadius: "999px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  background: isActive ? "var(--color-primary)" : "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  color: isActive ? "var(--color-text)" : "var(--color-text-muted)",
                }}
              >
                {t.label}
              </a>
            );
          })}
        </div>
      </div>

      <div
        style={{
          maxWidth: activeTab === "video" ? "720px" : "900px",
          margin: "0 auto",
          padding: "0 1.25rem",
        }}
      >
        {activeTab === "video" ? (
          <VideoList
            videos={items.map((m) => ({
              id: m.id,
              memory_id: m.memory_id,
              signedUrl: m.signedUrl,
              memory_title: m.memory_title,
              memory_date: m.memory_date,
              tags: m.tags,
              size_bytes: m.size_bytes,
            }))}
          />
        ) : (
          <AlbumGrid items={items} />
        )}
      </div>

      <BottomNav active="/media" />
    </main>
  );
}
