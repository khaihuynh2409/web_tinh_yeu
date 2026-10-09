"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageCropperModal } from "./ImageCropperModal";
import { deleteMedia } from "@/lib/actions/memories";

interface Props {
  mediaId: string;
  storagePath: string;
  memoryId: string;
  imageUrl: string;
}

export function CropExistingMediaButton({ mediaId, storagePath, memoryId, imageUrl }: Props) {
  const [isCropping, setIsCropping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  async function handleCropComplete(croppedBlob: Blob, fileName: string) {
    setIsCropping(false);
    setIsUploading(true);
    try {
      const croppedFile = new File([croppedBlob], fileName, { type: croppedBlob.type || "image/jpeg" });

      const formData = new FormData();
      formData.append("file", croppedFile, fileName);
      formData.append("memory_id", memoryId);

      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const json = await res.json() as { id?: string; error?: string };

      if (!res.ok) throw new Error(json.error ?? "Upload thất bại");

      // Xóa ảnh cũ
      await deleteMedia(mediaId, storagePath, memoryId);

      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi lưu ảnh cắt!");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsCropping(true)}
        disabled={isUploading}
        style={{
          background: "rgba(0,0,0,0.6)",
          border: "none",
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          backdropFilter: "blur(4px)",
          opacity: isUploading ? 0.5 : 0.8,
          transition: "opacity 0.2s",
        }}
        title="Cắt ảnh"
      >
        <span style={{ fontSize: "14px" }}>✂️</span>
      </button>

      {isCropping && (
        <ImageCropperModal
          imageUrl={imageUrl}
          fileName="cropped.jpg"
          onCropComplete={handleCropComplete}
          onCancel={() => setIsCropping(false)}
        />
      )}
    </>
  );
}
