"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notifyPartner } from "@/lib/push/send";

export async function createGoal(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Bạn chưa đăng nhập" };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  if (!title?.trim()) {
    return { error: "Vui lòng nhập tên mục tiêu" };
  }

  const { error } = await supabase
    .from("goals")
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      created_by: user.id,
      done: false
    });

  if (error) {
    console.error("Error creating goal:", error);
    return { error: "Không thể tạo mục tiêu" };
  }

  await notifyPartner(user.id, {
    title: "Mục tiêu mới 🎯",
    body: `Người ấy vừa thêm mục tiêu: ${title.trim()}`,
    url: "/explore/goals",
  });

  revalidatePath("/explore/goals");
  return { success: true };
}

export async function toggleGoal(id: string, isDone: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Bạn chưa đăng nhập" };
  }

  const updateData = isDone ? {
    done: true,
    done_by: user.id,
    done_at: new Date().toISOString()
  } : {
    done: false,
    done_by: null,
    done_at: null
  };

  const { data, error } = await supabase
    .from("goals")
    .update(updateData)
    .eq("id", id)
    .select("title")
    .maybeSingle();

  if (error) {
    console.error("Error toggling goal:", error);
    return { error: "Không thể cập nhật mục tiêu" };
  }

  const name = data?.title ? `: ${data.title}` : " một mục tiêu";
  await notifyPartner(user.id, {
    title: isDone ? "Hoàn thành mục tiêu 🎉" : "Cập nhật mục tiêu 🎯",
    body: isDone
      ? `Người ấy vừa hoàn thành${name}`
      : `Người ấy vừa bỏ đánh dấu hoàn thành${name}`,
    url: "/explore/goals",
  });

  revalidatePath("/explore/goals");
  return { success: true };
}

export async function deleteGoal(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Bạn chưa đăng nhập" };
  }

  const { data, error } = await supabase
    .from("goals")
    .delete()
    .eq("id", id)
    .select("title")
    .maybeSingle();

  if (error) {
    console.error("Error deleting goal:", error);
    return { error: "Không thể xóa mục tiêu" };
  }

  await notifyPartner(user.id, {
    title: "Mục tiêu đã bị xóa 🗑️",
    body: data?.title ? `Người ấy vừa xóa mục tiêu: ${data.title}` : "Người ấy vừa xóa một mục tiêu.",
    url: "/explore/goals",
  });

  revalidatePath("/explore/goals");
  return { success: true };
}
