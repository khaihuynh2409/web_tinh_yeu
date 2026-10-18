import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * Gỡ thiết bị khỏi danh sách nhận thông báo (khi tắt thông báo hoặc đăng xuất).
 * Chỉ xóa thiết bị thuộc về chính người đang đăng nhập.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    endpoint?: unknown;
  } | null;
  const endpoint = body?.endpoint;
  if (typeof endpoint !== "string" || endpoint.length > 2000) {
    return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_id", user.id);

  if (error) {
    console.error("[push] unsubscribe lỗi:", error);
    return NextResponse.json({ error: "Không thể gỡ thiết bị" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
