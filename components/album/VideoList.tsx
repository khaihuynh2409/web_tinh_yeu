"use client";

import { useState } from "react";
import { formatVietnameseDate } from "@/lib/utils/date";

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
  videos: VideoItem[];
}

export function VideoList({ videos }: Props) {
  const [activeId, setActiveId] = useState<string | null>(
    videos.length > 0 ? videos[0].id : null
  );

  if (videos.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem", opacity: 0.3 }}>🎬</div>
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.3rem",
            color: "var(--color-text)",
            marginBottom: "0.5rem",
          }}
        >
          Chưa có video nào
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
          Thêm video khi tạo kỷ niệm mới nhé!
        </p>
      </div>
    );
  }

  const active = videos.find((v) => v.id === activeId) ?? videos[0];

  function formatSize(bytes: number | null): string {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div>
      {/* ── Main player ─────────────────────────── */}
      <div
        style={{
          background: "#000",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "var(--shadow-lg)",
          marginBottom: "1.25rem",
          position: "relative",
        }}
      >
        <video
          key={active.signedUrl} // Re-mount khi đổi video
          src={active.signedUrl}
          controls
          autoPlay={false}
          preload="metadata"
          playsInline
          style={{
            width: "100%",
            maxHeight: "60dvh",
            display: "block",
            objectFit: "contain",
          }}
        />
      </div>

      {/* ── Active video info ────────────────────── */}
      <div style={{ marginBottom: "1.5rem", padding: "0 0.25rem" }}>
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.25rem",
            fontStyle: "italic",
            fontWeight: 700,
            color: "var(--color-text)",
            marginBottom: "0.35rem",
          }}
        >
          {active.memory_title}
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            📅 {formatVietnameseDate(active.memory_date)}
          </span>
          {active.size_bytes && (
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
              💾 {formatSize(active.size_bytes)}
            </span>
          )}
          {active.tags?.map((t) => (
            <span
              key={t}
              style={{
                padding: "2px 10px",
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
              #{t}
            </span>
          ))}
        </div>
      </div>

      {/* ── Playlist ─────────────────────────────── */}
      {videos.length > 1 && (
        <div>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--color-text-muted)",
              marginBottom: "0.75rem",
            }}
          >
            Danh sách ({videos.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {videos.map((v) => (
              <button
                key={v.id}
                onClick={() => setActiveId(v.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "12px",
                  border: v.id === activeId
                    ? "2px solid var(--color-primary)"
                    : "1.5px solid var(--color-border)",
                  background: v.id === activeId
                    ? "var(--color-primary-bg)"
                    : "var(--color-surface)",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "var(--font-body)",
                  transition: "all 0.2s ease",
                  boxShadow: v.id === activeId ? "var(--shadow-sm)" : "none",
                }}
              >
                {/* Thumbnail placeholder / play icon */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "8px",
                    background: v.id === activeId
                      ? "var(--color-primary)"
                      : "var(--color-surface-alt)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.1rem",
                    flexShrink: 0,
                    color: v.id === activeId ? "white" : "var(--color-text-muted)",
                  }}
                >
                  {v.id === activeId ? "▶" : "⏸"}
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: v.id === activeId
                        ? "var(--color-primary-dark)"
                        : "var(--color-text)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      margin: 0,
                    }}
                  >
                    {v.memory_title}
                  </p>
                  <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", margin: "2px 0 0" }}>
                    {formatVietnameseDate(v.memory_date)}
                    {v.size_bytes ? ` · ${formatSize(v.size_bytes)}` : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
