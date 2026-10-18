"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAchievement, deleteAchievement } from "@/lib/actions/achievements";
import { useConfirm } from "@/components/ui/ConfirmDialogProvider";

interface Achievement {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  achieved_date: string; // YYYY-MM-DD
  is_shared: boolean;
  achieved_by: string | null;
  created_by: string | null;
}

interface Profile {
  id: string;
  display_name: string;
}

interface Props {
  initialItems: Achievement[];
  profiles: Profile[];
  currentUserId: string;
}

type Filter = "all" | "me" | "partner" | "both";
type Scope = "me" | "partner" | "both";

const ICONS = ["🏆", "🎓", "💼", "💪", "🎨", "📚", "✈️", "🏅", "🎉", "💻", "🏠", "🌱"];

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

export function AchievementList({ initialItems, profiles, currentUserId }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const [items, setItems] = useState<Achievement[]>(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [showForm, setShowForm] = useState(false);
  const [icon, setIcon] = useState(ICONS[0]);
  const [scope, setScope] = useState<Scope>("me");
  const [date, setDate] = useState("");

  const partner = profiles.find((p) => p.id !== currentUserId);
  const partnerName = partner?.display_name ?? "Người ấy";

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // Ngày mặc định = hôm nay theo giờ máy (tránh lệch múi giờ giữa server và client)
  useEffect(() => {
    setDate(new Date().toLocaleDateString("en-CA"));
  }, []);

  function ownerOf(item: Achievement): Scope {
    if (item.is_shared) return "both";
    return item.achieved_by === currentUserId ? "me" : "partner";
  }

  function ownerLabel(item: Achievement) {
    const owner = ownerOf(item);
    if (owner === "both") return "👫 Cả hai";
    if (owner === "me") return "🙋 Bạn";
    return `💕 ${partnerName}`;
  }

  const counts = useMemo(() => {
    const c = { all: items.length, me: 0, partner: 0, both: 0 };
    items.forEach((i) => {
      c[ownerOf(i)]++;
    });
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, currentUserId]);

  const groups = useMemo(() => {
    const filtered = items.filter((i) => filter === "all" || ownerOf(i) === filter);
    const byYear = new Map<string, Achievement[]>();
    filtered.forEach((i) => {
      const year = i.achieved_date.slice(0, 4);
      byYear.set(year, [...(byYear.get(year) ?? []), i]);
    });
    return Array.from(byYear.entries()).sort((a, b) => Number(b[0]) - Number(a[0]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, filter, currentUserId]);

  function handleAdd(formData: FormData) {
    setError(null);
    formData.set("icon", icon);
    formData.set("scope", scope);
    formData.set("achieved_date", date);

    startTransition(async () => {
      const res = await createAchievement(formData);
      if (res?.error) {
        setError(res.error);
        return;
      }
      formRef.current?.reset();
      setIcon(ICONS[0]);
      setScope("me");
      setShowForm(false);
      router.refresh();
    });
  }

  async function handleDelete(id: string) {
    const ok = await confirm("Xóa thành tích này?");
    if (!ok) return;

    const previous = items;
    setItems((prev) => prev.filter((i) => i.id !== id));

    startTransition(async () => {
      const res = await deleteAchievement(id);
      if (res?.error) {
        setError(res.error);
        setItems(previous);
      }
    });
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "8px",
    border: "1px solid var(--color-border)",
    background: "var(--color-bg)",
    color: "var(--color-text)",
    fontFamily: "inherit",
    marginBottom: "0.75rem",
  };

  const chip = (active: boolean): React.CSSProperties => ({
    padding: "0.4rem 0.9rem",
    borderRadius: "999px",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    border: active ? "1px solid var(--color-primary-dark)" : "1px solid var(--color-border)",
    background: active ? "var(--color-primary)" : "var(--color-surface)",
    color: "var(--color-text)",
  });

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: `Tất cả (${counts.all})` },
    { key: "me", label: `Của bạn (${counts.me})` },
    { key: "partner", label: `${partnerName} (${counts.partner})` },
    { key: "both", label: `Cả hai (${counts.both})` },
  ];

  return (
    <div>
      {error && (
        <div
          style={{
            padding: "0.75rem",
            background: "#FEE2E2",
            color: "#991B1B",
            borderRadius: "12px",
            marginBottom: "1rem",
            fontSize: "0.85rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Nút thêm / form */}
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          style={{
            width: "100%",
            padding: "0.85rem",
            borderRadius: "14px",
            border: "none",
            background: "var(--color-primary)",
            color: "var(--color-text)",
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: "pointer",
            boxShadow: "var(--shadow-sm)",
            marginBottom: "1.5rem",
          }}
        >
          + Thêm thành tích
        </button>
      ) : (
        <form
          ref={formRef}
          action={handleAdd}
          style={{
            background: "var(--color-surface)",
            padding: "1.25rem",
            borderRadius: "16px",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-sm)",
            marginBottom: "1.5rem",
          }}
        >
          <h3 style={{ fontSize: "1rem", margin: "0 0 1rem", color: "var(--color-text)" }}>
            Thành tích mới
          </h3>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.9rem" }}>
            {ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setIcon(ic)}
                aria-pressed={icon === ic}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "12px",
                  fontSize: "1.25rem",
                  cursor: "pointer",
                  border:
                    icon === ic
                      ? "2px solid var(--color-primary-dark)"
                      : "1px solid var(--color-border)",
                  background: icon === ic ? "var(--color-primary-bg)" : "var(--color-bg)",
                }}
              >
                {ic}
              </button>
            ))}
          </div>

          <input
            type="text"
            name="title"
            placeholder="Tên thành tích (VD: Tốt nghiệp loại giỏi)"
            required
            maxLength={120}
            style={inputStyle}
          />
          <textarea
            name="description"
            placeholder="Mô tả thêm (không bắt buộc)"
            rows={2}
            maxLength={1000}
            style={{ ...inputStyle, resize: "none" }}
          />

          <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "0.35rem" }}>
            Ngày đạt được
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            style={inputStyle}
          />

          <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "0.35rem" }}>
            Ai đạt được?
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
            {(
              [
                ["me", "🙋 Bạn"],
                ["partner", `💕 ${partnerName}`],
                ["both", "👫 Cả hai"],
              ] as [Scope, string][]
            ).map(([key, label]) => (
              <button key={key} type="button" onClick={() => setScope(key)} style={chip(scope === key)}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                flex: 1,
                padding: "0.75rem",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                background: "transparent",
                color: "var(--color-text-muted)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isPending || !date}
              style={{
                flex: 2,
                padding: "0.75rem",
                borderRadius: "8px",
                border: "none",
                background: "var(--color-primary)",
                color: "var(--color-text)",
                fontWeight: 700,
                cursor: isPending ? "wait" : "pointer",
                opacity: isPending ? 0.7 : 1,
              }}
            >
              {isPending ? "Đang lưu..." : "Lưu thành tích"}
            </button>
          </div>
        </form>
      )}

      {/* Bộ lọc */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          overflowX: "auto",
          paddingBottom: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        {filters.map((f) => (
          <button key={f.key} type="button" onClick={() => setFilter(f.key)} style={chip(filter === f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Danh sách theo năm */}
      {groups.map(([year, list]) => (
        <section key={year} style={{ marginBottom: "1.5rem" }}>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--color-primary-dark)",
              margin: "0 0 0.75rem",
            }}
          >
            {year}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {list.map((item) => (
              <article
                key={item.id}
                style={{
                  background: "var(--color-surface)",
                  padding: "1rem",
                  borderRadius: "16px",
                  border: "1px solid var(--color-border)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.9rem",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "14px",
                    background: "var(--color-primary-bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: "0 0 0.2rem", fontSize: "1.05rem", color: "var(--color-text)" }}>
                    {item.title}
                  </h3>
                  {item.description && (
                    <p
                      style={{
                        margin: "0 0 0.4rem",
                        fontSize: "0.85rem",
                        color: "var(--color-text-muted)",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {item.description}
                    </p>
                  )}
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-primary-dark)", fontWeight: 600 }}>
                    {ownerLabel(item)} · {formatDate(item.achieved_date)}
                  </p>
                </div>
                {item.created_by === currentUserId && (
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    title="Xóa"
                    aria-label="Xóa thành tích"
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--color-text-light)",
                      fontSize: "1.2rem",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                  >
                    ×
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}

      {groups.length === 0 && (
        <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "2rem 0" }}>
          {items.length === 0
            ? "Chưa có thành tích nào. Hãy ghi lại điều đầu tiên nhé! 🏆"
            : "Không có thành tích nào trong mục này."}
        </p>
      )}
    </div>
  );
}
