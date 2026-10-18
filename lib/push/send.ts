import webpush from "web-push";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Gửi Web Push tới thiết bị của người còn lại (hoặc một người cụ thể).
 * CHỈ dùng ở server (Server Actions / Route Handlers).
 *
 * Thiếu biến môi trường VAPID → bỏ qua im lặng, không làm hỏng thao tác chính.
 */

export type NotifyKind =
  | "memory"
  | "achievement"
  | "letter"
  | "goal"
  | "goal_done"
  | "reason"
  | "quiz"
  | "test";

export interface NotifyInput {
  kind: NotifyKind;
  /** Người thực hiện hành động (sẽ KHÔNG nhận thông báo, trừ khi có toUserId) */
  actorId: string;
  /** Tiêu đề nội dung mới (tên kỷ niệm, thành tích...) */
  subject?: string;
  /** Trang mở ra khi bấm vào thông báo */
  url?: string;
  /** Chỉ gửi cho đúng người này (ví dụ: người nhận thư) */
  toUserId?: string;
}

interface SubRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

let vapidReady = false;

function ensureVapid(): boolean {
  if (vapidReady) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;

  const subject =
    process.env.VAPID_SUBJECT ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "mailto:admin@example.com";
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidReady = true;
    return true;
  } catch (err) {
    console.error("[push] VAPID config không hợp lệ:", err);
    return false;
  }
}

function truncate(text: string | undefined, max = 80): string {
  const t = (text ?? "").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function buildMessage(kind: NotifyKind, name: string, subject?: string) {
  const s = truncate(subject);
  switch (kind) {
    case "memory":
      return { title: "💕 Kỷ niệm mới", body: `${name} vừa thêm kỷ niệm "${s}"` };
    case "achievement":
      return { title: "🏆 Thành tích mới", body: `${name} vừa ghi lại thành tích "${s}"` };
    case "letter":
      // Không để lộ nội dung thư trong thông báo
      return { title: "✉️ Bạn có thư mới", body: `${name} vừa gửi cho bạn một lá thư` };
    case "goal":
      return { title: "🎯 Mục tiêu mới", body: `${name} vừa thêm mục tiêu "${s}"` };
    case "goal_done":
      return { title: "🎉 Hoàn thành mục tiêu", body: `${name} đã hoàn thành "${s}"` };
    case "reason":
      return { title: "💝 Lý do mới", body: `${name} vừa thêm một lý do yêu thương` };
    case "quiz":
      return { title: "🎲 Câu hỏi mới", body: `${name} vừa thêm câu hỏi cho minigame` };
    case "test":
      return { title: "🔔 Thông báo thử", body: "Thông báo đã hoạt động trên thiết bị này!" };
  }
}

export async function notifyPartner(input: NotifyInput): Promise<void> {
  try {
    if (!ensureVapid()) return;

    const admin = createAdminClient();

    let query = admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth");
    query = input.toUserId
      ? query.eq("user_id", input.toUserId)
      : query.neq("user_id", input.actorId);

    const { data } = await query;
    const subs = (data ?? []) as SubRow[];
    if (subs.length === 0) return;

    const { data: actor } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", input.actorId)
      .single();
    const name: string = actor?.display_name || "Người ấy";

    const { title, body } = buildMessage(input.kind, name, input.subject);
    const payload = JSON.stringify({ title, body, url: input.url ?? "/" });

    const expired: string[] = [];
    await Promise.allSettled(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
            { TTL: 60 * 60 * 24 }
          );
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          // 404/410: thiết bị đã huỷ đăng ký → dọn khỏi DB
          if (status === 404 || status === 410) expired.push(s.id);
          else console.error("[push] gửi thất bại:", status ?? err);
        }
      })
    );

    if (expired.length > 0) {
      await admin.from("push_subscriptions").delete().in("id", expired);
    }
  } catch (err) {
    console.error("[push] notifyPartner lỗi:", err);
  }
}

/**
 * Xếp việc gửi thông báo chạy SAU khi response đã trả về,
 * để thao tác của người dùng không bị chậm.
 */
export function queueNotify(input: NotifyInput): void {
  after(() => notifyPartner(input));
}
