import { redirect } from "next/navigation";

// Album đã được gộp vào mục "Đa phương tiện"
export default function AlbumPage() {
  redirect("/media");
}
