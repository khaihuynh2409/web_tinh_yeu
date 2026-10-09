"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

  const { error } = await supabase
    .from("goals")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("Error toggling goal:", error);
    return { error: "Không thể cập nhật mục tiêu" };
  }

  revalidatePath("/explore/goals");
  return { success: true };
}

export async function deleteGoal(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Bạn chưa đăng nhập" };
  }

  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting goal:", error);
    return { error: "Không thể xóa mục tiêu" };
  }

  revalidatePath("/explore/goals");
  return { success: true };
}
