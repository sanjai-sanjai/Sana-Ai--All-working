import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: groups, error: gErr } = await supabase.from('study_groups').select('*').limit(5);
  console.log("Groups:", groups, gErr);

  const { data: members, error: mErr } = await supabase.from('study_group_members').select('*').limit(10);
  console.log("Members:", members, mErr);
}

main().catch(console.error);
