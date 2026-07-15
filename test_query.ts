import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('study_group_members')
    .select(`
      user_id,
      role,
      study_groups (*)
    `)
    .limit(10);
    
  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
