import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

// Serwist chỉ active khi build production (không hỗ trợ Turbopack dev mode)
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
  // Khai báo turbopack rỗng để tắt lỗi webpack config
  turbopack: {},

  // Tăng giới hạn upload file cho Server Actions (cho nhạc nền)
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Chặn lộ với search engines
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          // Chống clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Chống MIME sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Chống lộ referrer
          { key: "Referrer-Policy", value: "no-referrer" },
          // HSTS (active khi deploy HTTPS)
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Supabase API + WebSocket realtime
              `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://*.supabase.co"} wss://*.supabase.co`,
              // Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              // Scripts (Next.js cần unsafe-eval trong dev)
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              // Images từ Supabase Storage (signed URLs)
              `img-src 'self' data: blob: ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://*.supabase.co"}`,
              // Media (video/audio)
              `media-src 'self' blob: ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://*.supabase.co"}`,
              // Service worker
              "worker-src 'self' blob:",
            ].join("; "),
          },
          // Permissions Policy - không cần camera/mic/geo
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/**",
      },
    ],
  },
};

export default withSerwist(nextConfig);
