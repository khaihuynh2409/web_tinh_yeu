/**
 * check_rls_v2.js
 * Kiểm tra RLS qua Supabase generateLink để lấy token thật
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const match = line.match(/^([^#][^=]*)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PROJECT_REF = SUPABASE_URL.replace('https://', '').split('.')[0];

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testWithGenerateLink(userId, displayName, email) {
  console.log(`\n─── Testing: ${displayName} ───`);

  // Tạo OTP login link → lấy token
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: email,
    options: { redirectTo: 'http://localhost:3000' }
  });

  if (linkErr || !linkData?.properties?.hashed_token) {
    console.log(`  ⚠️  Không tạo được magic link: ${linkErr?.message}`);
    // Fallback: đổi trực tiếp và kiểm tra dữ liệu bằng admin
    await checkViaAdmin(userId, displayName);
    return;
  }

  // Dùng token để lấy access token
  const token = linkData.properties.hashed_token;
  const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/verify?token=${token}&type=magiclink&redirect_to=http://localhost`, {
    method: 'GET', redirect: 'manual'
  });

  const location = verifyRes.headers.get('location') || '';
  const match = location.match(/access_token=([^&]+)/);
  if (!match) {
    console.log(`  ⚠️  Không lấy được access_token từ magic link`);
    await checkViaAdmin(userId, displayName);
    return;
  }

  const accessToken = decodeURIComponent(match[1]);
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false }
  });

  await runQueries(userClient, userId, displayName);
}

async function checkViaAdmin(userId, displayName) {
  // Kiểm tra profile admin (không RLS)
  const { data: profile } = await admin.from('profiles').select('id, display_name, is_member').eq('id', userId).maybeSingle();
  console.log(`  [Admin] Profile: ${profile?.display_name} | is_member=${profile?.is_member}`);

  const { data: reasons } = await admin.from('reasons').select('id').eq('created_by', userId);
  console.log(`  [Admin] Reasons created_by this user: ${reasons?.length || 0}`);

  const { data: allReasons } = await admin.from('reasons').select('id');
  console.log(`  [Admin] Total reasons in DB: ${allReasons?.length || 0}`);
}

async function runQueries(client, userId, displayName) {
  const { data: profile, error: pErr } = await client
    .from('profiles').select('id, display_name, is_member').eq('id', userId).maybeSingle();
  
  if (pErr) console.log(`  Profile: ❌ ${pErr.message} (${pErr.code})`);
  else if (!profile) console.log(`  Profile: ⚠️  0 hàng - RLS đang chặn!`);
  else console.log(`  Profile: ✅ ${profile.display_name} | is_member=${profile.is_member}`);

  const { data: isMember, error: imErr } = await client.rpc('is_member');
  if (imErr) console.log(`  is_member(): ❌ ${imErr.message}`);
  else console.log(`  is_member(): ${isMember ? '✅ TRUE' : '❌ FALSE → Đây là nguyên nhân!'}`);

  const { data: reasons } = await client.from('reasons').select('id');
  console.log(`  Reasons có thể xem: ${reasons?.length ?? 'error'}`);

  const { data: quiz } = await client.from('quiz_questions').select('id');
  console.log(`  Quiz có thể xem: ${quiz?.length ?? 'error'}`);
}

async function main() {
  console.log('=== KIỂM TRA RLS ===\n');

  const users = [
    { id: '036f1e26-2ba4-4cba-bbc2-1c917f89d118', name: 'Anh', email: 'khaihuynh2409@gmail.com' },
    { id: 'f118c07a-1d8f-4700-8889-0f40ba6a5844', name: 'Em',  email: 'kevo20021111@gmail.com' },
  ];

  for (const u of users) {
    await testWithGenerateLink(u.id, u.name, u.email);
  }

  console.log('\n=== DIAGNOSE SUMMARY ===');
  console.log('\nNếu "is_member() = FALSE":');
  console.log('  → activate_member() chưa được áp dụng hoặc bị reset');
  console.log('  → Chạy lại: node setup_supabase.js\n');
  console.log('Nếu "Profile: 0 hàng":');
  console.log('  → Chưa có policy user_read_own_profile');
  console.log('  → Vào SQL Editor và chạy:');
  console.log(`  https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new\n`);
  console.log('  CREATE POLICY "user_read_own_profile" ON public.profiles');
  console.log('    FOR SELECT USING (auth.uid() = id);');
}

main().catch(console.error);
