"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { queueNotify } from "@/lib/push/send";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function createAchievement(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Bạn chưa đăng nhập" };
  }

  const title = ((formData.get("title") as string) ?? "").trim();
  const description = ((formData.get("description") as string) ?? "").trim();
  const icon = ((formData.get("icon") as string) ?? "").trim() || "🏆";
  const achievedDate = (formData.get("achieved_date") as string) ?? "";
  const scope = (formData.get("scope") as string) ?? "me"; // me | partner | both

  if (!title) return { error: "Vui lòng nhập tên thành tích" };
  if (title.length > 120) return { error: "Tên thành tích tối đa 120 ký tự" };
  if (description.length > 1000) return { error: "Mô tả tối đa 1000 ký tự" };
  if (icon.length > 8) return { error: "Biểu tượng không hợp lệ" };
  if (!DATE_RE.test(achievedDate)) return { error: "Ngày không hợp lệ" };
  if (!["me", "partner", "both"].includes(scope)) {
    return { error: "Người đạt thành tích không hợp lệ" };
  }

  let achievedBy: string | null = user.id;
  const isShared = scope === "both";

  if (isShared) {
    achievedBy = null;
  } else if (scope === "partner") {
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
    achievedBy = partner.id;
  }

  const { error } = await supabase.from("achievements").insert({
    title,
    description: description || null,
    icon,
    achieved_date: achievedDate,
    is_shared: isShared,
    achieved_by: achievedBy,
    created_by: user.id,
  });

  if (error) {
    console.error("Error creating achievement:", error);
    return { error: "Không thể lưu thành tích" };
  }

  queueNotify({
    kind: "achievement",
    actorId: user.id,
    subject: title,
    url: "/achievements",
  });

  revalidatePath("/achievements");
  return { success: true };
}

export async function deleteAchievement(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Bạn chưa đăng nhập" };
  }

  const { error } = await supabase
    .from("achievements")
    .delete()
    .eq("id", id)
    .eq("created_by", user.id); // Chỉ xóa thành tích do mình tạo

  if (error) {
    console.error("Error deleting achievement:", error);
    return { error: "Không thể xóa thành tích" };
  }

  revalidatePath("/achievements");
  return { success: true };
}
