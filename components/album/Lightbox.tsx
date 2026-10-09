"use client";

import { useEffect, useCallback, useState, useRef } from "react";

interface LightboxItem {
  url: string;
  type: "image" | "video";
  alt?: string;
}

interface LightboxProps {
  items: LightboxItem[];
  initialIndex: number;
  onClose: () => void;
}

export function Lightbox({ items, initialIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [isAnimating, setIsAnimating] = useState(false);

  // Touch / swipe state
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const prev = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIndex((i) => (i - 1 + items.length) % items.length);
    setTimeout(() => setIsAnimating(false), 250);
  }, [isAnimating, items.length]);

  const next = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIndex((i) => (i + 1) % items.length);
    setTimeout(() => setIsAnimating(false), 250);
  }, [isAnimating, items.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, prev, next]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Touch handlers for swipe
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only horizontal swipes
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) next();
      else prev();
    } else if (dy > 80 && Math.abs(dx) < 50) {
      // Swipe down to close
      onClose();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }

  const current = items[index];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.95)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label="Lightbox"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "max(1.25rem, env(safe-area-inset-top))",
          right: "1.25rem",
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "1.5px solid rgba(255,255,255,0.2)",
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(8px)",
          color: "white",
          fontSize: "1.3rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
        aria-label="Đóng"
      >
        ✕
      </button>

      {/* Counter */}
      {items.length > 1 && (
        <div style={{
          position: "absolute",
          top: "max(1.25rem, env(safe-area-inset-top))",
          left: "50%",
          transform: "translateX(-50%)",
          color: "rgba(255,255,255,0.7)",
          fontSize: "0.8rem",
          fontWeight: 600,
          letterSpacing: "0.05em",
          background: "rgba(0,0,0,0.4)",
          padding: "4px 14px",
          borderRadius: "999px",
          backdropFilter: "blur(8px)",
        }}>
          {index + 1} / {items.length}
        </div>
      )}

      {/* Media */}
      <div
        style={{
          maxWidth: "min(92vw, 1000px)",
          maxHeight: "80dvh",
          opacity: isAnimating ? 0.4 : 1,
          transition: "opacity 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {current.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.url}
            alt={current.alt ?? "Ảnh kỷ niệm"}
            style={{
              maxWidth: "100%",
              maxHeight: "80dvh",
              objectFit: "contain",
              borderRadius: "12px",
              boxShadow: "0 8px 60px rgba(0,0,0,0.8)",
            }}
            draggable={false}
          />
        ) : (
          <video
            src={current.url}
            controls
            autoPlay
            style={{
              maxWidth: "100%",
              maxHeight: "80dvh",
              borderRadius: "12px",
              boxShadow: "0 8px 60px rgba(0,0,0,0.8)",
            }}
          />
        )}
      </div>

      {/* Navigation arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            style={navBtnStyle("left")}
            aria-label="Ảnh trước"
          >
            ‹
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            style={navBtnStyle("right")}
            aria-label="Ảnh tiếp theo"
          >
            ›
          </button>
        </>
      )}

      {/* Dot indicators */}
      {items.length > 1 && items.length <= 20 && (
        <div style={{
          position: "absolute",
          bottom: "max(1.5rem, env(safe-area-inset-bottom))",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "6px",
        }}>
          {items.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIndex(i); }}
              style={{
                width: i === index ? 20 : 7,
                height: 7,
                borderRadius: "999px",
                border: "none",
                cursor: "pointer",
                transition: "all 0.25s ease",
                background: i === index ? "#88D4AB" : "rgba(255,255,255,0.3)",
                padding: 0,
              }}
              aria-label={`Ảnh ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function navBtnStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    [side]: "1rem",
    transform: "translateY(-50%)",
    width: 48,
    height: 48,
    borderRadius: "50%",
    border: "1.5px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(8px)",
    color: "white",
    fontSize: "1.8rem",
    lineHeight: 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    transition: "background 0.2s",
  };
}
