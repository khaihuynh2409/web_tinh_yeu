"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notifyPartner } from "@/lib/push/send";

export async function createQuiz(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Bạn chưa đăng nhập" };
  }

  const question = formData.get("question") as string;
  const answer = formData.get("answer") as string;
  const hint = formData.get("hint") as string;

  if (!question?.trim() || !answer?.trim()) {
    return { error: "Vui lòng nhập câu hỏi và câu trả lời" };
  }

  const { error } = await supabase
    .from("quiz_questions")
    .insert({
      question: question.trim(),
      answer: answer.trim(),
      hint: hint?.trim() || null,
      created_by: user.id,
    });

  if (error) {
    console.error("Error creating quiz:", error);
    return { error: "Không thể thêm câu hỏi" };
  }

  await notifyPartner(user.id, {
    title: "Câu đố mới ❓",
    body: `Người ấy vừa thêm câu hỏi: ${question.trim()}`,
    url: "/explore/quiz",
  });

  revalidatePath("/explore/quiz");
  return { success: true };
}

export async function deleteQuiz(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: "Unauthorized" };

  const { data, error } = await supabase
    .from("quiz_questions")
    .delete()
    .eq("id", id)
    .eq("created_by", user.id) // Only allow deleting own question
    .select("question")
    .maybeSingle();

  if (error) {
    return { error: "Không thể xóa câu hỏi này" };
  }

  await notifyPartner(user.id, {
    title: "Câu đố đã bị xóa 🗑️",
    body: data?.question ? `Người ấy vừa xóa câu hỏi: ${data.question}` : "Người ấy vừa xóa một câu hỏi.",
    url: "/explore/quiz",
  });

  revalidatePath("/explore/quiz");
  return { success: true };
}
