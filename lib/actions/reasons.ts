"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { queueNotify } from "@/lib/push/send";

export async function createReason(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Bạn chưa đăng nhập" };
  }

  const content = formData.get("content") as string;

  if (!content?.trim()) {
    return { error: "Vui lòng nhập nội dung lý do" };
  }

  const { error } = await supabase
    .from("reasons")
    .insert({
      content: content.trim(),
      created_by: user.id,
    });

  if (error) {
    console.error("Error creating reason:", error);
    return { error: "Không thể thêm lý do" };
  }

  queueNotify({
    kind: "reason",
    actorId: user.id,
    subject: content.trim(),
    url: "/explore/reasons",
  });

  revalidatePath("/explore/reasons");
  return { success: true };
}

export async function deleteReason(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Bạn chưa đăng nhập" };
  }

  const { error } = await supabase
    .from("reasons")
    .delete()
    .eq("id", id)
    .eq("created_by", user.id); // Only allow deleting own reason

  if (error) {
    console.error("Error deleting reason:", error);
    return { error: "Không thể xóa lý do này" };
  }

  revalidatePath("/explore/reasons");
  return { success: true };
}
