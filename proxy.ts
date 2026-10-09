import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js Proxy (trước là middleware) - chạy trước mọi request.
 * Bảo vệ tất cả routes, chỉ cho phép truy cập khi đã đăng nhập.
 * 
 * NOTE: Next.js 16 đổi tên từ middleware.ts → proxy.ts
 */
export async function proxy(request: NextRequest) {
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
