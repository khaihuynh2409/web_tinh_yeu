-- ============================================================
-- Migration 006: Wishlist (thay cho mục "100 Lý do yêu nhau")
-- Mỗi người thêm món mình thích để người kia biết.
-- Bảng reasons cũ được giữ nguyên để không mất dữ liệu.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  note        TEXT,
  link        TEXT,
  price       TEXT,
  is_gifted   BOOLEAN NOT NULL DEFAULT FALSE,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wishlist_created
  ON public.wishlist_items (created_at DESC);

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_select_wishlist" ON public.wishlist_items;
CREATE POLICY "members_select_wishlist" ON public.wishlist_items
  FOR SELECT USING (public.is_member());

DROP POLICY IF EXISTS "members_insert_wishlist" ON public.wishlist_items;
CREATE POLICY "members_insert_wishlist" ON public.wishlist_items
  FOR INSERT WITH CHECK (public.is_member() AND auth.uid() = created_by);

-- Cả hai đều cập nhật được (người kia đánh dấu "đã tặng")
DROP POLICY IF EXISTS "members_update_wishlist" ON public.wishlist_items;
CREATE POLICY "members_update_wishlist" ON public.wishlist_items
  FOR UPDATE USING (public.is_member()) WITH CHECK (public.is_member());

-- Chỉ người tạo mới xóa được món của mình
DROP POLICY IF EXISTS "members_delete_own_wishlist" ON public.wishlist_items;
CREATE POLICY "members_delete_own_wishlist" ON public.wishlist_items
  FOR DELETE USING (public.is_member() AND auth.uid() = created_by);

DROP TRIGGER IF EXISTS trg_updated_at ON public.wishlist_items;
CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public.wishlist_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
