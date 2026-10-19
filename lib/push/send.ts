import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/server";

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/** Trả về true nếu server đã cấu hình đủ khóa VAPID. */
export function isPushConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Gửi thông báo tới mọi thiết bị của một người dùng.
 * Không bao giờ throw - lỗi gửi thông báo không được làm hỏng thao tác chính.
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!isPushConfigured()) return;

  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:admin@example.com",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    const admin = createAdminClient();
    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", userId);

    if (!subs?.length) return;

    const body = JSON.stringify(payload);
    const expired: string[] = [];

    await Promise.all(
      subs.map(async (s: { id: string; endpoint: string; p256dh: string; auth: string }) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            body
          );
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) expired.push(s.id);
          else console.error("Push error:", status ?? err);
        }
      })
    );

    if (expired.length) {
      await admin.from("push_subscriptions").delete().in("id", expired);
    }
  } catch (err) {
    console.error("sendPushToUser failed:", err);
  }
}

/** Gửi thông báo tới người còn lại trong cặp đôi. */
export async function notifyPartner(fromUserId: string, payload: PushPayload) {
  if (!isPushConfigured()) return;
  const admin = createAdminClient();
  const { data: partner } = await admin
    .from("profiles")
    .select("id")
    .neq("id", fromUserId)
    .eq("is_member", true)
    .limit(1)
    .maybeSingle();
  if (partner) await sendPushToUser(partner.id, payload);
}
