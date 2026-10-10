"use client";

import { useState } from "react";
import { Lightbox } from "@/components/album/Lightbox";
import { DeleteMediaButton } from "./DeleteMediaButton";
import { CropExistingMediaButton } from "./CropExistingMediaButton";

interface MediaItem {
  id: string;
  type: "image" | "video";
  signedUrl: string;
  storagePath: string;
  memoryId: string;
}

interface Props {
  mediaItems: MediaItem[];
}

export function MemoryMediaGallery({ mediaItems }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Only images go into the lightbox
  const imageItems = mediaItems.filter((m) => m.type === "image");
  const lightboxItems = imageItems.map((m) => ({
    url: m.signedUrl,
    type: "image" as const,
    alt: "Ảnh kỷ niệm",
  }));

  function getImageLightboxIndex(item: MediaItem): number | null {
    if (item.type !== "image") return null;
    return imageItems.findIndex((m) => m.id === item.id);
  }

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: "0.75rem",
        }}
      >
        {mediaItems.map((m) => {
          const lbIdx = getImageLightboxIndex(m);
          return (
            <div
              key={m.id}
              style={{
                position: "relative",
                borderRadius: "12px",
                overflow: "hidden",
                aspectRatio: "1",
                background: "var(--color-surface-alt)",
                boxShadow: "var(--shadow-sm)",
                border: "1px solid var(--color-border)",
              }}
            >
              {m.type === "image" && m.signedUrl ? (
                <button
                  onClick={() => lbIdx !== null && setLightboxIndex(lbIdx)}
                  style={{
                    width: "100%",
                    height: "100%",
                    padding: 0,
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    display: "block",
                  }}
                  aria-label="Phóng to ảnh"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.signedUrl}
                    alt="Ảnh kỷ niệm"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    loading="lazy"
                  />
                </button>
              ) : m.type === "video" && m.signedUrl ? (
                <video
                  src={m.signedUrl}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  controls
                  preload="metadata"
                  playsInline
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    fontSize: "2rem",
                  }}
                >
                  ⚠️
                </div>
              )}

              {/* Action overlay */}
              <div
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                  display: "flex",
                  gap: "6px",
                }}
              >
                {m.type === "image" && m.signedUrl && (
                  <CropExistingMediaButton
                    mediaId={m.id}
                    storagePath={m.storagePath}
                    memoryId={m.memoryId}
                    imageUrl={m.signedUrl}
                  />
                )}
                <DeleteMediaButton
                  mediaId={m.id}
                  storagePath={m.storagePath}
                  memoryId={m.memoryId}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && lightboxItems.length > 0 && (
        <Lightbox
          items={lightboxItems}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      <style>{`
        video:fullscreen {
          object-fit: contain !important;
        }
        video:-webkit-full-screen {
          object-fit: contain !important;
        }
      `}</style>
    </>
  );
}
