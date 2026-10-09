"use client";

import { useState, useMemo } from "react";
import { Lightbox } from "./Lightbox";
import { formatVietnameseDate } from "@/lib/utils/date";

interface MediaItem {
  id: string;
  memory_id: string;
  storage_path: string;
  type: "image" | "video";
  signedUrl: string;
  memory_date: string;
  memory_title: string;
  tags: string[];
}

interface Props {
  items: MediaItem[];
}

export function AlbumGrid({ items }: Props) {
  const [activeTag, setActiveTag] = useState<string>("all");
  const [activeYear, setActiveYear] = useState<string>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Collect unique tags and years
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach((m) => m.tags?.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [items]);

  const allYears = useMemo(() => {
    const years = new Set<string>();
    items.forEach((m) => {
      if (m.memory_date) years.add(m.memory_date.slice(0, 4));
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [items]);

  // Filter items
  const filtered = useMemo(() => {
    return items.filter((m) => {
      const tagOk = activeTag === "all" || (m.tags?.includes(activeTag) ?? false);
      const yearOk = activeYear === "all" || m.memory_date?.startsWith(activeYear);
      return tagOk && yearOk;
    });
  }, [items, activeTag, activeYear]);

  // Only images for lightbox
  const lightboxItems = useMemo(
    () =>
      filtered
        .filter((m) => m.type === "image")
        .map((m) => ({ url: m.signedUrl, type: "image" as const, alt: m.memory_title })),
    [filtered]
  );

  // Map filtered index → lightbox index (images only)
  function getLightboxIndex(item: MediaItem): number | null {
    if (item.type !== "image") return null;
    const imageItems = filtered.filter((m) => m.type === "image");
    return imageItems.findIndex((m) => m.id === item.id);
  }

  if (items.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem", opacity: 0.3 }}>🖼️</div>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.3rem", color: "var(--color-text)", marginBottom: "0.5rem" }}>
          Chưa có ảnh nào
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
          Thêm kỷ niệm kèm ảnh để album bắt đầu nhé!
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ── Filters ─────────────────────────────── */}
      <div style={{ marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {/* Year filter */}
        {allYears.length > 1 && (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {["all", ...allYears].map((y) => (
              <button
                key={y}
                onClick={() => setActiveYear(y)}
                style={filterBtnStyle(y === activeYear)}
              >
                {y === "all" ? "Tất cả năm" : y}
              </button>
            ))}
          </div>
        )}

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {["all", ...allTags].map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                style={tagBtnStyle(tag === activeTag)}
              >
                {tag === "all" ? "# Tất cả" : `#${tag}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Count ───────────────────────────────── */}
      <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
        {filtered.length} {filtered.length === 1 ? "ảnh" : "ảnh & video"}
        {filtered.length !== items.length ? ` / ${items.length} tổng cộng` : ""}
      </p>

      {/* ── Masonry / Polaroid grid ──────────────── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
          Không có ảnh nào với bộ lọc này
        </div>
      ) : (
        <div style={{
          columns: "2 160px",
          columnGap: "1rem",
        }}>
          {filtered.map((item) => {
            const lbIdx = getLightboxIndex(item);
            return (
              <div
                key={item.id}
                style={{
                  breakInside: "avoid",
                  marginBottom: "1rem",
                }}
              >
                <div
                  role={lbIdx !== null ? "button" : undefined}
                  tabIndex={lbIdx !== null ? 0 : undefined}
                  onClick={() => lbIdx !== null && setLightboxIndex(lbIdx)}
                  onKeyDown={(e) => {
                    if (lbIdx !== null && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      setLightboxIndex(lbIdx);
                    }
                  }}
                  style={{
                    background: "var(--color-surface)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "var(--shadow-sm)",
                    border: "1px solid var(--color-border)",
                    cursor: lbIdx !== null ? "pointer" : "default",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "";
                    (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)";
                  }}
                >
                  {/* Media */}
                  {item.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.signedUrl}
                      alt={item.memory_title}
                      loading="lazy"
                      style={{ width: "100%", display: "block", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ position: "relative", background: "#000", minHeight: 100 }}>
                      <video
                        src={item.signedUrl}
                        style={{ width: "100%", display: "block", maxHeight: 220, objectFit: "cover" }}
                        preload="metadata"
                        muted
                        playsInline
                      />
                      {/* Play icon overlay */}
                      <div style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                      }}>
                        <div style={{
                          width: 44, height: 44,
                          borderRadius: "50%",
                          background: "rgba(0,0,0,0.55)",
                          backdropFilter: "blur(6px)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.2rem",
                          color: "white",
                        }}>▶</div>
                      </div>
                    </div>
                  )}

                  {/* Caption */}
                  <div style={{ padding: "0.6rem 0.85rem 0.75rem" }}>
                    <p style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "var(--color-text)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      marginBottom: "2px",
                    }}>
                      {item.memory_title}
                    </p>
                    <p style={{ fontSize: "0.65rem", color: "var(--color-text-muted)" }}>
                      {formatVietnameseDate(item.memory_date)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && lightboxItems.length > 0 && (
        <Lightbox
          items={lightboxItems}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}

// ── Shared button styles ──────────────────────────
function filterBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: "5px 14px",
    borderRadius: "999px",
    fontSize: "0.8rem",
    fontWeight: 600,
    border: active ? "1.5px solid var(--color-primary)" : "1.5px solid var(--color-border)",
    background: active ? "var(--color-primary)" : "var(--color-surface)",
    color: active ? "white" : "var(--color-text-muted)",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontFamily: "var(--font-body)",
  };
}

function tagBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: "4px 12px",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.05em",
    border: active ? "1.5px solid var(--color-primary-dark)" : "1.5px solid var(--color-border)",
    background: active ? "var(--color-primary-bg)" : "transparent",
    color: active ? "var(--color-primary-dark)" : "var(--color-text-muted)",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontFamily: "var(--font-body)",
    textTransform: "uppercase" as const,
  };
}
