import { redirect } from "next/navigation";

// Video đã được gộp vào mục "Đa phương tiện"
export default function VideosPage() {
  redirect("/media?tab=video");
}
