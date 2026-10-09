import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Route handler để đăng xuất an toàn.
 * Dùng POST để tránh CSRF qua GET.
 */
export async function POST() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  const response = NextResponse.redirect(
    new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    { status: 302 }
  );

  return response;
}
