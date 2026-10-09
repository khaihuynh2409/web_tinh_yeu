import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Callback route cho OAuth / Magic Link (nếu dùng sau này).
 * Hiện tại dùng cho email+password nên ít dùng route này.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Lỗi → về trang login với thông báo
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
