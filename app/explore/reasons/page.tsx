import { redirect } from "next/navigation";

// Mục "100 Lý do yêu nhau" đã được thay bằng Wishlist
export default function ReasonsPage() {
  redirect("/explore/wishlist");
}
