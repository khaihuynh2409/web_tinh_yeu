import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js Proxy (trước là middleware) - chạy trước mọi request.
 * Bảo vệ tất cả routes, chỉ cho phép truy cập khi đã đăng nhập.
 * 
 * NOTE: Next.js 16 đổi tên từ middleware.ts → proxy.ts
 */
export async function proxy(request: NextRequest) {
  // Chế độ bảo trì: đặt MAINTENANCE_MODE=true để tạm tắt web, xoá/đặt false để bật lại.
  if (process.env.MAINTENANCE_MODE === "true") {
    return new NextResponse(
      `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Đang bảo trì</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center"><div><h1>Web đang tạm nghỉ 💤</h1><p>Mình sẽ quay lại sớm nhé.</p></div></body></html>`,
      {
        status: 503,
        headers: { "Content-Type": "text/html; charset=utf-8", "Retry-After": "3600" },
      },
    );
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
