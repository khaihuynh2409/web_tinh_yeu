import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyPartner } from "@/lib/push/send";

// Helper functions to safely encode/decode unicode filenames to Base64Url
function encodeFileName(name: string) {
  const b64 = Buffer.from(name, 'utf8').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Báo cho nửa kia khi có ảnh/video mới. Khi tải nhiều file cùng lúc,
// chỉ gửi 1 thông báo cho cả lô: bỏ qua nếu người này đã thêm media
// vào cùng kỷ niệm trong vòng 2 phút trước đó.
async function notifyMediaAdded(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  memoryId: string,
  isVideo: boolean
) {
  try {
    const since = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("media")
      .select("id", { count: "exact", head: true })
      .eq("memory_id", memoryId)
      .eq("created_by", userId)
      .gte("created_at", since);

    // count đã bao gồm file vừa thêm; > 1 nghĩa là lô này đã được báo rồi
    if ((count ?? 0) > 1) return;

    const { data: memory } = await supabase
      .from("memories")
      .select("title")
      .eq("id", memoryId)
      .maybeSingle();

    const kind = isVideo ? "video" : "ảnh";
    await notifyPartner(userId, {
      title: isVideo ? "Video mới 🎬" : "Ảnh mới 🖼️",
      body: memory?.title
        ? `Người ấy vừa thêm ${kind} vào: ${memory.title}`
        : `Người ấy vừa thêm ${kind} mới.`,
      url: `/memories/${memoryId}`,
    });
  } catch (err) {
    console.error("notifyMediaAdded failed:", err);
  }
}

// POST /api/media - Upload file lên Supabase Storage
// Client nén ảnh trước khi gửi (browser-image-compression)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Kiểm tra is_member
    const { data: profile } = await supabase
      .from("profiles").select("is_member").eq("id", user.id).single();
    if (!profile?.is_member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const memoryId = formData.get("memory_id") as string;

    if (!file || !memoryId) {
      return NextResponse.json({ error: "Missing file or memory_id" }, { status: 400 });
    }

    // Giới hạn kích thước: 10MB cho ảnh, 50MB cho video
    const isVideo = file.type.startsWith("video/");
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: `File quá lớn (tối đa ${isVideo ? "50MB" : "10MB"})` }, { status: 400 });
    }

    // Path trong bucket: memories/{memory_id}/{timestamp}_{filename}
    const ext = file.name.split(".").pop() ?? "jpg";
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const safeName = encodeFileName(baseName) + "." + ext;
    const storagePath = `${memoryId}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("memories")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Lưu vào bảng media
    const { data: mediaRow, error: dbError } = await supabase.from("media").insert({
      memory_id: memoryId,
      storage_path: storagePath,
      type: isVideo ? "video" : "image",
      size_bytes: file.size,
      created_by: user.id,
    }).select("id").single();

    if (dbError) {
      console.error("DB insert error for media:", dbError);
      // Rollback: xóa file vừa upload nếu ghi DB thất bại
      await supabase.storage.from("memories").remove([storagePath]);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    await notifyMediaAdded(supabase, user.id, memoryId, isVideo);

    revalidatePath("/");
    revalidatePath(`/memories/${memoryId}`);

    return NextResponse.json({
      id: mediaRow.id,
      storage_path: storagePath,
      type: isVideo ? "video" : "image",
    });
  } catch (err) {
    console.error("Media upload error:", err);
    return NextResponse.json({ error: "Upload thất bại" }, { status: 500 });
  }
}

// GET /api/media?path=... - Lấy signed URL (1 giờ)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles").select("is_member").eq("id", user.id).single();
    if (!profile?.is_member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const path = request.nextUrl.searchParams.get("path");
    if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

    const { data, error } = await supabase.storage
      .from("memories")
      .createSignedUrl(path, 3600); // 1 giờ

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ url: data.signedUrl });
  } catch (err) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
