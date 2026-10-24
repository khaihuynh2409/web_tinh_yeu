-- ============================================================
-- Migration 005: Thành tích của cặp đôi
-- ============================================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  description  TEXT,
  icon         TEXT NOT NULL DEFAULT '🏆',
  achieved_at  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_achievements_date
  ON public.achievements (achieved_at DESC);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_select_achievements" ON public.achievements;
CREATE POLICY "members_select_achievements" ON public.achievements
  FOR SELECT USING (public.is_member());

DROP POLICY IF EXISTS "members_insert_achievements" ON public.achievements;
CREATE POLICY "members_insert_achievements" ON public.achievements
  FOR INSERT WITH CHECK (public.is_member() AND auth.uid() = created_by);

DROP POLICY IF EXISTS "members_update_achievements" ON public.achievements;
CREATE POLICY "members_update_achievements" ON public.achievements
  FOR UPDATE USING (public.is_member()) WITH CHECK (public.is_member());

-- Cả hai đều xóa được (thành tích là của chung)
DROP POLICY IF EXISTS "members_delete_achievements" ON public.achievements;
CREATE POLICY "members_delete_achievements" ON public.achievements
  FOR DELETE USING (public.is_member());

DROP TRIGGER IF EXISTS trg_updated_at ON public.achievements;
CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public.achievements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
