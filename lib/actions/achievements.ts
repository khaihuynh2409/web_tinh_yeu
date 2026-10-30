"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notifyPartner } from "@/lib/push/send";

export async function createAchievement(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Bạn chưa đăng nhập" };
  }

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const icon = (formData.get("icon") as string)?.trim() || "🏆";
  const achievedAt = formData.get("achieved_at") as string;

  if (!title) {
    return { error: "Vui lòng nhập tên thành tích" };
  }

  const { error } = await supabase.from("achievements").insert({
    title,
    description: description || null,
    icon,
    achieved_at: achievedAt || new Date().toISOString().split("T")[0],
    created_by: user.id,
  });

  if (error) {
    console.error("Error creating achievement:", error);
    return { error: "Không thể thêm thành tích" };
  }

  await notifyPartner(user.id, {
    title: "Thành tích mới 🏆",
    body: `Người ấy vừa thêm: ${title}`,
    url: "/achievements",
  });

  revalidatePath("/achievements");
  return { success: true };
}

export async function deleteAchievement(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Bạn chưa đăng nhập" };
  }

  const { data, error } = await supabase
    .from("achievements")
    .delete()
    .eq("id", id)
    .select("title")
    .maybeSingle();

  if (error) {
    console.error("Error deleting achievement:", error);
    return { error: "Không thể xóa thành tích" };
  }

  await notifyPartner(user.id, {
    title: "Thành tích đã bị xóa 🗑️",
    body: data?.title ? `Người ấy vừa xóa: ${data.title}` : "Người ấy vừa xóa một thành tích.",
    url: "/achievements",
  });

  revalidatePath("/achievements");
  return { success: true };
}
