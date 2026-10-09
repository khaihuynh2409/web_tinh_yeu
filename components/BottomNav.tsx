"use client";

// Bottom navigation bar dùng chung
const NAV_ITEMS = [
  { href: "/", label: "Nhà", icon: "🏠" },
  { href: "/album", label: "Album", icon: "🖼️" },
  { href: "/memories/new", label: "Thêm", icon: "✚", primary: true },
  { href: "/videos", label: "Video", icon: "🎬" },
  { href: "/explore", label: "Khám phá", icon: "✨" },
];

export function BottomNav({ active }: { active?: string }) {
  return (
    <nav
      role="navigation"
      aria-label="Điều hướng chính"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--color-border)",
        paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.href;
        if (item.primary) {
          return (
            <a
              key={item.href}
              href={item.href}
              aria-label={item.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textDecoration: "none",
                gap: "2px",
                padding: "0.5rem",
              }}
            >
              <div style={{
                width: 50,
                height: 50,
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                boxShadow: "0 4px 16px rgba(176, 216, 192, 0.45)",
                marginTop: "-20px",
                border: "3px solid var(--color-bg)",
                color: "var(--color-text)",
                fontWeight: 700,
                fontFamily: "var(--font-body)",
              }}>
                {item.icon}
              </div>
              <span style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "var(--color-primary-dark)",
              }}>
                {item.label}
              </span>
            </a>
          );
        }
        return (
          <a
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textDecoration: "none",
              gap: "2px",
              padding: "0.5rem 0.75rem",
              borderRadius: "12px",
              transition: "background 0.2s",
              minWidth: 52,
            }}
          >
            <span style={{
              fontSize: "1.3rem",
              filter: isActive ? "none" : "grayscale(0.3)",
              opacity: isActive ? 1 : 0.6,
              transition: "all 0.2s",
            }}>
              {item.icon}
            </span>
            <span style={{
              fontSize: "10px",
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "var(--color-primary-dark)" : "var(--color-text-muted)",
              transition: "color 0.2s",
            }}>
              {item.label}
            </span>
          </a>
        );
      })}
    </nav>
  );
}
