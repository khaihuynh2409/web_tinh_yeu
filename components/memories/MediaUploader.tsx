"use client";

import { useState, useRef } from "react";
import imageCompression from "browser-image-compression";
import { ImageCropperModal } from "./ImageCropperModal";

interface Props {
  memoryId: string;
  onUploadComplete?: () => void;
}

interface UploadedFile {
  id: string;
  name: string;
  type: "image" | "video";
  previewUrl?: string;
  status: "uploading" | "done" | "error";
  errorMsg?: string;
}

export function MediaUploader({ memoryId, onUploadComplete }: Props) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [cropQueue, setCropQueue] = useState<File[]>([]);

  async function uploadSingleFile(file: File, isVideo: boolean, fileName: string) {
    const tempId = `${Date.now()}_${Math.random()}`;

    setFiles(prev => [...prev, {
      id: tempId,
      name: fileName,
      type: isVideo ? "video" : "image",
      previewUrl: !isVideo ? URL.createObjectURL(file) : undefined,
      status: "uploading",
    }]);

    try {
      let uploadFile = file;

      // Nén ảnh phía client trước khi upload
      if (!isVideo && file.size > 500 * 1024) {
        uploadFile = await imageCompression(file, {
          maxSizeMB: 1.5,
          maxWidthOrHeight: 2000,
          useWebWorker: true,
          fileType: file.type || "image/jpeg",
        }) as File;
      }

      const formData = new FormData();
      formData.append("file", uploadFile, fileName);
      formData.append("memory_id", memoryId);

      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const json = await res.json() as { id?: string; error?: string };

      if (!res.ok) throw new Error(json.error ?? "Upload thất bại");

      setFiles(prev => prev.map(f =>
        f.id === tempId ? { ...f, id: json.id!, status: "done" } : f
      ));

      onUploadComplete?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định";
      setFiles(prev => prev.map(f =>
        f.id === tempId ? { ...f, status: "error", errorMsg: msg } : f
      ));
    }
  }

  function processFiles(fileList: FileList) {
    const newFiles = Array.from(fileList);
    const images = newFiles.filter(f => f.type.startsWith("image/"));
    const videos = newFiles.filter(f => f.type.startsWith("video/"));

    if (videos.length > 0) {
      videos.forEach(v => uploadSingleFile(v, true, v.name));
    }

    if (images.length > 0) {
      setCropQueue(prev => [...prev, ...images]);
    }
  }

  function handleCropComplete(blob: Blob, fileName: string) {
    const croppedFile = new File([blob], fileName, { type: blob.type || "image/jpeg" });
    uploadSingleFile(croppedFile, false, fileName);
    setCropQueue(prev => prev.slice(1));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
  }

  return (
    <div style={{ marginTop: "2rem" }}>
      <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
        📷 Ảnh & Video
      </p>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragging ? "var(--color-primary)" : "var(--color-border-strong)"}`,
          borderRadius: "16px",
          padding: "2rem 1rem",
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "var(--color-primary-bg)" : "var(--color-surface)",
          transition: "all 0.2s ease",
          marginBottom: "1rem",
        }}
      >
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📁</div>
        <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", margin: 0 }}>
          Kéo thả ảnh/video vào đây, hoặc <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>chọn file</span>
        </p>
        <p style={{ fontSize: "0.75rem", color: "var(--color-text-light)", marginTop: "0.25rem" }}>
          Ảnh tự động nén · Tối đa 10MB/ảnh · 50MB/video
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          style={{ display: "none" }}
          onChange={e => e.target.files && processFiles(e.target.files)}
        />
      </div>

      {/* Preview danh sách */}
      {files.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "0.75rem" }}>
          {files.map(f => (
            <div
              key={f.id}
              style={{
                position: "relative",
                aspectRatio: "1",
                borderRadius: "12px",
                overflow: "hidden",
                background: "var(--color-surface-alt)",
                border: `2px solid ${f.status === "error" ? "#f87171" : f.status === "done" ? "var(--color-primary-light)" : "var(--color-border)"}`,
              }}
            >
              {f.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={f.previewUrl}
                  alt={f.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "2rem" }}>
                  🎬
                </div>
              )}

              {/* Overlay trạng thái */}
              <div style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: f.status === "uploading" ? "rgba(0,0,0,0.4)" : "transparent",
                transition: "background 0.2s",
              }}>
                {f.status === "uploading" && (
                  <div style={{
                    width: 24, height: 24,
                    border: "3px solid white",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }} />
                )}
                {f.status === "done" && (
                  <div style={{
                    position: "absolute", bottom: 4, right: 4,
                    background: "var(--color-primary)",
                    borderRadius: "50%",
                    width: 20, height: 20,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "10px",
                  }}>✓</div>
                )}
                {f.status === "error" && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "0.5rem" }}>
                    <div style={{ fontSize: "1.5rem" }}>⚠️</div>
                    <div style={{ fontSize: "10px", color: "white", textAlign: "center", marginTop: "4px", background: "rgba(0,0,0,0.7)", padding: "2px 4px", borderRadius: "4px" }}>
                      {f.errorMsg || "Lỗi"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {cropQueue.length > 0 && (
        <ImageCropperModal
          file={cropQueue[0]}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropQueue(prev => prev.slice(1))}
        />
      )}
    </div>
  );
}
