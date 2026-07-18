import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function promoteToAdmin() {
  const args = process.argv.slice(2);
  const email = args[0] || 'admin@your-domain.com';

  console.log(`⏳ Looking up user: ${email}`);
  
  // 1. Find the user by email in Supabase Auth
  const { data: users, error: findError } = await supabase.auth.admin.listUsers();
  if (findError) {
    console.error('❌ Failed to fetch users list:', findError.message);
    process.exit(1);
  }

  const existingUser = users.users.find(u => u.email === email);
  if (!existingUser) {
    console.error('❌ User not found with email:', email);
    process.exit(1);
  }

  const userId = existingUser.id;
  console.log(`✅ Found user (ID: ${userId})`);

  // 2. Wait 1 second to ensure the database trigger creates the public.users profile if it doesn't exist
  console.log(`⏳ Checking database profile...`);
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 3. Promote the user in the public.users table
  console.log(`⏳ Promoting user to Administrator...`);
  const { data: updateData, error: updateError } = await supabase
    .from('users')
    .update({ is_admin: true })
    .eq('id', userId)
    .select()
    .single();

  if (updateError) {
    console.error('❌ Failed to update user profile in public.users:', updateError.message);
    process.exit(1);
  }

  console.log(`🎉 Success! User has been promoted to Administrator.`);
  console.log(`-------------------------------------------`);
  console.log(`User Email: ${email}`);
  console.log(`User ID: ${userId}`);
  console.log(`Username: ${updateData?.username || 'N/A'}`);
  console.log(`-------------------------------------------`);
}

promoteToAdmin();