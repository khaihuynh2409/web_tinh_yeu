"use client";

import { useRouter } from "next/navigation";

export function TimelineSort({ currentSort }: { currentSort: string }) {
  const router = useRouter();
  
  return (
    <select 
      value={currentSort}
      onChange={(e) => {
        const val = e.target.value;
        router.push(`/?sort=${val}`);
      }}
      style={{
        padding: "0.3rem 0.5rem",
        borderRadius: "8px",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        color: "var(--color-text)",
        fontSize: "0.85rem",
        outline: "none",
        cursor: "pointer"
      }}
    >
      <option value="newest">Mới nhất</option>
      <option value="oldest">Lâu nhất</option>
    </select>
  );
}
