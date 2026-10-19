-- ============================================================
-- Migration 004: Đăng ký nhận thông báo đẩy (Web Push)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL UNIQUE,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx
  ON public.push_subscriptions (user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_manage_own_push" ON public.push_subscriptions;
CREATE POLICY "members_manage_own_push" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id AND public.is_member())
  WITH CHECK (auth.uid() = user_id AND public.is_member());
