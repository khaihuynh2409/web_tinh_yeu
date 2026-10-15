/**
 * debug_data.js
 * Kiểm tra dữ liệu reasons và quiz_questions trong DB
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const match = line.match(/^([^#][^=]*)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

// Admin client - bỏ qua RLS để xem toàn bộ dữ liệu
const admin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Anon client - giả lập user bình thường (có RLS)
const anon = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log('=== KIỂM TRA DỮ LIỆU THỰC TẾ (Admin - bỏ qua RLS) ===\n');

  // Reasons
  const { data: reasons, error: rErr } = await admin.from('reasons').select('id, content, created_by');
  if (rErr) console.error('❌ Lý do yêu nhau:', rErr.message);
  else {
    console.log(`📋 Lý do yêu nhau trong DB: ${reasons.length} bản ghi`);
    reasons.forEach(r => console.log(`   - "${r.content.slice(0, 40)}..." by ${r.created_by}`));
  }

  console.log();

  // Quiz
  const { data: quiz, error: qErr } = await admin.from('quiz_questions').select('id, question, created_by');
  if (qErr) console.error('❌ Quiz:', qErr.message);
  else {
    console.log(`🎮 Câu hỏi minigame trong DB: ${quiz.length} bản ghi`);
    quiz.forEach(q => console.log(`   - "${q.question.slice(0, 50)}..." by ${q.created_by}`));
  }

  console.log();
  console.log('=== KIỂM TRA RLS POLICIES ===\n');

  // Kiểm tra policies hiện tại
  const { data: policies, error: pErr } = await admin
    .from('pg_policies')
    .select('tablename, policyname, cmd, qual')
    .in('tablename', ['reasons', 'quiz_questions', 'profiles'])
    .order('tablename');

  if (pErr) {
    // pg_policies không phải bảng public, thử cách khác
    console.log('ℹ️  Không thể đọc pg_policies trực tiếp (không phải bảng public)');
  } else {
    console.log('Policies:');
    policies?.forEach(p => console.log(`   ${p.tablename} | ${p.policyname} | ${p.cmd}`));
  }

  console.log('\n=== KIỂM TRA PROFILES ===\n');
  const { data: profiles } = await admin.from('profiles').select('id, display_name, is_member');
  profiles?.forEach(p => {
    console.log(`  ${p.is_member ? '✅' : '❌'} ${p.display_name} | ${p.id}`);
  });
}

main().catch(console.error);
