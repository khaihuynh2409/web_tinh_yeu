"use client";

import { useState } from "react";
import { AlbumGrid } from "@/components/album/AlbumGrid";
import { VideoList } from "@/components/album/VideoList";

type Tab = "images" | "videos";

interface ImageItem {
  id: string;
  memory_id: string;
  storage_path: string;
  type: "image" | "video";
  signedUrl: string;
  memory_date: string;
  memory_title: string;
  tags: string[];
}

interface VideoItem {
  id: string;
  memory_id: string;
  signedUrl: string;
  memory_title: string;
  memory_date: string;
  tags: string[];
  size_bytes: number | null;
}

interface Props {
  images: ImageItem[];
  videos: VideoItem[];
  initialTab: Tab;
}

export function MediaTabs({ images, videos, initialTab }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);

  function selectTab(next: Tab) {
    setTab(next);
    // Giữ liên kết đúng tab khi tải lại / chia sẻ
    window.history.replaceState(null, "", `/media?tab=${next}`);
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "images", label: "🖼️ Hình ảnh", count: images.length },
    { key: "videos", label: "🎬 Video", count: videos.length },
  ];

  return (
    <div>
      <div
        role="tablist"
        aria-label="Loại đa phương tiện"
        style={{
          display: "flex",
          gap: "0.25rem",
          padding: "0.25rem",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "999px",
          marginBottom: "1.5rem",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              id={`media-tab-${t.key}`}
              aria-selected={active}
              aria-controls={`media-panel-${t.key}`}
              onClick={() => selectTab(t.key)}
              style={{
                flex: 1,
                padding: "0.55rem 0.75rem",
                borderRadius: "999px",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontSize: "0.9rem",
                fontWeight: active ? 700 : 500,
                background: active ? "var(--color-primary)" : "transparent",
                color: active ? "var(--color-text)" : "var(--color-text-muted)",
                transition: "background 0.2s, color 0.2s",
              }}
            >
              {t.label}
              <span style={{ marginLeft: 6, fontSize: "0.75rem", opacity: 0.75 }}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Chỉ render panel đang mở để không tải video khi đang xem ảnh */}
      {tab === "images" ? (
        <div role="tabpanel" id="media-panel-images" aria-labelledby="media-tab-images">
          <AlbumGrid items={images} />
        </div>
      ) : (
        <div
          role="tabpanel"
          id="media-panel-videos"
          aria-labelledby="media-tab-videos"
          style={{ maxWidth: "720px", margin: "0 auto" }}
        >
          <VideoList videos={videos} />
        </div>
      )}
    </div>
  );
}
