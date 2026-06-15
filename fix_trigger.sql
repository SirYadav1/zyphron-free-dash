-- ============================================================
-- COMPLETE DATABASE SETUP FOR ZYPHRON CLOUD
-- Run this ENTIRE script in Supabase SQL Editor:
-- https://supabase.com/dashboard -> SQL Editor -> New Query
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. USERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username varchar(50) UNIQUE NOT NULL,
  coins int DEFAULT 100,
  discord_id varchar(50) NULL,
  discord_username varchar(100) NULL,
  discord_left_at timestamp with time zone NULL,
  pterodactyl_user_id int NULL,
  pterodactyl_username varchar(50) NULL,
  is_banned boolean DEFAULT false,
  banned_at timestamp with time zone NULL,
  ban_reason text NULL,
  ip_address varchar(255) NULL,
  device_fingerprint varchar(255) NULL,
  is_admin boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- 2. SETTINGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.settings (
  id serial PRIMARY KEY,
  key varchar(100) UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- 3. SERVER TEMPLATES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.server_templates (
  id serial PRIMARY KEY,
  name varchar(100) NOT NULL,
  node_id int NOT NULL,
  egg_id int NOT NULL,
  nest_id int NOT NULL,
  ram_mb int NOT NULL,
  cpu_percent int NOT NULL,
  disk_mb int NOT NULL,
  databases_limit int DEFAULT 0,
  allocations_limit int DEFAULT 1,
  backup_limit int DEFAULT 0,
  dedicated_ip boolean DEFAULT false,
  docker_image varchar NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- 4. SERVERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.servers (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  template_id int REFERENCES public.server_templates(id) ON DELETE SET NULL,
  pterodactyl_server_id varchar(50) NULL,
  server_name varchar(100) NOT NULL,
  ram_mb int NOT NULL,
  cpu_percent int NOT NULL,
  disk_mb int NOT NULL,
  status varchar(20) DEFAULT 'active',
  expires_at timestamp with time zone NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- 5. AFK SESSIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.afk_sessions (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  tab_id varchar(100) NOT NULL,
  total_earned int DEFAULT 0,
  total_visible_seconds int DEFAULT 0,
  is_active boolean DEFAULT true,
  started_at timestamp with time zone DEFAULT now(),
  last_heartbeat_at timestamp with time zone NULL,
  ended_at timestamp with time zone NULL
);

-- ==========================================
-- 6. TRANSACTIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type varchar(20) NOT NULL,
  amount int NOT NULL,
  description text NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- 7. PANEL CONFIGURATION TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.panel_config (
  id serial PRIMARY KEY,
  panel_type varchar(20) NOT NULL DEFAULT 'pterodactyl',
  panel_url varchar(255) NOT NULL,
  api_key varchar(255) NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- 8. DAILY LOGINS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.daily_logins (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  login_date date NOT NULL,
  coins_earned int DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, login_date)
);

-- ==========================================
-- 9. USER ACHIEVEMENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  achievement_key varchar(50) NOT NULL,
  achieved_at timestamp with time zone DEFAULT now(),
  coins_rewarded int DEFAULT 0,
  UNIQUE(user_id, achievement_key)
);

-- ==========================================
-- TRIGGER: Auto-create user profile on signup
-- ==========================================

-- Drop old trigger/function if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the trigger function with error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  BEGIN
    INSERT INTO public.users (id, username, coins)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
      100
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user profile for %: %', new.id, SQLERRM;
  END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.afk_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
CREATE POLICY "Service role can insert users" ON public.users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can read all users" ON public.users;
CREATE POLICY "Service role can read all users" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can update all users" ON public.users;
CREATE POLICY "Service role can update all users" ON public.users FOR UPDATE USING (true);

-- Settings policies
DROP POLICY IF EXISTS "Anyone can read settings" ON public.settings;
CREATE POLICY "Anyone can read settings" ON public.settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage settings" ON public.settings;
CREATE POLICY "Service role can manage settings" ON public.settings FOR ALL USING (true);

-- Server templates policies
DROP POLICY IF EXISTS "Anyone can read active templates" ON public.server_templates;
CREATE POLICY "Anyone can read active templates" ON public.server_templates FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Service role can manage templates" ON public.server_templates;
CREATE POLICY "Service role can manage templates" ON public.server_templates FOR ALL USING (true);

-- Servers policies
DROP POLICY IF EXISTS "Users can view their own servers" ON public.servers;
CREATE POLICY "Users can view their own servers" ON public.servers FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own servers" ON public.servers;
CREATE POLICY "Users can insert their own servers" ON public.servers FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own servers" ON public.servers;
CREATE POLICY "Users can update their own servers" ON public.servers FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own servers" ON public.servers;
CREATE POLICY "Users can delete their own servers" ON public.servers FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all servers" ON public.servers;
CREATE POLICY "Service role can manage all servers" ON public.servers FOR ALL USING (true);

-- AFK sessions policies
DROP POLICY IF EXISTS "Users can view their own afk sessions" ON public.afk_sessions;
CREATE POLICY "Users can view their own afk sessions" ON public.afk_sessions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own afk sessions" ON public.afk_sessions;
CREATE POLICY "Users can insert their own afk sessions" ON public.afk_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own afk sessions" ON public.afk_sessions;
CREATE POLICY "Users can update their own afk sessions" ON public.afk_sessions FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage afk sessions" ON public.afk_sessions;
CREATE POLICY "Service role can manage afk sessions" ON public.afk_sessions FOR ALL USING (true);

-- Transactions policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage transactions" ON public.transactions;
CREATE POLICY "Service role can manage transactions" ON public.transactions FOR ALL USING (true);

-- Daily logins policies
DROP POLICY IF EXISTS "Users can view their own daily logins" ON public.daily_logins;
CREATE POLICY "Users can view their own daily logins" ON public.daily_logins FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own daily logins" ON public.daily_logins;
CREATE POLICY "Users can insert their own daily logins" ON public.daily_logins FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage daily logins" ON public.daily_logins;
CREATE POLICY "Service role can manage daily logins" ON public.daily_logins FOR ALL USING (true);

-- Achievements policies
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.user_achievements;
CREATE POLICY "Users can insert their own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage achievements" ON public.user_achievements;
CREATE POLICY "Service role can manage achievements" ON public.user_achievements FOR ALL USING (true);

-- ==========================================
-- DEFAULT SETTINGS
-- ==========================================
INSERT INTO public.settings (key, value) VALUES
  ('max_servers_total', '100'),
  ('max_servers_per_user', '3'),
  ('afk_coins_per_minute', '10'),
  ('afk_time_interval_minutes', '1'),
  ('server_validity_days', '7'),
  ('renewal_coins', '50'),
  ('ram_cost_per_mb', '2'),
  ('cpu_cost_per_percent', '5'),
  ('disk_cost_per_mb', '1'),
  ('daily_login_bonus', '25'),
  ('discord_link_bonus', '50'),
  ('default_node_id', '6'),
  ('default_egg_id', '2'),
  ('default_nest_id', '1'),
  ('default_ram_mb', '2048'),
  ('default_cpu_percent', '100'),
  ('default_disk_mb', '5120'),
  ('default_databases_limit', '0'),
  ('default_allocations_limit', '1'),
  ('default_backup_limit', '0'),
  ('default_dedicated_ip', 'false'),
  ('default_docker_image', 'ghcr.io/pterodactyl/yolks:java_25'),
  ('pterodactyl_panel_url', 'https://panel.zyphron.cloud/')
ON CONFLICT (key) DO NOTHING;

-- Done!
SELECT 'Database setup complete! All tables, triggers, and RLS policies created.' as result;
