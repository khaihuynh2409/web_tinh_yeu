import { redirect } from "next/navigation";

// Album ảnh đã được gộp vào trang Đa phương tiện
export default function AlbumPage() {
  redirect("/media?tab=images");
}
