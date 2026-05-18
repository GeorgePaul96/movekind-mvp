-- MoveKind — Supabase schema
-- Run this in the Supabase SQL editor for a fresh project.

-- =====================================================================
-- Extensions
-- =====================================================================
create extension if not exists "pgcrypto";

-- =====================================================================
-- profiles
-- =====================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  is_premium boolean not null default false,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_created_at on public.profiles(created_at desc);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================================
-- goals
-- =====================================================================
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weekly_minutes_target integer not null default 150,
  weekly_sessions_target integer not null default 4,
  focus text not null default 'overall' check (focus in ('overall','strength','endurance','recovery','consistency')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists idx_goals_user on public.goals(user_id);

alter table public.goals enable row level security;

drop policy if exists "goals_select_own" on public.goals;
create policy "goals_select_own" on public.goals
  for select using (auth.uid() = user_id);

drop policy if exists "goals_insert_own" on public.goals;
create policy "goals_insert_own" on public.goals
  for insert with check (auth.uid() = user_id);

drop policy if exists "goals_update_own" on public.goals;
create policy "goals_update_own" on public.goals
  for update using (auth.uid() = user_id);

drop policy if exists "goals_delete_own" on public.goals;
create policy "goals_delete_own" on public.goals
  for delete using (auth.uid() = user_id);

-- =====================================================================
-- activities
-- =====================================================================
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('walk','run','weights','cycle','yoga','swim','sport','stretch','other')),
  duration_minutes integer not null check (duration_minutes > 0 and duration_minutes <= 600),
  effort integer not null check (effort >= 1 and effort <= 10),
  moods text[] not null default '{}',
  notes text,
  performed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_activities_user_performed
  on public.activities(user_id, performed_at desc);

alter table public.activities enable row level security;

drop policy if exists "activities_select_own" on public.activities;
create policy "activities_select_own" on public.activities
  for select using (auth.uid() = user_id);

drop policy if exists "activities_insert_own" on public.activities;
create policy "activities_insert_own" on public.activities
  for insert with check (auth.uid() = user_id);

drop policy if exists "activities_update_own" on public.activities;
create policy "activities_update_own" on public.activities
  for update using (auth.uid() = user_id);

drop policy if exists "activities_delete_own" on public.activities;
create policy "activities_delete_own" on public.activities
  for delete using (auth.uid() = user_id);

-- =====================================================================
-- reflections
-- =====================================================================
create table if not exists public.reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  energy integer not null check (energy between 1 and 10),
  recovery integer not null check (recovery between 1 and 10),
  consistency integer not null check (consistency between 1 and 10),
  mood integer not null check (mood between 1 and 10),
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create index if not exists idx_reflections_user_week
  on public.reflections(user_id, week_start desc);

alter table public.reflections enable row level security;

drop policy if exists "reflections_select_own" on public.reflections;
create policy "reflections_select_own" on public.reflections
  for select using (auth.uid() = user_id);

drop policy if exists "reflections_insert_own" on public.reflections;
create policy "reflections_insert_own" on public.reflections
  for insert with check (auth.uid() = user_id);

drop policy if exists "reflections_update_own" on public.reflections;
create policy "reflections_update_own" on public.reflections
  for update using (auth.uid() = user_id);

drop policy if exists "reflections_delete_own" on public.reflections;
create policy "reflections_delete_own" on public.reflections
  for delete using (auth.uid() = user_id);

-- =====================================================================
-- progress_scores
-- =====================================================================
create table if not exists public.progress_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  consistency integer not null check (consistency between 0 and 100),
  strength integer not null check (strength between 0 and 100),
  endurance integer not null check (endurance between 0 and 100),
  recovery integer not null check (recovery between 0 and 100),
  overall integer not null check (overall between 0 and 100),
  computed_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create index if not exists idx_progress_user_week
  on public.progress_scores(user_id, week_start desc);

alter table public.progress_scores enable row level security;

drop policy if exists "progress_select_own" on public.progress_scores;
create policy "progress_select_own" on public.progress_scores
  for select using (auth.uid() = user_id);

drop policy if exists "progress_upsert_own" on public.progress_scores;
create policy "progress_upsert_own" on public.progress_scores
  for insert with check (auth.uid() = user_id);

drop policy if exists "progress_update_own" on public.progress_scores;
create policy "progress_update_own" on public.progress_scores
  for update using (auth.uid() = user_id);

-- =====================================================================
-- ai_insights
-- =====================================================================
create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  source text not null default 'openai' check (source in ('openai','fallback')),
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_insights_user_created
  on public.ai_insights(user_id, created_at desc);

alter table public.ai_insights enable row level security;

drop policy if exists "ai_insights_select_own" on public.ai_insights;
create policy "ai_insights_select_own" on public.ai_insights
  for select using (auth.uid() = user_id);

drop policy if exists "ai_insights_insert_own" on public.ai_insights;
create policy "ai_insights_insert_own" on public.ai_insights
  for insert with check (auth.uid() = user_id);

drop policy if exists "ai_insights_delete_own" on public.ai_insights;
create policy "ai_insights_delete_own" on public.ai_insights
  for delete using (auth.uid() = user_id);

-- =====================================================================
-- Seed helper
-- =====================================================================
-- After signing up your first user, copy their UUID from auth.users and
-- run the block below with that uuid in place of :user_id. This produces
-- a populated dashboard immediately.
--
-- DO $$
-- DECLARE u uuid := ':user_id';
-- BEGIN
--   INSERT INTO public.activities (user_id, type, duration_minutes, effort, moods, performed_at) VALUES
--     (u, 'walk',     25, 4, ARRAY['Energized','Calm'],  now() - interval '5 days'),
--     (u, 'weights',  40, 7, ARRAY['Strong','Proud'],    now() - interval '4 days'),
--     (u, 'yoga',     15, 2, ARRAY['Calm'],              now() - interval '3 days'),
--     (u, 'run',      30, 6, ARRAY['Energized'],         now() - interval '2 days'),
--     (u, 'walk',     20, 3, ARRAY['Calm'],              now() - interval '1 day');
--
--   INSERT INTO public.reflections (user_id, week_start, energy, recovery, consistency, mood)
--   VALUES (u, date_trunc('week', now())::date, 8, 6, 8, 7)
--   ON CONFLICT (user_id, week_start) DO UPDATE
--   SET energy=excluded.energy, recovery=excluded.recovery,
--       consistency=excluded.consistency, mood=excluded.mood;
--
--   INSERT INTO public.goals (user_id, weekly_minutes_target, weekly_sessions_target, focus)
--   VALUES (u, 150, 4, 'overall')
--   ON CONFLICT (user_id) DO NOTHING;
-- END $$;
