import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyPartner } from "@/lib/push/send";

/**
 * Gửi thông báo thử tới CHÍNH người đang đăng nhập (mọi thiết bị đã bật).
 * Dùng nút "Gửi thử" trong Cài đặt để kiểm tra cấu hình.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await notifyPartner({
    kind: "test",
    actorId: user.id,
    toUserId: user.id,
    url: "/settings",
  });

  return NextResponse.json({ success: true });
}
