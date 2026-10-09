"use client";

/**
 * Trang offline - hiện khi mất kết nối mạng.
 * Cần "use client" vì có onClick handler.
 */
export default function OfflinePage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6 pt-safe pb-safe text-center">
      <div className="text-6xl mb-6">🌸</div>
      <h1 className="text-2xl font-heading mb-3" style={{ fontStyle: "italic" }}>
        Đang ngoại tuyến
      </h1>
      <p className="text-base max-w-xs" style={{ color: "var(--color-text-muted)" }}>
        Cần kết nối mạng để xem kỷ niệm của hai ta. Vui lòng kiểm tra lại
        đường truyền internet nhé 💕
      </p>
      <button
        onClick={() => window.location.reload()}
        className="btn btn-primary mt-8"
      >
        Thử lại
      </button>
    </main>
  );
}
