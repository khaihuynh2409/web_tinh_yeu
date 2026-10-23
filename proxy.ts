import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * TẮT / BẬT TRANG WEB
 * - true  → chặn toàn bộ truy cập, mọi request trả về trang "tạm ngưng" (503)
 * - false → web hoạt động bình thường
 *
 * Đổi giá trị rồi commit + deploy lại để áp dụng.
 */
const SITE_DISABLED = false;

const MAINTENANCE_HTML = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Tạm ngưng hoạt động</title>
<style>
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
         font-family: system-ui, -apple-system, sans-serif; background: #fff5f7; color: #4a2c35; text-align: center; padding: 16px; }
  h1 { font-size: 1.5rem; margin: 0 0 8px; }
  p { margin: 0; opacity: .75; }
</style>
</head>
<body>
  <div>
    <h1>Trang web đang tạm ngưng hoạt động</h1>
    <p>Vui lòng quay lại sau.</p>
  </div>
</body>
</html>`;

/**
 * Next.js Proxy (trước là middleware) - chạy trước mọi request.
 * Bảo vệ tất cả routes, chỉ cho phép truy cập khi đã đăng nhập.
 * 
 * NOTE: Next.js 16 đổi tên từ middleware.ts → proxy.ts
 */
export async function proxy(request: NextRequest) {
  if (SITE_DISABLED) {
    return new NextResponse(MAINTENANCE_HTML, {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Retry-After": "86400",
      },
    });
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match mọi path trừ:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets (icons, manifest, robots.txt)
     */
    "/((?!_next/static|_next/image|favicon.ico|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|webmanifest)$).*)",
  ],
};
