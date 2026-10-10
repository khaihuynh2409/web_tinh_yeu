import { formatVietnameseDate } from "@/lib/utils/date";

type Memory = {
  id: string;
  title: string;
  content: string | null;
  memory_date: string;
  tags: string[];
  coverUrl?: string;
  coverType?: "image" | "video";
};

export function TimelineList({ memories, startDate }: { memories: Memory[], startDate: string }) {
  if (memories.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "0.75rem", opacity: 0.4 }}>📖</div>
        <h3 style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1.2rem",
          color: "var(--color-text)",
          marginBottom: "0.5rem",
        }}>
          Chưa có kỷ niệm nào
        </h3>
        <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
          Hãy cùng nhau viết nên những kỷ niệm đầu tiên nhé!
        </p>
      </div>
    );
  }

  return (
    <div style={{
      position: "relative",
      maxWidth: "680px",
      margin: "3rem auto 6rem",
      paddingLeft: "2rem",
    }}>
      {/* Đường dọc timeline */}
      <div style={{
        position: "absolute",
        left: "6px",
        top: 0,
        bottom: 0,
        width: "2px",
        background: "linear-gradient(to bottom, var(--color-primary-light), transparent)",
        borderRadius: "1px",
      }} />

      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        {memories.map((memory) => {
          const memDate = new Date(memory.memory_date);
          const startDt = new Date(startDate);
          let dayNumberStr = "";
          if (memDate >= startDt) {
            const diff = Math.ceil(Math.abs(memDate.getTime() - startDt.getTime()) / 86400000) + 1;
            dayNumberStr = `Ngày thứ ${diff}`;
          }

          return (
            <div key={memory.id} style={{ position: "relative" }}>
              {/* Chấm tròn */}
              <div style={{
                position: "absolute",
                left: "-26px",
                top: "16px",
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                border: "3px solid var(--color-primary)",
                backgroundColor: "var(--color-bg)",
                zIndex: 1,
              }} />

              {/* Card */}
              <a href={`/memories/${memory.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  position: "relative",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "20px",
                  boxShadow: "var(--shadow-md)",
                  display: "flex",
                  flexWrap: "wrap",
                  overflow: "hidden",
                  color: "inherit",
                }}>
                  {/* Vùng Text */}
                  <div style={{
                    flex: "999 1 280px",
                    padding: "1.25rem 1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative", // Chứa nút sửa
                  }}>
                    {/* Nút sửa (bút chì) */}
                    <object>
                      <a 
                        href={`/memories/${memory.id}/edit`}
                        style={{
                          position: "absolute",
                          top: "1.25rem",
                          right: "1.5rem",
                          fontSize: "0.9rem",
                          textDecoration: "none",
                          cursor: "pointer",
                          zIndex: 10,
                          background: "rgba(0,0,0,0.4)",
                          backdropFilter: "blur(4px)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          width: "32px",
                          height: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "50%",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
                        }}
                        title="Sửa kỷ niệm"
                      >
                        ✏️
                      </a>
                    </object>
                    <p style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--color-primary)",
                      marginBottom: "0.25rem",
                    }}>
                      {formatVietnameseDate(memory.memory_date)}
                      {dayNumberStr && (
                        <span style={{ color: "var(--color-text-muted)", marginLeft: "0.5rem" }}>
                          · {dayNumberStr}
                        </span>
                      )}
                    </p>

                    <h3 style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "1.45rem",
                      fontWeight: 800,
                      color: "var(--color-text)",
                      letterSpacing: "0.02em",
                      marginBottom: memory.content ? "0.5rem" : 0,
                      paddingRight: "2rem",
                    }}>
                      {memory.title}
                    </h3>

                    {memory.content && (
                      <p style={{
                        fontSize: "0.9rem",
                        color: "var(--color-text-muted)",
                        lineHeight: 1.6,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        marginBottom: "0.75rem",
                      }}>
                        {memory.content}
                      </p>
                    )}

                    {memory.tags && memory.tags.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "auto" }}>
                        {memory.tags.map(tag => (
                          <span key={tag} style={{
                            padding: "2px 10px",
                            borderRadius: "999px",
                            fontSize: "10px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            background: "var(--color-primary-bg)",
                            color: "var(--color-primary-dark)",
                            border: "1px solid var(--color-border-strong)",
                          }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Vùng Ảnh/Video (bên phải) */}
                  {memory.coverUrl && (
                    <div style={{
                      flex: "1 1 240px",
                      minHeight: "220px",
                      position: "relative",
                      background: "var(--color-surface-alt)",
                      borderLeft: "1px solid var(--color-border-strong)",
                    }}>
                      {memory.coverType === "video" ? (
                        <video 
                          src={memory.coverUrl} 
                          style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} 
                          autoPlay 
                          muted 
                          loop 
                          playsInline
                        />
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img 
                          src={memory.coverUrl} 
                          alt="Cover" 
                          style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} 
                          loading="lazy" 
                        />
                      )}
                    </div>
                  )}
                </div>
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
