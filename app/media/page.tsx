import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MediaTabs } from "@/components/media/MediaTabs";
import { BottomNav } from "@/components/BottomNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đa phương tiện — Nhật Ký Tình Yêu",
};

export const dynamic = "force-dynamic";

export default async function MediaPage(props: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const initialTab = searchParams.tab === "videos" ? "videos" : "images";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Lấy ảnh và video song song (join kỷ niệm để có ngày, thẻ, tiêu đề)
  const [imagesRes, videosRes] = await Promise.all([
    supabase
      .from("media")
      .select(
        `
        id, storage_path, type, created_at,
        memories!inner ( id, title, memory_date, tags, deleted_at )
      `
      )
      .eq("type", "image")
      .is("memories.deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("media")
      .select(
        `
        id, storage_path, type, size_bytes, created_at,
        memories!inner ( id, title, memory_date, tags, deleted_at )
      `
      )
      .eq("type", "video")
      .is("memories.deleted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const imageList = imagesRes.data ?? [];
  const videoList = videosRes.data ?? [];

  // Tạo signed URLs cho cả ảnh và video trong 1 lần gọi
  const paths = [...imageList, ...videoList].map((m) => m.storage_path);
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
  const images = imageList.map((m: any) => ({
    id: m.id,
    memory_id: m.memories?.id ?? "",
    storage_path: m.storage_path,
    type: m.type as "image" | "video",
    signedUrl: signedMap[m.storage_path] ?? "",
    memory_date: m.memories?.memory_date ?? "",
    memory_title: m.memories?.title ?? "",
    tags: m.memories?.tags ?? [],
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const videos = videoList.map((m: any) => ({
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
        paddingBottom: "max(6rem, calc(env(safe-area-inset-bottom) + 5.5rem))",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "2rem 1.25rem 1.25rem",
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
          }}
        >
          Đa phương tiện
        </h1>
        <p
          style={{
            fontSize: "0.8rem",
            color: "var(--color-text-muted)",
            marginTop: "2px",
          }}
        >
          Hình ảnh và video lưu giữ khoảnh khắc của hai đứa mình
        </p>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 1.25rem" }}>
        <MediaTabs images={images} videos={videos} initialTab={initialTab} />
      </div>

      <BottomNav active="/media" />
    </main>
  );
}
