import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware chạy trước mọi request:
 * 1. Refresh Supabase session (tự động gia hạn token)
 * 2. Chuyển hướng về /login nếu chưa đăng nhập (cho mọi route trừ auth pages)
 * 3. Chuyển hướng về / nếu đã đăng nhập và vào trang login
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Lấy user hiện tại (không throw error khi chưa đăng nhập)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Các path công khai không cần đăng nhập
  const publicPaths = ["/login", "/offline", "/manifest.webmanifest", "/sw.js"];
  const isPublicPath =
    publicPaths.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt";

  // Chưa đăng nhập → redirect về /login
  if (!user && !isPublicPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Đã đăng nhập mà vào /login → redirect về /
  if (user && pathname === "/login") {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.searchParams.delete("redirect");
    return NextResponse.redirect(homeUrl);
  }

  return supabaseResponse;
}
