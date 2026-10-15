/**
 * add_rls_policy.js
 * Thêm RLS policy qua Supabase Management API
 * Chạy: node add_rls_policy.js
 */
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const match = line.match(/^([^#][^=]*)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
// Extract project ref from URL: https://nriuqfgrktdzhrozjdti.supabase.co
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

const SQL = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'user_read_own_profile'
  ) THEN
    EXECUTE 'CREATE POLICY "user_read_own_profile" ON public.profiles FOR SELECT USING (auth.uid() = id)';
    RAISE NOTICE 'Policy created successfully';
  ELSE
    RAISE NOTICE 'Policy already exists, skipping';
  END IF;
END $$;
`;

async function main() {
  console.log(`📡 Project ref: ${projectRef}`);
  console.log('🔒 Thêm RLS policy qua Management API...\n');

  // Thử Management API v1
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Management API cần Personal Access Token (PAT), không phải service_role key
        // Nếu không có PAT, sẽ dùng cách khác
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ query: SQL }),
    }
  );

  const text = await response.text();
  console.log(`Status: ${response.status}`);
  
  if (response.ok) {
    console.log('✅ RLS policy đã được tạo!');
    console.log(text);
  } else {
    console.log('❌ Management API không chấp nhận service_role key (cần Personal Access Token)');
    console.log('Response:', text);
    
    // Thử cách khác: pg_dump endpoint hoặc direct REST
    console.log('\n─────────────────────────────────────────');
    console.log('📋 BẠN CHỈ CẦN CHẠY 1 LỆNH NÀY TRONG SUPABASE SQL EDITOR:');
    console.log('─────────────────────────────────────────');
    console.log('\nCREATE POLICY "user_read_own_profile" ON public.profiles');
    console.log('  FOR SELECT USING (auth.uid() = id);');
    console.log('\n─────────────────────────────────────────');
    console.log('🔗 Link trực tiếp:');
    console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    console.log('─────────────────────────────────────────\n');
  }
}

main().catch(console.error);
