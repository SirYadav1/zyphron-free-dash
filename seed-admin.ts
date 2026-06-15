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

async function seedAdmin() {
  const args = process.argv.slice(2);
  const email = args[0] || 'admin@zyphron.cloud';
  const password = args[1] || 'AdminPassword123!';
  const username = args[2] || 'admin';

  console.log(`⏳ Attempting to create admin account:`);
  console.log(`   Email: ${email}`);
  console.log(`   Username: ${username}`);
  
  // 1. Create the user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username },
  });

  if (authError) {
    if (authError.message.includes('already exists')) {
      console.log('⚠️  User already exists in Auth. Looking up ID to promote...');
      // If they exist, we just promote them
    } else {
      console.error('❌ Error creating user in Auth:', authError.message);
      process.exit(1);
    }
  }

  let userId = authData?.user?.id;

  // If user existed, fetch their ID by email
  if (!userId) {
    const { data: users, error: findError } = await supabase.auth.admin.listUsers();
    if (findError) {
      console.error('❌ Failed to fetch users list:', findError.message);
      process.exit(1);
    }
    const existingUser = users.users.find(u => u.email === email);
    if (!existingUser) {
      console.error('❌ Could not find existing user by email.');
      process.exit(1);
    }
    userId = existingUser.id;
  } else {
    console.log(`✅ User created in Supabase Auth (ID: ${userId})`);
  }

  // 2. Wait 1 second to ensure the database trigger creates the public.users profile
  console.log(`⏳ Waiting for database triggers to finish...`);
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

  console.log(`🎉 Success! Administrator account is ready.`);
  console.log(`-------------------------------------------`);
  console.log(`Login Email: ${email}`);
  console.log(`Login Password: ${password}`);
  console.log(`-------------------------------------------`);
}

seedAdmin();
