"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notifyPartner } from "@/lib/push/send";

export async function createLetter(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Bạn chưa đăng nhập" };
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (!content?.trim()) {
    return { error: "Vui lòng nhập nội dung thư" };
  }

  // Find partner
  const { data: partner } = await supabase
    .from("profiles")
    .select("id")
    .neq("id", user.id)
    .eq("is_member", true)
    .limit(1)
    .single();

  if (!partner) {
    return { error: "Chưa tìm thấy nửa kia trong hệ thống" };
  }

  // Thư vô thời hạn - có thể đọc ngay lập tức và vĩnh viễn
  const openAtIso = new Date(0).toISOString();

  const { error } = await supabase
    .from("letters")
    .insert({
      title: title?.trim() || "Thư gửi người ấy",
      content: content.trim(),
      open_at: openAtIso,
      from_user: user.id,
      to_user: partner.id
    });

  if (error) {
    console.error("Error creating letter:", error);
    return { error: "Không thể gửi thư" };
  }

  await notifyPartner(user.id, {
    title: "Bạn có thư mới 💌",
    body: "Người ấy vừa gửi cho bạn một bức thư.",
    url: "/explore/letters",
  });

  revalidatePath("/explore/letters");
  return { success: true };
}
