"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notifyPartner } from "@/lib/push/send";

// Chỉ chấp nhận link http(s) để tránh javascript: URL
function normalizeLink(raw: string | undefined): string | null | undefined {
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

export async function createWish(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Bạn chưa đăng nhập" };
  }

  const title = (formData.get("title") as string)?.trim();
  const note = (formData.get("note") as string)?.trim();
  const price = (formData.get("price") as string)?.trim();
  const link = normalizeLink((formData.get("link") as string)?.trim());

  if (!title) {
    return { error: "Vui lòng nhập tên món bạn thích" };
  }
  if (link === undefined) {
    return { error: "Link không hợp lệ" };
  }

  const { error } = await supabase.from("wishlist_items").insert({
    title,
    note: note || null,
    price: price || null,
    link,
    created_by: user.id,
  });

  if (error) {
    console.error("Error creating wish:", error);
    return { error: "Không thể thêm vào wishlist" };
  }

  await notifyPartner(user.id, {
    title: "Wishlist mới 🎁",
    body: `Người ấy vừa thích: ${title}`,
    url: "/explore/wishlist",
  });

  revalidatePath("/explore/wishlist");
  return { success: true };
}

export async function updateWish(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Bạn chưa đăng nhập" };
  }

  const title = (formData.get("title") as string)?.trim();
  const note = (formData.get("note") as string)?.trim();
  const price = (formData.get("price") as string)?.trim();
  const link = normalizeLink((formData.get("link") as string)?.trim());

  if (!title) {
    return { error: "Vui lòng nhập tên món bạn thích" };
  }
  if (link === undefined) {
    return { error: "Link không hợp lệ" };
  }

  const { error } = await supabase
    .from("wishlist_items")
    .update({
      title,
      note: note || null,
      price: price || null,
      link,
    })
    .eq("id", id)
    .eq("created_by", user.id); // Chỉ sửa món của mình

  if (error) {
    console.error("Error updating wish:", error);
    return { error: "Không thể lưu thay đổi" };
  }

  await notifyPartner(user.id, {
    title: "Wishlist được chỉnh sửa ✏️",
    body: `Người ấy vừa sửa món: ${title}`,
    url: "/explore/wishlist",
  });

  revalidatePath("/explore/wishlist");
  return { success: true };
}

export async function toggleWishGifted(id: string, isGifted: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Bạn chưa đăng nhập" };
  }

  const { data, error } = await supabase
    .from("wishlist_items")
    .update({ is_gifted: isGifted })
    .eq("id", id)
    .select("title")
    .maybeSingle();

  if (error) {
    console.error("Error updating wish:", error);
    return { error: "Không thể cập nhật" };
  }

  const name = data?.title ? `: ${data.title}` : " một món trong wishlist";
  await notifyPartner(user.id, {
    title: isGifted ? "Đã tặng quà 🎉" : "Cập nhật wishlist 🎁",
    body: isGifted
      ? `Người ấy vừa đánh dấu đã tặng${name}`
      : `Người ấy vừa bỏ đánh dấu đã tặng${name}`,
    url: "/explore/wishlist",
  });

  revalidatePath("/explore/wishlist");
  return { success: true };
}

export async function deleteWish(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Bạn chưa đăng nhập" };
  }

  const { data, error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("id", id)
    .eq("created_by", user.id) // Chỉ xóa món của mình
    .select("title")
    .maybeSingle();

  if (error) {
    console.error("Error deleting wish:", error);
    return { error: "Không thể xóa món này" };
  }

  await notifyPartner(user.id, {
    title: "Wishlist đã bị xóa 🗑️",
    body: data?.title ? `Người ấy vừa xóa món: ${data.title}` : "Người ấy vừa xóa một món trong wishlist.",
    url: "/explore/wishlist",
  });

  revalidatePath("/explore/wishlist");
  return { success: true };
}
