import type { Metadata, Viewport } from "next";
import { Playfair_Display, Nunito } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { getPlaylist } from "@/lib/actions/music";
import { Decorations } from "@/components/decorations/Decorations";
import { ConfirmDialogProvider } from "@/components/ui/ConfirmDialogProvider";
import { GlobalMusicPlayer } from "@/components/ui/GlobalMusicPlayer";
import "./globals.css";

// Font tiêu đề lãng mạn - hỗ trợ tiếng Việt đầy đủ dấu
const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  variable: "--font-heading",
  display: "swap",
});

// Font nội dung dễ đọc - hỗ trợ tiếng Việt
const nunito = Nunito({
  subsets: ["latin", "vietnamese"],
  variable: "--font-body",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // Hỗ trợ notch iPhone
  themeColor: "#F0FDF4",
};

export const metadata: Metadata = {
  title: "Nhật Ký Tình Yêu",
  description: "Không gian riêng tư của hai ta",
  // Chống lộ với công cụ tìm kiếm
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  // PWA meta
  applicationName: "Nhật Ký Tình Yêu",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nhật Ký",
  },
  formatDetection: {
    telephone: false,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("couple_settings").select("theme").eq("id", 1).single();
  const theme = settings?.theme || "flower";
  const playlist = await getPlaylist();

  return (
    <html lang="vi" className={`${playfair.variable} ${nunito.variable}`}>
      <head>
        {/* Security headers via meta tags */}
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
        <meta httpEquiv="X-Robots-Tag" content="noindex, nofollow" />

        {/* PWA iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Nhật Ký" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#F0FDF4" />
      </head>
      <body className="font-body antialiased">
        <ConfirmDialogProvider>
          <Decorations theme={theme} />
          <GlobalMusicPlayer playlist={playlist} />
          {children}
        </ConfirmDialogProvider>
      </body>
    </html>
  );
}
