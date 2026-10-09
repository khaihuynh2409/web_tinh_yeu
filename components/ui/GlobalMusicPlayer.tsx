"use client";
import { useState, useRef, useEffect } from "react";

interface Track {
  id: string | null;
  name: string;
  rawName: string;
  url: string;
}

export function GlobalMusicPlayer({ playlist }: { playlist: Track[] }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current || playlist.length === 0) return;
    
    if (isPlaying) {
      audioRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentIndex, playlist]);

  // Handle volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  if (playlist.length === 0) return null;
  const currentTrack = playlist[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % playlist.length);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? playlist.length - 1 : prev - 1));
    setIsPlaying(true);
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={currentTrack?.url}
        onEnded={handleNext}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
      />

      <div style={{
        position: "fixed",
        bottom: "80px", // Above bottom nav
        right: "16px",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "0.5rem"
      }}>
        {/* Expanded Player Card */}
        <div style={{
          background: "var(--color-surface)",
          padding: "1rem",
          borderRadius: "16px",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--color-border)",
          width: "280px",
          display: isMinimized ? "none" : "flex",
          flexDirection: "column",
          gap: "1rem",
          transformOrigin: "bottom right",
          animation: "scaleIn 0.2s ease-out"
        }}>
          {/* Custom Song Selector */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                width: "100%", padding: "0.5rem", borderRadius: "8px",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg)",
                color: "var(--color-text)",
                fontSize: "0.9rem",
                textAlign: "left",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                cursor: "pointer"
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {playlist[currentIndex]?.name || "Chọn bài hát..."}
              </span>
              <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>{isDropdownOpen ? "▼" : "▲"}</span>
            </button>
            
            {isDropdownOpen && (
              <ul style={{
                position: "absolute",
                bottom: "calc(100% + 4px)", // Opens upwards
                left: 0,
                width: "100%",
                maxHeight: "200px",
                overflowY: "auto",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                padding: "0.25rem 0",
                margin: 0,
                listStyle: "none",
                boxShadow: "0 -4px 12px rgba(0,0,0,0.1)",
                zIndex: 60
              }}>
                {playlist.map((track, idx) => (
                  <li 
                    key={track.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsPlaying(true);
                      setIsDropdownOpen(false);
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLLIElement).style.background = "var(--color-bg)";
                    }}
                    onMouseLeave={(e) => {
                      if (idx !== currentIndex) {
                        (e.currentTarget as HTMLLIElement).style.background = "transparent";
                      } else {
                        (e.currentTarget as HTMLLIElement).style.background = "var(--color-primary-light)";
                      }
                    }}
                    style={{
                      padding: "0.5rem 0.75rem",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      background: idx === currentIndex ? "var(--color-primary-light)" : "transparent",
                      color: idx === currentIndex ? "var(--color-primary-dark)" : "var(--color-text)",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                    }}
                  >
                    {track.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Progress Bar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <input 
              type="range" 
              min={0} 
              max={duration || 100} 
              value={progress} 
              onChange={handleSeek}
              style={{ width: "100%", accentColor: "var(--color-primary-dark)" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls & Volume */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <button onClick={handlePrev} style={controlBtnStyle}>⏮</button>
              <button 
                onClick={togglePlay} 
                style={{ ...controlBtnStyle, background: "var(--color-primary)", color: "var(--color-text)", padding: "0.4rem", width: "36px", height: "36px" }}
              >
                {isPlaying ? "⏸" : "▶"}
              </button>
              <button onClick={handleNext} style={controlBtnStyle}>⏭</button>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "80px" }}>
              <span style={{ fontSize: "0.8rem" }}>🔊</span>
              <input 
                type="range" 
                min={0} 
                max={1} 
                step={0.05}
                value={volume} 
                onChange={(e) => setVolume(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--color-primary-dark)" }}
              />
            </div>
          </div>
        </div>

        {/* Toggle Minimized Button */}
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          style={{
            width: "48px", height: "48px",
            borderRadius: "50%", background: isMinimized ? "var(--color-bg)" : "var(--color-primary)",
            border: "1px solid var(--color-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            boxShadow: "var(--shadow-md)",
            animation: (isMinimized && isPlaying) ? "pulse 2s infinite" : "none",
            fontSize: "1.4rem",
            color: isMinimized ? "inherit" : "var(--color-text)"
          }}
          title="Nhạc nền"
        >
          🎵
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(var(--color-primary-rgb), 0.4); }
          70% { box-shadow: 0 0 0 12px rgba(var(--color-primary-rgb), 0); }
          100% { box-shadow: 0 0 0 0 rgba(var(--color-primary-rgb), 0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}

const controlBtnStyle = {
  background: "none", border: "none",
  color: "var(--color-primary-dark)",
  fontSize: "1.2rem", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  width: "32px", height: "32px", borderRadius: "50%",
  padding: 0
};
