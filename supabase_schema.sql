-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Users Table (Linked securely to Supabase Auth)
-- We rely on auth.users for email, password, and verification status.
-- This public.users table stores application-specific attributes.
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  username varchar(50) unique not null,
  coins int default 100,
  discord_id varchar(50) null,
  discord_username varchar(100) null,
  discord_left_at timestamp with time zone null,
  pterodactyl_user_id int null,
  pterodactyl_username varchar(50) null,
  is_banned boolean default false,
  banned_at timestamp with time zone null,
  ban_reason text null,
  ip_address varchar(255) null,
  device_fingerprint varchar(255) null,
  is_admin boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Trigger to automatically create a public.users profile when a new user signs up in Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, username, coins)
  values (new.id, new.raw_user_meta_data->>'username', 100);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Settings Table
create table public.settings (
  id serial primary key,
  key varchar(100) unique not null,
  value text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. Server Templates Table
create table public.server_templates (
  id serial primary key,
  name varchar(100) not null,
  node_id int not null,
  egg_id int not null,
  nest_id int not null,
  ram_mb int not null,
  cpu_percent int not null,
  disk_mb int not null,
  databases_limit int default 0,
  allocations_limit int default 1,
  backup_limit int default 0,
  dedicated_ip boolean default false,
  docker_image varchar null,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 4. Servers Table
create table public.servers (
  id serial primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  template_id int references public.server_templates(id) on delete set null,
  pterodactyl_server_id varchar(50) null,
  server_name varchar(100) not null,
  ram_mb int not null,
  cpu_percent int not null,
  disk_mb int not null,
  status varchar(20) default 'active',
  expires_at timestamp with time zone null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 5. AFK Sessions Table
create table public.afk_sessions (
  id serial primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  tab_id varchar(100) not null,
  total_earned int default 0,
  total_visible_seconds int default 0,
  is_active boolean default true,
  started_at timestamp with time zone default now(),
  last_heartbeat_at timestamp with time zone null,
  ended_at timestamp with time zone null
);

-- 6. Transactions Table
create table public.transactions (
  id serial primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  type varchar(20) not null,
  amount int not null,
  description text null,
  created_at timestamp with time zone default now()
);

-- 6.1. Panel Configuration Table
create table public.panel_config (
  id serial primary key,
  panel_type varchar(20) not null default 'pterodactyl',
  panel_url varchar(255) not null,
  api_key varchar(255) not null,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 7. Daily Logins Table
create table public.daily_logins (
  id serial primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  login_date date not null,
  coins_earned int default 0,
  created_at timestamp with time zone default now(),
  unique(user_id, login_date)
);

-- 8. User Achievements Table
create table public.user_achievements (
  id serial primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  achievement_key varchar(50) not null,
  achieved_at timestamp with time zone default now(),
  coins_rewarded int default 0,
  unique(user_id, achievement_key)
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

alter table public.users enable row level security;
alter table public.settings enable row level security;
alter table public.server_templates enable row level security;
alter table public.servers enable row level security;
alter table public.afk_sessions enable row level security;
alter table public.transactions enable row level security;
alter table public.daily_logins enable row level security;
alter table public.user_achievements enable row level security;

-- Users can only view and update their own profile
create policy "Users can view their own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.users for update using (auth.uid() = id);

-- Public can view active server templates and settings
create policy "Anyone can read settings" on public.settings for select using (true);
create policy "Anyone can read active templates" on public.server_templates for select using (is_active = true);

-- Users manage their own servers, afk sessions, and view their transactions
create policy "Users can view their own servers" on public.servers for select using (auth.uid() = user_id);
create policy "Users can view their own afk sessions" on public.afk_sessions for select using (auth.uid() = user_id);
create policy "Users can insert their own afk sessions" on public.afk_sessions for insert with check (auth.uid() = user_id);
create policy "Users can update their own afk sessions" on public.afk_sessions for update using (auth.uid() = user_id);
create policy "Users can insert their own servers" on public.servers for insert with check (auth.uid() = user_id);
create policy "Users can update their own servers" on public.servers for update using (auth.uid() = user_id);
create policy "Users can delete their own servers" on public.servers for delete using (auth.uid() = user_id);
create policy "Users can view their own transactions" on public.transactions for select using (auth.uid() = user_id);

-- Users can view and insert their own daily logins and achievements
create policy "Users can view their own daily logins" on public.daily_logins for select using (auth.uid() = user_id);
create policy "Users can insert their own daily logins" on public.daily_logins for insert with check (auth.uid() = user_id);
create policy "Users can view their own achievements" on public.user_achievements for select using (auth.uid() = user_id);
create policy "Users can insert their own achievements" on public.user_achievements for insert with check (auth.uid() = user_id);
