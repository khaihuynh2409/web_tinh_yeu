"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { notifyPartner } from "@/lib/push/send";

// ────────────────────────────────────────────────
// Kiểm tra thành viên (dùng trong mọi action)
// ────────────────────────────────────────────────
async function requireMember() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_member")
    .eq("id", user.id)
    .single();

  if (!profile?.is_member) {
    await supabase.auth.signOut();
    redirect("/login");
  }

  return { supabase, user };
}

// ────────────────────────────────────────────────
// Tạo kỷ niệm mới
// ────────────────────────────────────────────────
export async function createMemory(formData: FormData) {
  const { supabase, user } = await requireMember();

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const memoryDate = formData.get("memory_date") as string;
  const tagsRaw = formData.get("tags") as string;
  const tags = tagsRaw
    ? tagsRaw.split(",").map(t => t.trim().toLowerCase()).filter(Boolean)
    : [];

  const { data, error } = await supabase
    .from("memories")
    .insert({
      title,
      content: content || null,
      memory_date: memoryDate,
      tags,
      created_by: user.id
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await notifyPartner(user.id, {
    title: "Kỷ niệm mới 📸",
    body: title ? `Người ấy vừa thêm: ${title}` : "Người ấy vừa thêm một kỷ niệm mới.",
    url: `/memories/${data.id}`,
  });

  revalidatePath("/");
  redirect(`/memories/${data.id}`);
}

// ────────────────────────────────────────────────
// Cập nhật kỷ niệm
// ────────────────────────────────────────────────
export async function updateMemory(id: string, formData: FormData) {
  const { supabase } = await requireMember();

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const memoryDate = formData.get("memory_date") as string;
  const tagsRaw = formData.get("tags") as string;
  const tags = tagsRaw
    ? tagsRaw.split(",").map(t => t.trim().toLowerCase()).filter(Boolean)
    : [];

  const { error } = await supabase
    .from("memories")
    .update({ title, content: content || null, memory_date: memoryDate, tags, updated_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/memories/${id}`);
  redirect(`/memories/${id}`);
}

// ────────────────────────────────────────────────
// Xóa mềm kỷ niệm (chuyển vào thùng rác)
// ────────────────────────────────────────────────
export async function softDeleteMemory(id: string) {
  const { supabase } = await requireMember();

  const { error } = await supabase
    .from("memories")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  redirect("/");
}

// ────────────────────────────────────────────────
// Khôi phục từ thùng rác
// ────────────────────────────────────────────────
export async function restoreMemory(id: string) {
  const { supabase } = await requireMember();

  const { error } = await supabase
    .from("memories")
    .update({ deleted_at: null })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/trash");
  redirect(`/memories/${id}`);
}

// ────────────────────────────────────────────────
// Xóa vĩnh viễn (xóa cả media trong storage)
// ────────────────────────────────────────────────
export async function permanentDeleteMemory(id: string) {
  const { supabase } = await requireMember();

  // Lấy tất cả media paths của kỷ niệm này
  const { data: mediaList } = await supabase
    .from("media")
    .select("storage_path")
    .eq("memory_id", id);

  if (mediaList && mediaList.length > 0) {
    const paths = mediaList.map(m => m.storage_path);
    await supabase.storage.from("memories").remove(paths);
  }

  const { error } = await supabase
    .from("memories")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/trash");
  redirect("/trash");
}

// ────────────────────────────────────────────────
// Gắn media vào kỷ niệm (sau khi upload xong)
// ────────────────────────────────────────────────
export async function attachMedia(
  memoryId: string,
  storagePath: string,
  type: "image" | "video",
  sizeBytes: number
) {
  const { supabase } = await requireMember();

  const { error } = await supabase.from("media").insert({
    memory_id: memoryId,
    storage_path: storagePath,
    type,
    size_bytes: sizeBytes,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/memories/${memoryId}`);
}

// ────────────────────────────────────────────────
// Xóa 1 media
// ────────────────────────────────────────────────
export async function deleteMedia(mediaId: string, storagePath: string, memoryId: string) {
  const { supabase } = await requireMember();

  await supabase.storage.from("memories").remove([storagePath]);
  const { error } = await supabase.from("media").delete().eq("id", mediaId);
  if (error) throw new Error(error.message);

  revalidatePath(`/memories/${memoryId}`);
  revalidatePath(`/`);
}
