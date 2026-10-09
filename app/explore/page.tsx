import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/BottomNav";

const EXPLORE_CARDS = [
  {
    href: "/explore/reasons",
    title: "100 Lý do yêu nhau",
    description: "Lưu giữ những điều nhỏ bé khiến ta rung động",
    icon: "💝",
    color: "#FDE68A",
  },
  {
    href: "/explore/letters",
    title: "Thư hẹn giờ",
    description: "Gửi gắm tâm tư đến một ngày trong tương lai",
    icon: "✉️",
    color: "#A7F3D0",
  },
  {
    href: "/explore/goals",
    title: "Bucket List",
    description: "Những mục tiêu và dự định cùng nhau thực hiện",
    icon: "🎯",
    color: "#BAE6FD",
  },
  {
    href: "/explore/quiz",
    title: "Minigame",
    description: "Thử thách mức độ hiểu nhau",
    icon: "🎲",
    color: "#FECACA",
  }
];

export default async function ExplorePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main style={{
      minHeight: "100dvh",
      backgroundColor: "var(--color-bg)",
      padding: "0 1rem 6rem",
    }}>
      <div style={{ maxWidth: "640px", margin: "0 auto", paddingTop: "2rem" }}>
        <h1 style={{
          fontFamily: "var(--font-heading)",
          fontSize: "2rem",
          fontWeight: 800,
          color: "var(--color-text)",
          marginBottom: "0.25rem",
        }}>
          Khám phá ✨
        </h1>
        <p style={{
          color: "var(--color-text-muted)",
          fontSize: "0.9rem",
          marginBottom: "2rem",
        }}>
          Không gian riêng của hai đứa mình
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "1rem",
        }}>
          {EXPLORE_CARDS.map(card => (
            <a
              key={card.href}
              href={card.href}
              className="explore-card"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "20px",
                padding: "1.25rem",
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                boxShadow: "var(--shadow-sm)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: "16px",
                background: card.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.75rem",
              }}>
                {card.icon}
              </div>
              <div>
                <h3 style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "var(--color-text)",
                  margin: "0 0 0.25rem 0",
                }}>
                  {card.title}
                </h3>
                <p style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  margin: 0,
                  lineHeight: 1.4,
                }}>
                  {card.description}
                </p>
              </div>
            </a>
          ))}
        </div>

        {/* Other links */}
        <div style={{ marginTop: "3rem" }}>
          <h2 style={{
            fontSize: "1rem",
            fontWeight: 700,
            color: "var(--color-text)",
            marginBottom: "1rem",
          }}>
            Cài đặt & Khác
          </h2>
          <div style={{
            background: "var(--color-surface)",
            borderRadius: "16px",
            border: "1px solid var(--color-border)",
            overflow: "hidden",
          }}>
            <a href="/settings" style={{
              display: "flex",
              alignItems: "center",
              padding: "1rem",
              textDecoration: "none",
              color: "var(--color-text)",
              borderBottom: "1px solid var(--color-border)",
            }}>
              <span style={{ marginRight: "1rem", fontSize: "1.25rem" }}>⚙️</span>
              <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>Cài đặt cặp đôi</span>
            </a>
            <a href="/trash" style={{
              display: "flex",
              alignItems: "center",
              padding: "1rem",
              textDecoration: "none",
              color: "var(--color-text)",
            }}>
              <span style={{ marginRight: "1rem", fontSize: "1.25rem" }}>🗑️</span>
              <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>Thùng rác</span>
            </a>
          </div>
        </div>

      </div>
      <BottomNav active="/explore" />
    </main>
  );
}
