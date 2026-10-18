import { redirect } from "next/navigation";

// Video đã được gộp vào trang Đa phương tiện
export default function VideosPage() {
  redirect("/media?tab=videos");
}
