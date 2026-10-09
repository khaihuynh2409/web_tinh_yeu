-- ============================================================
-- Migration 001: Khởi tạo schema, bảng, indexes, triggers
-- Couple PWA - Private love diary
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================================
-- BẢNG PROFILES (mở rộng auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_path  TEXT,                  -- Path trong Supabase Storage
  is_member    BOOLEAN NOT NULL DEFAULT FALSE,  -- Chỉ 2 người được TRUE
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BẢNG COUPLE_SETTINGS (cài đặt chung của cặp đôi)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.couple_settings (
  id           SMALLINT PRIMARY KEY DEFAULT 1,  -- Luôn chỉ có 1 hàng
  start_date   DATE NOT NULL DEFAULT '2025-09-14',
  name_a       TEXT NOT NULL DEFAULT 'Người A',
  name_b       TEXT NOT NULL DEFAULT 'Người B',
  theme        TEXT NOT NULL DEFAULT 'flower',  -- flower | starnight | pastel
  music_path   TEXT,                             -- Path trong Storage
  timezone     TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Seed mặc định
INSERT INTO public.couple_settings (id, start_date, name_a, name_b, theme)
VALUES (1, '2025-09-14', 'Anh', 'Em', 'flower')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- BẢNG MEMORIES (kỷ niệm)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.memories (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  content      TEXT,
  memory_date  DATE NOT NULL,
  tags         TEXT[] NOT NULL DEFAULT '{}',
  created_by   UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ  -- NULL = chưa xóa, có giá trị = đã xóa mềm
);

-- ============================================================
-- BẢNG MEDIA (ảnh/video đính kèm kỷ niệm)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.media (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memory_id    UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,           -- Path trong Storage bucket
  thumb_path   TEXT,                    -- Path thumbnail trong Storage
  type         TEXT NOT NULL CHECK (type IN ('image', 'video')),
  width        INTEGER,
  height       INTEGER,
  size_bytes   BIGINT,
  duration_s   REAL,                    -- Độ dài video (giây)
  created_by   UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BẢNG REASONS (lý do yêu nhau)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reasons (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content      TEXT NOT NULL,
  created_by   UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BẢNG QUIZ_QUESTIONS (câu hỏi minigame)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question     TEXT NOT NULL,
  answer       TEXT NOT NULL,
  hint         TEXT,
  created_by   UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BẢNG LETTERS (thư hẹn giờ)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.letters (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL DEFAULT 'Thư gửi người ấy',
  content      TEXT NOT NULL,           -- Được đọc chỉ khi điều kiện thỏa mãn (RLS)
  open_at      TIMESTAMPTZ NOT NULL,    -- Ngày/giờ được mở thư
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT different_users CHECK (from_user <> to_user)
);

-- ============================================================
-- BẢNG GOALS (mục tiêu & lời hứa)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.goals (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  description  TEXT,
  done         BOOLEAN NOT NULL DEFAULT FALSE,
  created_by   UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  done_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  done_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_memories_memory_date ON public.memories(memory_date DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_memories_deleted_at ON public.memories(deleted_at)
  WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_memories_tags ON public.memories USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_media_memory_id ON public.media(memory_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON public.media(type);
CREATE INDEX IF NOT EXISTS idx_letters_to_user ON public.letters(to_user);
CREATE INDEX IF NOT EXISTS idx_letters_open_at ON public.letters(open_at);
CREATE INDEX IF NOT EXISTS idx_goals_done ON public.goals(done);

-- ============================================================
-- TRIGGER: tự động cập nhật updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Áp dụng trigger cho mọi bảng có updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles', 'couple_settings', 'memories',
    'reasons', 'quiz_questions', 'letters', 'goals'
  ]
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_updated_at ON public.%I;
      CREATE TRIGGER trg_updated_at
        BEFORE UPDATE ON public.%I
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    ', t, t);
  END LOOP;
END;
$$;

-- ============================================================
-- TRIGGER: tự động tạo profile khi có user mới trong auth.users
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, is_member)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), FALSE)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_new_user ON auth.users;
CREATE TRIGGER trg_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
