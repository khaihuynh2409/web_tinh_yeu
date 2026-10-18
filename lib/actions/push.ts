"use server";

import { createClient } from "@/lib/supabase/server";
import { isPushConfigured, sendPushToUser } from "@/lib/push/send";

interface SubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Cho client biết server đã cấu hình VAPID chưa (README mục Thông báo). */
export async function getPushStatus() {
  return { configured: isPushConfigured() };
}

export async function savePushSubscription(sub: SubscriptionInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Bạn chưa đăng nhập" };

  if (!sub.endpoint || !sub.p256dh || !sub.auth) {
    return { error: "Dữ liệu đăng ký không hợp lệ" };
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    { user_id: user.id, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
    { onConflict: "endpoint" }
  );
  if (error) {
    console.error("savePushSubscription:", error);
    return { error: "Không thể lưu đăng ký thông báo" };
  }
  return { success: true };
}

export async function removePushSubscription(endpoint: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Bạn chưa đăng nhập" };

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_id", user.id);
  if (error) return { error: "Không thể tắt thông báo" };
  return { success: true };
}

export async function sendTestPush() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Bạn chưa đăng nhập" };
  if (!isPushConfigured()) return { error: "Server chưa cấu hình khóa VAPID" };

  await sendPushToUser(user.id, {
    title: "Nhật Ký Tình Yêu 💕",
    body: "Thông báo hoạt động rồi nè!",
    url: "/settings",
  });
  return { success: true };
}
