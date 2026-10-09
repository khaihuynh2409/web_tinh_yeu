import { useState, useRef, useEffect } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface Props {
  file?: File;
  imageUrl?: string;
  fileName?: string;
  onCropComplete: (croppedBlob: Blob, fileName: string) => void;
  onCancel: () => void;
}

export function ImageCropperModal({ file, imageUrl, fileName = "image.jpg", onCropComplete, onCancel }: Props) {
  const [imgSrc, setImgSrc] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setImgSrc(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else if (imageUrl) {
      setImgSrc(imageUrl);
    }
  }, [file, imageUrl]);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const cropSize = Math.min(width, height) * 0.8; // 80% crop box init
    setCrop({
      unit: "px",
      width: cropSize,
      height: cropSize,
      x: (width - cropSize) / 2,
      y: (height - cropSize) / 2,
    });
  }

  async function handleSave() {
    if (!completedCrop || !imgRef.current) return;
    
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    canvas.toBlob(blob => {
      if (blob) {
        onCropComplete(blob, fileName);
      }
    }, "image/jpeg", 1);
  }

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "rgba(0,0,0,0.85)",
      backdropFilter: "blur(4px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
    }}>
      <div style={{
        background: "var(--color-surface)",
        padding: "1.5rem",
        borderRadius: "24px",
        maxWidth: "90vw",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
      }}>
        <h3 style={{ margin: 0, fontFamily: "var(--font-heading)", color: "var(--color-text)", fontSize: "1.2rem" }}>
          Cắt ảnh trước khi lưu
        </h3>
        
        <div style={{ overflow: "auto", maxHeight: "60vh", borderRadius: "12px", background: "#000" }}>
          {!!imgSrc && (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                alt="Crop me"
                src={imgSrc}
                crossOrigin="anonymous"
                onLoad={onImageLoad}
                style={{ maxWidth: "100%", maxHeight: "60vh", display: "block" }}
              />
            </ReactCrop>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "0.5rem" }}>
          <button onClick={onCancel} style={{
            padding: "0.5rem 1.5rem", borderRadius: "999px",
            background: "transparent", color: "var(--color-text-muted)",
            border: "1px solid var(--color-border-strong)", cursor: "pointer", fontWeight: 700
          }}>
            Hủy
          </button>
          <button onClick={handleSave} disabled={!completedCrop?.width} style={{
            padding: "0.5rem 1.5rem", borderRadius: "999px",
            background: "var(--color-primary)", color: "white",
            border: "none", cursor: "pointer", fontWeight: 700
          }}>
            ✂️ Cắt & Tải lên
          </button>
        </div>
      </div>
    </div>
  );
}
