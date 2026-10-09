-- Tạo bucket "memories" (nếu chưa có) là bucket private
INSERT INTO storage.buckets (id, name, public) 
VALUES ('memories', 'memories', false)
ON CONFLICT (id) DO NOTHING;

-- Cho phép thành viên SELECT (xem file metadata)
DROP POLICY IF EXISTS "members_select_storage" ON storage.objects;
CREATE POLICY "members_select_storage" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'memories' AND public.is_member()
  );

-- Cho phép thành viên INSERT (upload file)
DROP POLICY IF EXISTS "members_insert_storage" ON storage.objects;
CREATE POLICY "members_insert_storage" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'memories' AND public.is_member()
  );

-- Cho phép thành viên UPDATE (cập nhật metadata)
DROP POLICY IF EXISTS "members_update_storage" ON storage.objects;
CREATE POLICY "members_update_storage" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'memories' AND public.is_member()
  );

-- Cho phép thành viên DELETE
DROP POLICY IF EXISTS "members_delete_storage" ON storage.objects;
CREATE POLICY "members_delete_storage" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'memories' AND public.is_member()
  );
