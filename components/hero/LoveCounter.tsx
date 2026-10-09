"use client";

import { useEffect, useState } from "react";
import { getExactTimeTogether } from "@/lib/utils/date";

export function LoveCounter({ startDate }: { startDate: string }) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTime(getExactTimeTogether(startDate));
    setMounted(true);
    const interval = setInterval(() => {
      setTime(getExactTimeTogether(startDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [startDate]);

  if (!mounted) {
    return (
      <div style={{ display: "flex", justifyContent: "center", gap: "1rem", margin: "2rem 0" }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ width: 72, height: 72, borderRadius: 12, background: "var(--color-surface-alt)" }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      gap: "1rem",
      margin: "2rem 0",
    }}>
      <TimeBox value={time.days} label="Ngày" />
      <TimeBox value={time.hours} label="Giờ" />
      <TimeBox value={time.minutes} label="Phút" />
      <TimeBox value={time.seconds} label="Giây" />
    </div>
  );
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "72px",
        height: "72px",
        borderRadius: "16px",
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-sm)",
        marginBottom: "0.4rem",
      }}>
        <span style={{
          fontSize: "1.75rem",
          fontWeight: 800,
          fontFamily: "var(--font-heading)",
          background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          {value.toString().padStart(2, "0")}
        </span>
      </div>
      <span style={{
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--color-text-muted)",
      }}>
        {label}
      </span>
    </div>
  );
}
