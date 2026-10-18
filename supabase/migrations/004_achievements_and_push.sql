-- ============================================================
-- Migration 004: Thành tích (achievements) + Push notifications
-- Chạy file này trong Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- BẢNG ACHIEVEMENTS (thành tích của hai người)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL,
  description   TEXT,
  icon          TEXT NOT NULL DEFAULT '🏆',
  achieved_date DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Ai đạt được: is_shared = TRUE → cả hai; ngược lại dùng achieved_by
  is_shared     BOOLEAN NOT NULL DEFAULT FALSE,
  achieved_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_achievements_date
  ON public.achievements(achieved_date DESC);

DROP TRIGGER IF EXISTS trg_updated_at ON public.achievements;
CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public.achievements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_select_achievements" ON public.achievements;
CREATE POLICY "members_select_achievements" ON public.achievements
  FOR SELECT USING (public.is_member());

DROP POLICY IF EXISTS "members_insert_achievements" ON public.achievements;
CREATE POLICY "members_insert_achievements" ON public.achievements
  FOR INSERT WITH CHECK (
    public.is_member() AND auth.uid() = created_by
  );

DROP POLICY IF EXISTS "members_delete_own_achievements" ON public.achievements;
CREATE POLICY "members_delete_own_achievements" ON public.achievements
  FOR DELETE USING (
    public.is_member() AND auth.uid() = created_by
  );

-- ============================================================
-- BẢNG PUSH_SUBSCRIPTIONS (thiết bị nhận thông báo)
-- Mỗi hàng = 1 trình duyệt/thiết bị của 1 người đang đăng nhập.
-- Chỉ server (service_role) đọc/ghi → bật RLS và KHÔNG tạo policy nào.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL UNIQUE,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
  ON public.push_subscriptions(user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
