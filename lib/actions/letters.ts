"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createLetter(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Bạn chưa đăng nhập" };
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const openAtDate = formData.get("open_date") as string; // YYYY-MM-DD
  const openAtTime = formData.get("open_time") as string; // HH:mm

  if (!content?.trim() || !openAtDate) {
    return { error: "Vui lòng nhập nội dung và ngày mở" };
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

  // Combine date and time
  const timeStr = openAtTime || "00:00";
  const openAtIso = new Date(`${openAtDate}T${timeStr}:00`).toISOString();

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

  revalidatePath("/explore/letters");
  return { success: true };
}
