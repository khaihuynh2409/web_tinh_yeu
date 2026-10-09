-- ============================================================
-- Script kích hoạt thành viên sau khi tạo user trong Auth dashboard
-- Chạy trong Supabase → SQL Editor
-- Thay UUID và tên thật của bạn trước khi chạy
-- ============================================================

-- Thay YOUR_USER_ID_HERE bằng UUID của bạn
-- (Lấy từ phần Authentication → Users)
SELECT public.activate_member(
  '31d0035e-5de7-4c15-909d-37eab1693d14'::UUID,
  'Our Love'
);

-- Kiểm tra kết quả xem đã kích hoạt thành công chưa
SELECT id, display_name, is_member, created_at
FROM public.profiles
ORDER BY created_at;
