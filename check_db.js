const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Checking media table...");
  const { data: mediaCol, error: mError } = await supabase.from('media').select('*').order('created_at', { ascending: false }).limit(3);
  if (mError) console.error("Media Table Error:", mError);
  else console.log("Recent media:", mediaCol.map(m => ({ id: m.id, path: m.storage_path, size: m.size_bytes })));
}

main();
