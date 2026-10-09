"use client";

import { useTransition } from "react";
import { deleteMedia } from "@/lib/actions/memories";
import { useConfirm } from "@/components/ui/ConfirmDialogProvider";

interface Props {
  mediaId: string;
  storagePath: string;
  memoryId: string;
}

export function DeleteMediaButton({ mediaId, storagePath, memoryId }: Props) {
  const [isPending, startTransition] = useTransition();
  const confirm = useConfirm();

  async function handleDelete() {
    const confirmed = await confirm("Xóa ảnh/video này?");
    if (!confirmed) return;
    startTransition(async () => {
      await deleteMedia(mediaId, storagePath, memoryId);
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      aria-label="Xóa media"
      style={{
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        background: "rgba(0,0,0,0.6)",
        border: "none",
        cursor: isPending ? "not-allowed" : "pointer",
        color: "white",
        fontSize: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      {isPending ? "…" : "✕"}
    </button>
  );
}
