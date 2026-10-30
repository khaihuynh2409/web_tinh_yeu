"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notifyPartner } from "@/lib/push/send";

export async function updateSettings(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const name_a = formData.get("name_a") as string;
  const name_b = formData.get("name_b") as string;
  const start_date = formData.get("start_date") as string;
  const theme = formData.get("theme") as string;

  if (!name_a || !name_b || !start_date || !theme) {
    throw new Error("Missing required fields");
  }

  const { error } = await supabase
    .from("couple_settings")
    .update({ name_a, name_b, start_date, theme })
    .eq("id", 1);

  if (error) {
    console.error("Error updating settings:", error);
    throw new Error("Failed to update settings");
  }

  await notifyPartner(user.id, {
    title: "Cài đặt đã thay đổi ⚙️",
    body: "Người ấy vừa cập nhật tên, ngày bắt đầu hoặc giao diện.",
    url: "/settings",
  });

  revalidatePath("/", "layout"); // Revalidate entire app to apply theme and names
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Lấy thông tin user hiện tại
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user || userError) {
    return { success: false, error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." };
  }

  // Validate mật khẩu mới
  if (newPassword.length < 6) {
    return { success: false, error: "Mật khẩu mới phải ít nhất 6 ký tự." };
  }
  if (currentPassword === newPassword) {
    return { success: false, error: "Mật khẩu mới phải khác mật khẩu hiện tại." };
  }

  // Xác minh mật khẩu hiện tại bằng cách thử đăng nhập lại
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });
  if (signInError) {
    return { success: false, error: "Mật khẩu hiện tại không đúng." };
  }

  // Đổi mật khẩu
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (updateError) {
    return { success: false, error: "Đổi mật khẩu thất bại. Vui lòng thử lại." };
  }

  return { success: true };
}

