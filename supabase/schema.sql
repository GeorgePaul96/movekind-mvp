-- (Replacing schema.sql to append daily_check_ins)

-- =====================================================================
-- daily_check_ins
-- =====================================================================
create table if not exists public.daily_check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  energy integer not null check (energy between 0 and 10),
  stress_load integer not null check (stress_load between 0 and 10),
  body_state text not null,
  emotions text[] not null,
  generated_state text not null,
  recommendation text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_check_ins_user on public.daily_check_ins(user_id);
create index if not exists idx_check_ins_created on public.daily_check_ins(created_at desc);

alter table public.daily_check_ins enable row level security;

create policy "check_ins_select_own" on public.daily_check_ins
  for select using (auth.uid() = user_id);

create policy "check_ins_insert_own" on public.daily_check_ins
  for insert with check (auth.uid() = user_id);

create policy "check_ins_update_own" on public.daily_check_ins
  for update using (auth.uid() = user_id);

create policy "check_ins_delete_own" on public.daily_check_ins
  for delete using (auth.uid() = user_id);
