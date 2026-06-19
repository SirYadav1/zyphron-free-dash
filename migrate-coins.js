const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateCoins() {
  console.log('Fetching users with 0 coins...');
  
  const { data: users, error: fetchError } = await supabase
    .from('users')
    .select('id, username, coins')
    .eq('coins', 0);

  if (fetchError) {
    console.error('Error fetching users:', fetchError);
    return;
  }

  if (!users || users.length === 0) {
    console.log('No users found with 0 coins.');
    return;
  }

  console.log(`Found ${users.length} users with 0 coins. Updating to 100 coins...`);

  let updatedCount = 0;
  for (const user of users) {
    const { error: updateError } = await supabase
      .from('users')
      .update({ coins: 100 })
      .eq('id', user.id);

    if (updateError) {
      console.error(`Failed to update user ${user.username}:`, updateError);
    } else {
      console.log(`Updated user: ${user.username}`);
      updatedCount++;
    }
  }

  console.log(`Migration complete. Updated ${updatedCount}/${users.length} users.`);
}

migrateCoins();
