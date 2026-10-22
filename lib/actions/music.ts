"use server";

import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";

// Helper functions to safely encode/decode unicode filenames to Base64Url
function encodeFileName(name: string) {
  const b64 = Buffer.from(name, 'utf8').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeFileName(safeName: string) {
  let b64 = safeName.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) {
    b64 += '=';
  }
  try {
    return Buffer.from(b64, 'base64').toString('utf8');
  } catch (e) {
    return safeName; // Fallback if it wasn't base64 encoded
  }
}

export async function getPlaylist() {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("memories").list("music");
  
  if (error || !data) return [];
  
  // Filter out any placeholders or empty files
  const validFiles = data.filter(f => f.name && f.id && !f.name.startsWith("."));
  
  if (validFiles.length === 0) return [];

  // Generate signed URLs for all files (valid for 1 year)
  const paths = validFiles.map(f => `music/${f.name}`);
  const { data: signedUrls, error: signedError } = await supabase.storage.from("memories").createSignedUrls(paths, 31536000);
  
  if (signedError || !signedUrls) return [];

  const tracks = validFiles.map((f, index) => {
    // Tên hiển thị: Bỏ tiền tố thời gian và phần mở rộng
    let baseName = f.name.replace(/^\d+_/, "");
    const extMatch = baseName.match(/\.[^.]+$/);
    const ext = extMatch ? extMatch[0] : "";
    baseName = baseName.replace(/\.[^.]+$/, ""); // Xóa đuôi

    // Decode Base64Url -> Tên gốc
    let displayName = decodeFileName(baseName);
    
    // Fallback cho các file cũ (chưa dùng base64)
    if (displayName === baseName && baseName.includes("%")) {
      try { displayName = decodeURIComponent(baseName); } catch(e) {}
    }
    displayName = displayName.replace(/_/g, " ");

    return {
      id: f.id,
      name: displayName,
      rawName: f.name,
      url: signedUrls[index]?.signedUrl || ""
    };
  });

  return tracks;
}

// File nhạc được upload thẳng từ trình duyệt lên Supabase Storage
// (Vercel giới hạn body request ~4.5MB nên không gửi file qua Server Action).
// Action này chỉ làm mới cache sau khi upload xong.
export async function refreshPlaylist() {
  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteMusicTrack(fileName: string) {
  const supabase = await createClient();
  const { error } = await supabase.storage
    .from("memories")
    .remove([`music/${fileName}`]);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}

export async function renameMusicTrack(oldFileName: string, newName: string) {
  const supabase = await createClient();
  
  // Create a safe new filename keeping the original timestamp if possible
  const timestampMatch = oldFileName.match(/^\d+_/);
  const prefix = timestampMatch ? timestampMatch[0] : `${Date.now()}_`;
  
  // Ensure it has .mp3 or similar extension if the user didn't provide one
  const extMatch = oldFileName.match(/\.[^.]+$/);
  const ext = extMatch ? extMatch[0] : '';
  
  let baseName = newName;
  if (baseName.endsWith(ext)) {
    baseName = baseName.slice(0, -ext.length);
  }

  const encodedSafeName = encodeFileName(baseName);
  const newFileName = `${prefix}${encodedSafeName}${ext}`;

  if (oldFileName === newFileName) return { success: true };

  const { error } = await supabase.storage
    .from("memories")
    .move(`music/${oldFileName}`, `music/${newFileName}`);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}
