/**
 * debug_rls.js
 * Kiểm tra xem RLS policy có hoạt động đúng không
 * Thử đăng nhập bằng email/pass thật rồi query
 * 
 * Cách dùng: node debug_rls.js <email> <password>
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Cách dùng: node debug_rls.js <email> <password>');
  process.exit(1);
}

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const match = line.match(/^([^#][^=]*)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  console.log(`🔐 Đăng nhập với: ${email}...\n`);

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) {
    console.error('❌ Đăng nhập thất bại:', authError.message);
    process.exit(1);
  }
  console.log(`✅ Đăng nhập OK | user_id: ${authData.user.id}\n`);

  // Kiểm tra profile
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('id, display_name, is_member')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (pErr) console.error('❌ Profile query error:', pErr.message, '| code:', pErr.code);
  else if (!profile) console.log('⚠️  Profile: 0 hàng (RLS chặn - chưa có policy user_read_own_profile)');
  else console.log(`✅ Profile: ${profile.display_name} | is_member=${profile.is_member}`);

  console.log();

  // Kiểm tra reasons
  const { data: reasons, error: rErr } = await supabase.from('reasons').select('id, content');
  if (rErr) console.error('❌ Reasons error:', rErr.message, '| code:', rErr.code);
  else console.log(`📋 Reasons visible: ${reasons.length} bản ghi`);

  // Kiểm tra quiz
  const { data: quiz, error: qErr } = await supabase.from('quiz_questions').select('id, question');
  if (qErr) console.error('❌ Quiz error:', qErr.message, '| code:', qErr.code);
  else console.log(`🎮 Quiz visible: ${quiz.length} bản ghi`);

  // Hàm is_member
  const { data: isMember, error: imErr } = await supabase.rpc('is_member');
  if (imErr) console.error('\n❌ is_member() error:', imErr.message);
  else console.log(`\n🔒 is_member() = ${isMember}`);

  if (!profile) {
    console.log('\n─────────────────────────────────────────');
    console.log('🚨 VẤN ĐỀ: Chưa có policy "user_read_own_profile"');
    console.log('📋 Hãy chạy SQL này trong Supabase SQL Editor:');
    console.log('─────────────────────────────────────────');
    console.log('CREATE POLICY "user_read_own_profile" ON public.profiles');
    console.log('  FOR SELECT USING (auth.uid() = id);');
    console.log('─────────────────────────────────────────');
    console.log(`🔗 https://supabase.com/dashboard/project/${env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', '').split('.')[0]}/sql/new`);
  }
}

main().catch(console.error);
