"use client";

import { useState, useTransition, useRef } from "react";
import { uploadMusicTrack, deleteMusicTrack, renameMusicTrack } from "@/lib/actions/music";
import { useConfirm } from "@/components/ui/ConfirmDialogProvider";

interface Track {
  id: string | null;
  name: string;
  rawName: string;
  url: string;
}

export function MusicManager({ playlist }: { playlist: Track[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const confirm = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const res = await uploadMusicTrack(formData);
      if (res.error) setError(res.error);
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  };

  const handleDelete = async (fileName: string) => {
    const confirmed = await confirm("Bạn có chắc chắn muốn xóa bài hát này khỏi danh sách phát?");
    if (!confirmed) return;

    startTransition(async () => {
      const res = await deleteMusicTrack(fileName);
      if (res.error) setError(res.error);
    });
  };

  const handleStartEdit = (track: Track) => {
    setEditingTrackId(track.id);
    setEditName(track.name);
  };

  const handleSaveEdit = (track: Track) => {
    if (!editName.trim() || editName === track.name) {
      setEditingTrackId(null);
      return;
    }
    
    startTransition(async () => {
      const res = await renameMusicTrack(track.rawName, editName);
      if (res.error) setError(res.error);
      setEditingTrackId(null);
    });
  };

  return (
    <div style={{
      background: "var(--color-surface)", padding: "1.5rem",
      borderRadius: "20px", boxShadow: "var(--shadow-md)",
      border: "1px solid var(--color-border)",
      marginTop: "2rem",
      position: "relative", zIndex: 10
    }}>
      <h2 style={{
        margin: "0 0 1rem", fontSize: "1.25rem", color: "var(--color-text)", fontWeight: 700
      }}>
        🎵 Nhạc nền
      </h2>
      <p style={{ margin: "0 0 1.5rem", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
        Tải lên các bài hát yêu thích. Nhạc sẽ tự động phát ngẫu nhiên trên toàn bộ ứng dụng.
      </p>

      {error && (
        <div style={{ color: "red", fontSize: "0.9rem", marginBottom: "1rem" }}>{error}</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {playlist.map(track => (
          <div key={track.id} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "var(--color-bg)", padding: "0.75rem 1rem",
            borderRadius: "12px", border: "1px solid var(--color-border)",
            gap: "0.5rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>💿</span>
              
              {editingTrackId === track.id ? (
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onBlur={() => handleSaveEdit(track)}
                  onKeyDown={e => {
                    if (e.key === "Enter") handleSaveEdit(track);
                    if (e.key === "Escape") setEditingTrackId(null);
                  }}
                  style={{
                    flex: 1, minWidth: 0,
                    padding: "0.25rem 0.5rem",
                    borderRadius: "6px",
                    border: "1px solid var(--color-primary)",
                    outline: "none",
                    fontSize: "0.95rem",
                    background: "var(--color-surface)"
                  }}
                />
              ) : (
                <span 
                  onDoubleClick={() => handleStartEdit(track)}
                  style={{ 
                    fontSize: "0.95rem", color: "var(--color-text)", fontWeight: 600,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    cursor: "text"
                  }}
                  title="Nhấn đúp để đổi tên"
                >
                  {track.name}
                </span>
              )}
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexShrink: 0 }}>
              {editingTrackId === track.id ? (
                <button
                  onClick={() => handleSaveEdit(track)}
                  disabled={isPending}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }}
                  title="Lưu"
                >✅</button>
              ) : (
                <button
                  onClick={() => handleStartEdit(track)}
                  disabled={isPending}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }}
                  title="Đổi tên"
                >✏️</button>
              )}
              
              <button
                onClick={() => handleDelete(track.rawName)}
                disabled={isPending}
                style={{
                  background: "none", border: "none", color: "var(--color-text-light)",
                  cursor: isPending ? "wait" : "pointer", padding: "0.25rem", fontSize: "1.2rem",
                  opacity: isPending ? 0.5 : 1
                }}
                title="Xóa"
              >
                ×
              </button>
            </div>
          </div>
        ))}
        {playlist.length === 0 && (
          <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--color-text-muted)", fontSize: "0.9rem", background: "var(--color-bg)", borderRadius: "12px" }}>
            Chưa có bài hát nào. Hãy tải lên nhé!
          </div>
        )}
      </div>

      <input 
        type="file" 
        accept="audio/*" 
        style={{ display: "none" }} 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isPending}
        style={{
          width: "100%", padding: "0.85rem", borderRadius: "12px",
          border: "2px dashed var(--color-primary)", background: "transparent",
          color: "var(--color-primary-dark)", fontWeight: 700,
          cursor: isPending ? "wait" : "pointer",
          opacity: isPending ? 0.7 : 1,
          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"
        }}
      >
        {isPending ? "Đang xử lý..." : "⬆️ Tải nhạc lên"}
      </button>
    </div>
  );
}
