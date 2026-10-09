-- ============================================================
-- Migration 003: Hàm tiện ích + Dữ liệu ban đầu
-- ============================================================

-- ============================================================
-- HÀM: Lấy thống kê tổng hợp (chạy ở server với service_role)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_stats()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result JSON;
BEGIN
  -- Chỉ cho phép thành viên gọi
  IF NOT public.is_member() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'total_memories', (SELECT COUNT(*) FROM memories WHERE deleted_at IS NULL),
    'total_images',   (SELECT COUNT(*) FROM media WHERE type = 'image'),
    'total_videos',   (SELECT COUNT(*) FROM media WHERE type = 'video'),
    'total_reasons',  (SELECT COUNT(*) FROM reasons),
    'total_goals',    (SELECT COUNT(*) FROM goals),
    'done_goals',     (SELECT COUNT(*) FROM goals WHERE done = TRUE),
    'trip_count',     (SELECT COUNT(*) FROM memories WHERE 'du-lich' = ANY(tags) AND deleted_at IS NULL),
    'tags_breakdown', (
      SELECT json_object_agg(tag, cnt)
      FROM (
        SELECT UNNEST(tags) AS tag, COUNT(*) AS cnt
        FROM memories
        WHERE deleted_at IS NULL
        GROUP BY tag
        ORDER BY cnt DESC
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_stats() TO authenticated;

-- ============================================================
-- HÀM: Kích hoạt thành viên (dùng service_role, không qua RLS)
-- Gọi từ server sau khi tạo user thủ công trong Auth dashboard
-- ============================================================
CREATE OR REPLACE FUNCTION public.activate_member(user_id UUID, name TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, is_member)
  VALUES (user_id, name, TRUE)
  ON CONFLICT (id) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        is_member = TRUE,
        updated_at = NOW();
END;
$$;

-- Chỉ service_role được gọi hàm này (không grant cho authenticated)
REVOKE ALL ON FUNCTION public.activate_member(UUID, TEXT) FROM PUBLIC;
