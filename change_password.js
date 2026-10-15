/**
 * change_password.js
 * Đổi mật khẩu cho user qua Supabase Admin API
 * Dùng: node change_password.js <email> <new_password>
 * Ví dụ: node change_password.js kevo20021111@gmail.com Mat_khau_moi_123
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.log('Cách dùng: node change_password.js <email> <mat_khau_moi>');
  console.log('Ví dụ:    node change_password.js kevo20021111@gmail.com MatKhauMoi@123');
  process.exit(1);
}

if (newPassword.length < 6) {
  console.error('❌ Mật khẩu phải ít nhất 6 ký tự');
  process.exit(1);
}

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const match = line.match(/^([^#][^=]*)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  console.log(`🔍 Tìm user: ${email}...`);

  // Tìm user theo email
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) { console.error('❌', listError.message); process.exit(1); }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    console.error(`❌ Không tìm thấy user với email: ${email}`);
    console.log('Danh sách users hiện tại:');
    users.forEach(u => console.log(` - ${u.email}`));
    process.exit(1);
  }

  console.log(`✅ Tìm thấy: ${user.email} (${user.id})`);
  console.log('🔐 Đang đổi mật khẩu...');

  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    password: newPassword,
  });

  if (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }

  console.log(`✅ Đổi mật khẩu thành công cho ${email}!`);
  console.log('   Mật khẩu mới đã có hiệu lực ngay lập tức.');
}

main().catch(console.error);
