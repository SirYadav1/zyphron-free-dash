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

async function migrateAchievements() {
  console.log('⏳ Starting achievements migration...');

  try {
    // Create daily_logins table
    console.log('Creating daily_logins table...');
    const { error: dailyLoginsError } = await supabase.rpc('exec_sql', {
      sql: `
        create table if not exists public.daily_logins (
          id serial primary key,
          user_id uuid references public.users(id) on delete cascade not null,
          login_date date not null,
          coins_earned int default 0,
          created_at timestamp with time zone default now(),
          unique(user_id, login_date)
        );
      `
    });

    if (dailyLoginsError) {
      console.error('❌ Error creating daily_logins table:', dailyLoginsError.message);
      process.exit(1);
    }
    console.log('✅ daily_logins table created');

    // Create user_achievements table
    console.log('Creating user_achievements table...');
    const { error: achievementsError } = await supabase.rpc('exec_sql', {
      sql: `
        create table if not exists public.user_achievements (
          id serial primary key,
          user_id uuid references public.users(id) on delete cascade not null,
          achievement_key varchar(50) not null,
          achieved_at timestamp with time zone default now(),
          coins_rewarded int default 0,
          unique(user_id, achievement_key)
        );
      `
    });

    if (achievementsError) {
      console.error('❌ Error creating user_achievements table:', achievementsError.message);
      process.exit(1);
    }
    console.log('✅ user_achievements table created');

    // Enable RLS
    console.log('Enabling RLS...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        alter table public.daily_logins enable row level security;
        alter table public.user_achievements enable row level security;
      `
    });

    if (rlsError) {
      console.error('❌ Error enabling RLS:', rlsError.message);
      process.exit(1);
    }
    console.log('✅ RLS enabled');

    // Create RLS policies
    console.log('Creating RLS policies...');
    const { error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
        create policy "Users can view their own daily logins" on public.daily_logins for select using (auth.uid() = user_id);
        create policy "Users can insert their own daily logins" on public.daily_logins for insert with check (auth.uid() = user_id);
        create policy "Users can view their own achievements" on public.user_achievements for select using (auth.uid() = user_id);
        create policy "Users can insert their own achievements" on public.user_achievements for insert with check (auth.uid() = user_id);
      `
    });

    if (policiesError) {
      console.error('❌ Error creating RLS policies:', policiesError.message);
      process.exit(1);
    }
    console.log('✅ RLS policies created');

    // Insert default settings
    console.log('Inserting default settings...');
    const { error: settingsError } = await supabase.from('settings').upsert([
      { key: 'daily_login_bonus', value: '25' },
      { key: 'discord_link_bonus', value: '50' },
    ], { onConflict: 'key' });

    if (settingsError) {
      console.error('❌ Error inserting settings:', settingsError.message);
      process.exit(1);
    }
    console.log('✅ Default settings inserted');

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateAchievements();