-- ============================================================
-- Migration 002: Hàm bảo mật + RLS Policies
-- ============================================================

-- ============================================================
-- HÀM IS_MEMBER() - Kiểm tra người dùng có phải thành viên không
-- SECURITY DEFINER + search_path cố định để tránh injection
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_member()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_member = TRUE
  );
$$;

-- Grant execute chỉ cho authenticated users
REVOKE ALL ON FUNCTION public.is_member() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_member() TO authenticated;

-- ============================================================
-- ENABLE RLS trên TẤT CẢ bảng
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES: profiles
-- ============================================================
DROP POLICY IF EXISTS "members_select_profiles" ON public.profiles;
CREATE POLICY "members_select_profiles" ON public.profiles
  FOR SELECT USING (public.is_member());

DROP POLICY IF EXISTS "members_update_own_profile" ON public.profiles;
CREATE POLICY "members_update_own_profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id AND public.is_member())
  WITH CHECK (auth.uid() = id AND public.is_member());

-- Không cho INSERT/DELETE profile từ client (trigger tự tạo)

-- ============================================================
-- POLICIES: couple_settings
-- ============================================================
DROP POLICY IF EXISTS "members_select_settings" ON public.couple_settings;
CREATE POLICY "members_select_settings" ON public.couple_settings
  FOR SELECT USING (public.is_member());

DROP POLICY IF EXISTS "members_update_settings" ON public.couple_settings;
CREATE POLICY "members_update_settings" ON public.couple_settings
  FOR UPDATE USING (public.is_member())
  WITH CHECK (public.is_member());

-- ============================================================
-- POLICIES: memories
-- ============================================================
DROP POLICY IF EXISTS "members_select_memories" ON public.memories;
CREATE POLICY "members_select_memories" ON public.memories
  FOR SELECT USING (public.is_member());

DROP POLICY IF EXISTS "members_insert_memories" ON public.memories;
CREATE POLICY "members_insert_memories" ON public.memories
  FOR INSERT WITH CHECK (
    public.is_member() AND auth.uid() = created_by
  );

DROP POLICY IF EXISTS "members_update_memories" ON public.memories;
CREATE POLICY "members_update_memories" ON public.memories
  FOR UPDATE USING (public.is_member())
  WITH CHECK (public.is_member());

DROP POLICY IF EXISTS "members_delete_memories" ON public.memories;
CREATE POLICY "members_delete_memories" ON public.memories
  FOR DELETE USING (public.is_member());

-- ============================================================
-- POLICIES: media
-- ============================================================
DROP POLICY IF EXISTS "members_select_media" ON public.media;
CREATE POLICY "members_select_media" ON public.media
  FOR SELECT USING (public.is_member());

DROP POLICY IF EXISTS "members_insert_media" ON public.media;
CREATE POLICY "members_insert_media" ON public.media
  FOR INSERT WITH CHECK (
    public.is_member() AND auth.uid() = created_by
  );

DROP POLICY IF EXISTS "members_delete_media" ON public.media;
CREATE POLICY "members_delete_media" ON public.media
  FOR DELETE USING (public.is_member());

-- ============================================================
-- POLICIES: reasons
-- ============================================================
DROP POLICY IF EXISTS "members_select_reasons" ON public.reasons;
CREATE POLICY "members_select_reasons" ON public.reasons
  FOR SELECT USING (public.is_member());

DROP POLICY IF EXISTS "members_insert_reasons" ON public.reasons;
CREATE POLICY "members_insert_reasons" ON public.reasons
  FOR INSERT WITH CHECK (
    public.is_member() AND auth.uid() = created_by
  );

DROP POLICY IF EXISTS "members_update_own_reason" ON public.reasons;
CREATE POLICY "members_update_own_reason" ON public.reasons
  FOR UPDATE USING (
    public.is_member() AND auth.uid() = created_by
  ) WITH CHECK (
    public.is_member() AND auth.uid() = created_by
  );

DROP POLICY IF EXISTS "members_delete_own_reason" ON public.reasons;
CREATE POLICY "members_delete_own_reason" ON public.reasons
  FOR DELETE USING (
    public.is_member() AND auth.uid() = created_by
  );

-- ============================================================
-- POLICIES: quiz_questions
-- ============================================================
DROP POLICY IF EXISTS "members_select_quiz" ON public.quiz_questions;
CREATE POLICY "members_select_quiz" ON public.quiz_questions
  FOR SELECT USING (public.is_member());

DROP POLICY IF EXISTS "members_insert_quiz" ON public.quiz_questions;
CREATE POLICY "members_insert_quiz" ON public.quiz_questions
  FOR INSERT WITH CHECK (
    public.is_member() AND auth.uid() = created_by
  );

DROP POLICY IF EXISTS "members_update_own_quiz" ON public.quiz_questions;
CREATE POLICY "members_update_own_quiz" ON public.quiz_questions
  FOR UPDATE USING (
    public.is_member() AND auth.uid() = created_by
  ) WITH CHECK (
    public.is_member() AND auth.uid() = created_by
  );

DROP POLICY IF EXISTS "members_delete_own_quiz" ON public.quiz_questions;
CREATE POLICY "members_delete_own_quiz" ON public.quiz_questions
  FOR DELETE USING (
    public.is_member() AND auth.uid() = created_by
  );

-- ============================================================
-- POLICIES: letters (quan trọng - kiểm soát nội dung thư hẹn giờ)
-- ============================================================

-- SELECT: người viết luôn thấy thư của mình
--         người nhận chỉ thấy nội dung khi đã đến ngày open_at
-- NOTE: chặn lộ content bằng column-level, nhưng RLS chặn cả row
DROP POLICY IF EXISTS "members_select_letters" ON public.letters;
CREATE POLICY "members_select_letters" ON public.letters
  FOR SELECT USING (
    public.is_member() AND (
      auth.uid() = from_user OR                           -- Người viết thấy thư mình viết
      (auth.uid() = to_user AND NOW() >= open_at)         -- Người nhận thấy khi đến hạn
    )
  );

-- Policy riêng để người nhận thấy thư đang chờ (nhưng KHÔNG thấy content)
-- Content sẽ bị ẩn ở tầng application/server route
DROP POLICY IF EXISTS "members_see_pending_letters" ON public.letters;
CREATE POLICY "members_see_pending_letters" ON public.letters
  FOR SELECT USING (
    public.is_member() AND auth.uid() = to_user AND NOW() < open_at
  );

DROP POLICY IF EXISTS "members_insert_letters" ON public.letters;
CREATE POLICY "members_insert_letters" ON public.letters
  FOR INSERT WITH CHECK (
    public.is_member() AND auth.uid() = from_user
  );

DROP POLICY IF EXISTS "members_update_own_letters" ON public.letters;
CREATE POLICY "members_update_own_letters" ON public.letters
  FOR UPDATE USING (
    public.is_member() AND auth.uid() = from_user AND NOW() < open_at
  ) WITH CHECK (
    public.is_member() AND auth.uid() = from_user
  );

DROP POLICY IF EXISTS "members_delete_own_letters" ON public.letters;
CREATE POLICY "members_delete_own_letters" ON public.letters
  FOR DELETE USING (
    public.is_member() AND auth.uid() = from_user
  );

-- ============================================================
-- POLICIES: goals
-- ============================================================
DROP POLICY IF EXISTS "members_select_goals" ON public.goals;
CREATE POLICY "members_select_goals" ON public.goals
  FOR SELECT USING (public.is_member());

DROP POLICY IF EXISTS "members_insert_goals" ON public.goals;
CREATE POLICY "members_insert_goals" ON public.goals
  FOR INSERT WITH CHECK (
    public.is_member() AND auth.uid() = created_by
  );

DROP POLICY IF EXISTS "members_update_goals" ON public.goals;
CREATE POLICY "members_update_goals" ON public.goals
  FOR UPDATE USING (public.is_member())
  WITH CHECK (public.is_member());

DROP POLICY IF EXISTS "members_delete_own_goals" ON public.goals;
CREATE POLICY "members_delete_own_goals" ON public.goals
  FOR DELETE USING (
    public.is_member() AND auth.uid() = created_by
  );

-- ============================================================
-- STORAGE POLICIES (cho bucket "memories")
-- Chạy sau khi tạo bucket "memories" trong Storage dashboard
-- ============================================================

-- Cho phép thành viên SELECT (xem file metadata)
CREATE POLICY "members_select_storage" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'memories' AND public.is_member()
  );

-- Cho phép thành viên INSERT (upload file)
CREATE POLICY "members_insert_storage" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'memories' AND public.is_member()
  );

-- Cho phép thành viên UPDATE (cập nhật metadata)
CREATE POLICY "members_update_storage" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'memories' AND public.is_member()
  );

-- Cho phép thành viên DELETE
CREATE POLICY "members_delete_storage" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'memories' AND public.is_member()
  );
