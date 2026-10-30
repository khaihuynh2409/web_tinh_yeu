This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Thông báo (Web Push)

Ứng dụng gửi thông báo cho nửa kia với **mọi thay đổi** mà một người thực hiện. Bật/tắt ở **Cài đặt → Thông báo** (mỗi thiết bị bật riêng).

Các thao tác có thông báo:

| Mục | Thêm | Sửa / cập nhật | Xóa |
|---|---|---|---|
| Kỷ niệm | ✅ | ✅ sửa nội dung, ✅ khôi phục từ thùng rác | ✅ xóa mềm, ✅ xóa vĩnh viễn |
| Ảnh / video | ✅ (tải nhiều file cùng lúc chỉ báo 1 lần) | – | ✅ |
| Thành tích | ✅ | – | ✅ |
| Wishlist | ✅ | ✅ sửa món, ✅ đánh dấu đã tặng | ✅ |
| Mục tiêu | ✅ | ✅ hoàn thành / bỏ hoàn thành | ✅ |
| Câu đố | ✅ | – | ✅ |
| Thư | ✅ | – | – |
| Nhạc nền | ✅ | ✅ đổi tên | ✅ |
| Cài đặt chung (tên, ngày, giao diện) | – | ✅ | – |

Đổi mật khẩu là việc riêng của mỗi người nên **không** gửi thông báo.

### Cấu hình trên server

1. Chạy migration `supabase/migrations/004_push_subscriptions.sql` trong Supabase SQL Editor.
2. Tạo cặp khóa VAPID:
   ```bash
   npx web-push generate-vapid-keys
   ```
3. Đặt các biến môi trường (`.env.local` hoặc trang cài đặt của Vercel):
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public key>
   VAPID_PRIVATE_KEY=<private key>
   VAPID_SUBJECT=mailto:email-cua-ban@example.com
   SUPABASE_SERVICE_ROLE_KEY=<service role key>
   ```
4. **Build/deploy lại** (biến `NEXT_PUBLIC_*` được nhúng lúc build).

### Lưu ý

- Service worker chỉ hoạt động ở bản production (`npm run build && npm start`) và cần HTTPS (hoặc localhost).
- iPhone (iOS 16.4+): phải “Thêm vào Màn hình chính” rồi mở app từ biểu tượng đó mới bật được thông báo.
- Nếu thấy “Chưa cấu hình khóa VAPID trên server” nghĩa là thiếu biến ở bước 3 hoặc chưa build lại.
