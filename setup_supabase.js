/**
 * setup_supabase.js
 * Script thiết lập Supabase: thêm RLS policy + kích hoạt thành viên
 * Chạy 1 lần: node setup_supabase.js
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Đọc .env.local
const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const match = line.match(/^([^#][^=]*)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Không tìm thấy SUPABASE_URL hoặc SERVICE_ROLE_KEY trong .env.local');
  process.exit(1);
}

// Admin client (service_role - bỏ qua RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('🚀 Bắt đầu thiết lập Supabase...\n');

  // ─── 1. Liệt kê tất cả user từ Auth ─────────────────────────────────────
  console.log('📋 Đang lấy danh sách users từ Auth...');
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('❌ Lỗi khi lấy danh sách users:', listError.message);
    process.exit(1);
  }

  console.log(`✅ Tìm thấy ${users.length} user:\n`);
  users.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.email}`);
    console.log(`     UUID: ${u.id}`);
    console.log(`     Xác nhận: ${u.email_confirmed_at ? '✅ Đã xác nhận' : '⚠️ Chưa xác nhận'}`);
    console.log();
  });

  // ─── 2. Kích hoạt is_member = TRUE cho tất cả users ────────────────────
  console.log('🔧 Đang kích hoạt is_member cho tất cả users...');
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const displayName = user.email.toLowerCase().includes('khaihuynh') ? 'Anh' : 'Em';
    const { error } = await supabase.rpc('activate_member', {
      user_id: user.id,
      name: displayName,
    });
    if (error) {
      console.error(`❌ Lỗi khi kích hoạt ${user.email}:`, error.message);
    } else {
      console.log(`  ✅ Đã kích hoạt: ${user.email} → tên "${displayName}"`);
    }
  }

  // ─── 3. Kiểm tra bảng profiles ──────────────────────────────────────────
  console.log('\n📊 Kiểm tra profiles sau khi kích hoạt:');
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name, is_member, created_at');

  if (profileError) {
    console.error('❌ Lỗi khi đọc profiles:', profileError.message);
  } else {
    profiles.forEach(p => {
      const status = p.is_member ? '✅ Member' : '❌ NOT member';
      console.log(`  ${status} | ${p.display_name} | ${p.id}`);
    });
  }

  // ─── 4. Thêm RLS policy cho phép user đọc profile của chính mình ────────
  console.log('\n🔒 Đang thêm RLS policy...');
  // Dùng Management API qua HTTP để chạy DDL
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql_admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
    },
    body: JSON.stringify({
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE tablename = 'profiles'
            AND policyname = 'user_read_own_profile'
          ) THEN
            CREATE POLICY "user_read_own_profile" ON public.profiles
              FOR SELECT USING (auth.uid() = id);
            RAISE NOTICE 'Policy created';
          ELSE
            RAISE NOTICE 'Policy already exists';
          END IF;
        END $$;
      `
    })
  });

  if (response.ok) {
    console.log('  ✅ RLS policy đã được thêm');
  } else {
    // Nếu hàm execute_sql_admin không tồn tại, thử qua pg_net hoặc báo hướng dẫn thủ công
    console.log('  ⚠️  Không thể tự động thêm RLS policy qua API.');
    console.log('  📝 Hãy chạy SQL sau trong Supabase Dashboard → SQL Editor:');
    console.log('\n─────────────────────────────────────────────────────────');
    console.log(`CREATE POLICY "user_read_own_profile" ON public.profiles`);
    console.log(`  FOR SELECT USING (auth.uid() = id);`);
    console.log('─────────────────────────────────────────────────────────\n');
  }

  console.log('\n🎉 Hoàn tất! Bạn có thể đăng nhập ngay bây giờ.');
}

main().catch(err => {
  console.error('❌ Lỗi không mong đợi:', err);
  process.exit(1);
});
