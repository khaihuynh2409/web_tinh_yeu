"use client";

import { useEffect, useState } from "react";
import "./animations.css";

interface Props {
  theme: string;
}

export function Decorations({ theme }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Render varying number of items based on screen width to avoid cluttering mobile
  const particleCount = typeof window !== "undefined" && window.innerWidth < 768 ? 15 : 30;
  const particles = Array.from({ length: particleCount }, (_, i) => i);

  if (theme === "flower") {
    return (
      <div className="decorations-container" aria-hidden="true">
        {particles.map((i) => {
          const style = {
            left: `${Math.random() * 100}vw`,
            animationDuration: `${Math.random() * 5 + 5}s`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: Math.random() * 0.5 + 0.3,
            transform: `scale(${Math.random() * 0.6 + 0.4})`,
          };
          return <div key={i} className="petal" style={style} />;
        })}
      </div>
    );
  }

  if (theme === "starnight") {
    return (
      <div className="decorations-container" aria-hidden="true">
        {particles.map((i) => {
          const style = {
            left: `${Math.random() * 100}vw`,
            top: `${Math.random() * 100}vh`,
            animationDuration: `${Math.random() * 3 + 2}s`,
            animationDelay: `${Math.random() * 2}s`,
            opacity: Math.random() * 0.6 + 0.2,
          };
          return <div key={i} className="star" style={style} />;
        })}
      </div>
    );
  }

  if (theme === "pastel") {
    return (
      <div className="decorations-container" aria-hidden="true">
        {particles.slice(0, 10).map((i) => {
          const style = {
            left: `${Math.random() * 100}vw`,
            animationDuration: `${Math.random() * 8 + 8}s`,
            animationDelay: `${Math.random() * 5}s`,
            width: `${Math.random() * 60 + 20}px`,
            height: `${Math.random() * 60 + 20}px`,
            opacity: Math.random() * 0.3 + 0.1,
          };
          return <div key={i} className="bubble" style={style} />;
        })}
      </div>
    );
  }

  return null;
}
