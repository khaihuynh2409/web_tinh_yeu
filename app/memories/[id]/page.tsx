import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MediaUploader } from "@/components/memories/MediaUploader";
import { DeleteMemoryButton } from "@/components/memories/DeleteMemoryButton";
import { DeleteMediaButton } from "@/components/memories/DeleteMediaButton";
import { CropExistingMediaButton } from "@/components/memories/CropExistingMediaButton";
import { MemoryMediaGallery } from "@/components/memories/MemoryMediaGallery";
import { BottomNav } from "@/components/BottomNav";
import { formatVietnameseDate } from "@/lib/utils/date";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MemoryDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch kỷ niệm + media
  const [memoryRes, mediaRes] = await Promise.all([
    supabase
      .from("memories")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single(),
    supabase
      .from("media")
      .select("*")
      .eq("memory_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!memoryRes.data || memoryRes.error) return notFound();

  const memory = memoryRes.data;
  const mediaList = mediaRes.data ?? [];

  // Tạo signed URLs server-side
  const signedMedia = await Promise.all(
    mediaList.map(async (m) => {
      const { data } = await supabase.storage
        .from("memories")
        .createSignedUrl(m.storage_path, 3600);
      return { ...m, signedUrl: data?.signedUrl ?? null };
    })
  );

  // Tính ngày thứ N
  const { data: settings } = await supabase
    .from("couple_settings")
    .select("start_date")
    .eq("id", 1)
    .single();
  let dayNumber = "";
  if (settings) {
    const memDate = new Date(memory.memory_date);
    const startDate = new Date(settings.start_date);
    if (memDate >= startDate) {
      const diff =
        Math.ceil(Math.abs(memDate.getTime() - startDate.getTime()) / 86400000) +
        1;
      dayNumber = `Ngày thứ ${diff}`;
    }
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        backgroundColor: "var(--color-bg)",
        paddingBottom: "max(7rem, calc(env(safe-area-inset-bottom) + 6rem))",
      }}
    >
      {/* Header */}
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "2rem 1.25rem 1rem",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <a
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              textDecoration: "none",
              fontSize: "1rem",
              flexShrink: 0,
              boxShadow: "var(--shadow-sm)",
            }}
            aria-label="Quay lại"
          >
            ←
          </a>
          <div>
            {dayNumber && (
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--color-primary-dark)",
                  margin: 0,
                }}
              >
                {dayNumber}
              </p>
            )}
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--color-text-muted)",
                margin: "0.1rem 0 0",
              }}
            >
              {formatVietnameseDate(memory.memory_date)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <a
            href={`/memories/${id}/edit`}
            style={{
              padding: "0.4rem 1rem",
              borderRadius: "999px",
              fontSize: "0.85rem",
              fontWeight: 700,
              background: "var(--color-surface)",
              border: "1.5px solid var(--color-border)",
              color: "var(--color-text-muted)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            ✏️ Sửa
          </a>
          <DeleteMemoryButton memoryId={id} />
        </div>
      </div>

      {/* Nội dung chính */}
      <article
        style={{ maxWidth: "720px", margin: "0 auto", padding: "0 1.25rem" }}
      >
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1.5rem, 5vw, 2.25rem)",
            fontStyle: "italic",
            fontWeight: 800,
            color: "var(--color-text)",
            marginBottom: "1.25rem",
            lineHeight: 1.2,
          }}
        >
          {memory.title}
        </h1>

        {/* Tags */}
        {memory.tags && memory.tags.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.4rem",
              marginBottom: "1.5rem",
            }}
          >
            {(memory.tags as string[]).map((tag: string) => (
              <span
                key={tag}
                style={{
                  padding: "3px 12px",
                  borderRadius: "999px",
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  background: "var(--color-primary-bg)",
                  color: "var(--color-primary-dark)",
                  border: "1px solid var(--color-border-strong)",
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Nội dung */}
        {memory.content && (
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "20px",
              padding: "1.5rem",
              marginBottom: "2rem",
              whiteSpace: "pre-wrap",
              lineHeight: 1.8,
              color: "var(--color-text)",
              fontSize: "1rem",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {memory.content}
          </div>
        )}

        {/* Media Gallery với lightbox */}
        {signedMedia.length > 0 && (
          <div style={{ marginBottom: "2rem" }}>
            <p
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--color-text-muted)",
                marginBottom: "0.75rem",
              }}
            >
              📷 Ảnh &amp; Video ({signedMedia.length})
            </p>
            {/* Client component xử lý lightbox */}
            <MemoryMediaGallery
              mediaItems={signedMedia.map((m) => ({
                id: m.id,
                type: m.type as "image" | "video",
                signedUrl: m.signedUrl ?? "",
                storagePath: m.storage_path,
                memoryId: id,
              }))}
            />
          </div>
        )}

        {/* Upload thêm media */}
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "20px",
            padding: "1.5rem",
            marginBottom: "2rem",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <MediaUploader memoryId={id} />
        </div>
      </article>

      <BottomNav />
    </main>
  );
}
