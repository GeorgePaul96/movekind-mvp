-- MoveKind v2.3 — Supabase database schema
-- Run this in the Supabase SQL editor for a fresh project.

create extension if not exists "pgcrypto";

-- =====================================================================
-- profiles
-- =====================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  is_premium boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
-- check_ins
-- =====================================================================
create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  energy_score integer not null check (energy_score between 1 and 5),
  sleep_quality text check (sleep_quality in ('good', 'fair', 'poor')),
  intention text,               -- optional one-line intention, reflected back at session end
  engine_version text not null,
  created_at timestamptz not null default now()
);

-- Backfill for projects created before the intention column existed.
alter table public.check_ins add column if not exists intention text;

create index if not exists idx_check_ins_user_created on public.check_ins(user_id, created_at desc);

alter table public.check_ins enable row level security;

drop policy if exists "check_ins_select_own" on public.check_ins;
create policy "check_ins_select_own" on public.check_ins
  for select using (auth.uid() = user_id);

drop policy if exists "check_ins_insert_own" on public.check_ins;
create policy "check_ins_insert_own" on public.check_ins
  for insert with check (auth.uid() = user_id);

-- =====================================================================
-- exercises
-- =====================================================================
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('regulate', 'mobilize', 'strengthen', 'move', 'downshift')),
  base_difficulty integer not null check (base_difficulty between 1 and 3),
  cues text[] not null,
  illustration_ref text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_exercises_category on public.exercises(category);

alter table public.exercises enable row level security;

drop policy if exists "exercises_select_all" on public.exercises;
create policy "exercises_select_all" on public.exercises
  for select using (true); -- exercises library is read-only for authenticated users

-- =====================================================================
-- sessions
-- =====================================================================
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  check_in_id uuid references public.check_ins(id) on delete set null,
  state text not null check (state in ('overloaded', 'recovering', 'regulated', 'activated')),
  status text not null default 'generated' check (status in ('generated', 'started', 'completed', 'abandoned')),
  engine_version text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_sessions_user_created on public.sessions(user_id, created_at desc);

alter table public.sessions enable row level security;

drop policy if exists "sessions_select_own" on public.sessions;
create policy "sessions_select_own" on public.sessions
  for select using (auth.uid() = user_id);

drop policy if exists "sessions_insert_own" on public.sessions;
create policy "sessions_insert_own" on public.sessions
  for insert with check (auth.uid() = user_id);

drop policy if exists "sessions_update_own" on public.sessions;
create policy "sessions_update_own" on public.sessions
  for update using (auth.uid() = user_id);

-- =====================================================================
-- session_blocks
-- =====================================================================
create table if not exists public.session_blocks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  block_order integer not null,
  target_duration integer not null, -- duration in seconds
  actual_duration integer, -- duration in seconds
  status text not null default 'pending' check (status in ('pending', 'completed', 'skipped', 'swapped')),
  created_at timestamptz not null default now()
);

create index if not exists idx_session_blocks_session on public.session_blocks(session_id);

alter table public.session_blocks enable row level security;

drop policy if exists "session_blocks_select_own" on public.session_blocks;
create policy "session_blocks_select_own" on public.session_blocks
  for select using (
    exists (
      select 1 from public.sessions s 
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

drop policy if exists "session_blocks_insert_own" on public.session_blocks;
create policy "session_blocks_insert_own" on public.session_blocks
  for insert with check (
    exists (
      select 1 from public.sessions s 
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

drop policy if exists "session_blocks_update_own" on public.session_blocks;
create policy "session_blocks_update_own" on public.session_blocks
  for update using (
    exists (
      select 1 from public.sessions s 
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

-- =====================================================================
-- post_ratings
-- =====================================================================
create table if not exists public.post_ratings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  rating_delta integer not null check (rating_delta between -1 and 2),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_post_ratings_session on public.post_ratings(session_id);

alter table public.post_ratings enable row level security;

drop policy if exists "post_ratings_select_own" on public.post_ratings;
create policy "post_ratings_select_own" on public.post_ratings
  for select using (
    exists (
      select 1 from public.sessions s 
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

drop policy if exists "post_ratings_insert_own" on public.post_ratings;
create policy "post_ratings_insert_own" on public.post_ratings
  for insert with check (
    exists (
      select 1 from public.sessions s 
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

-- =====================================================================
-- user_exercise_stats
-- =====================================================================
create table if not exists public.user_exercise_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  times_completed integer not null default 0,
  average_energy_delta numeric(3,2) not null default 0.00,
  average_session_completion_rate numeric(3,2) not null default 0.00,
  last_completed_at timestamptz not null default now(),
  unique (user_id, exercise_id)
);

create index if not exists idx_user_exercise_stats_user on public.user_exercise_stats(user_id);

alter table public.user_exercise_stats enable row level security;

drop policy if exists "user_exercise_stats_select_own" on public.user_exercise_stats;
create policy "user_exercise_stats_select_own" on public.user_exercise_stats
  for select using (auth.uid() = user_id);

-- =====================================================================
-- Real-time aggregation triggers for user_exercise_stats
-- =====================================================================
create or replace function public.sync_user_exercise_stats()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid;
  v_exercise_id uuid;
  v_delta integer;
begin
  -- Get user_id and rating_delta
  select user_id, rating_delta 
  into v_user_id, v_delta
  from public.sessions s
  join public.post_ratings pr on pr.session_id = s.id
  where pr.id = NEW.id;

  -- Update stats for every completed exercise in that session
  for v_exercise_id in 
    select exercise_id 
    from public.session_blocks 
    where session_id = NEW.session_id and status = 'completed'
  loop
    insert into public.user_exercise_stats (user_id, exercise_id, times_completed, average_energy_delta, last_completed_at)
    values (v_user_id, v_exercise_id, 1, v_delta, now())
    on conflict (user_id, exercise_id) do update set
      times_completed = user_exercise_stats.times_completed + 1,
      average_energy_delta = (user_exercise_stats.average_energy_delta * user_exercise_stats.times_completed + EXCLUDED.average_energy_delta) / (user_exercise_stats.times_completed + 1),
      last_completed_at = now();
  end loop;
  
  return NEW;
end;
$$;

drop trigger if exists on_post_rating_submitted on public.post_ratings;
create trigger on_post_rating_submitted
  after insert on public.post_ratings
  for each row execute procedure public.sync_user_exercise_stats();

-- =====================================================================
-- Seed helper (MoveKind v2.3 Base Exercise Library of 30 exercises)
-- =====================================================================
insert into public.exercises (name, category, base_difficulty, cues, illustration_ref) values
  ('Box Breathing', 'regulate', 1, ARRAY['Inhale for 4 seconds', 'Hold for 4 seconds', 'Exhale for 4 seconds', 'Hold for 4 seconds'], 'regulate_box_breathing'),
  ('Standing Somatic Shake', 'regulate', 1, ARRAY['Stand tall with feet hip-width apart', 'Gently shake your hands, arms, and shoulders', 'Let the shaking spread to your legs and torso', 'Breathe naturally and release physical tension'], 'regulate_somatic_shake'),
  ('Neck & Shoulder Flossing', 'regulate', 1, ARRAY['Drop your chin to your chest', 'Slowly roll your neck side to side', 'Shrug shoulders up to ears and roll them back', 'Keep movements slow and controlled'], 'regulate_neck_flossing'),
  ('Spinal Wave', 'regulate', 1, ARRAY['Stand with soft knees', 'Tuck chin and slowly roll down bone by bone', 'Let arms hang loose at the bottom', 'Slowly roll back up, stacking spine'], 'regulate_spinal_wave'),
  ('Chest Opener', 'regulate', 1, ARRAY['Clasp hands behind your lower back', 'Gently squeeze shoulder blades and lift chest', 'Hold for 5 deep breaths', 'Release and roll shoulders out'], 'regulate_chest_opener'),
  ('Cat-Cow', 'regulate', 1, ARRAY['Get on hands and knees', 'Inhale, arch your back and look up (Cow)', 'Exhale, round your spine and tuck chin (Cat)', 'Move fluidly with your breath'], 'regulate_cat_cow'),

  ('Hip 90/90', 'mobilize', 1, ARRAY['Sit on floor with legs bent at 90 degrees', 'Rotate torso over front thigh', 'Hold for 30 seconds', 'Rotate legs to the opposite side and repeat'], 'mobilize_hip_90_90'),
  ('World''s Greatest Stretch', 'mobilize', 2, ARRAY['Step into a deep lunge with right foot forward', 'Place left hand on floor, rotate right arm up', 'Look toward your active hand', 'Return to center and switch sides'], 'mobilize_worlds_greatest'),
  ('Dynamic Calf Stretch', 'mobilize', 1, ARRAY['Start in a downward dog or push-up position', 'Press one heel down to the floor, bend other knee', 'Hold for 2 seconds and switch sides', 'Alternate dynamically for length'], 'mobilize_calf_stretch'),
  ('Scorpion Stretch', 'mobilize', 2, ARRAY['Lie face down with arms extended wide', 'Lift left leg and reach foot across to right side', 'Keep chest as close to floor as possible', 'Switch sides slowly'], 'mobilize_scorpion'),
  ('Downward Dog', 'mobilize', 2, ARRAY['Start on hands and knees, tuck toes under', 'Lift hips back and up to form an inverted V', 'Press hands firmly into the floor', 'Pedal feet out gently to loosen hamstrings'], 'mobilize_downward_dog'),
  ('Side Bend', 'mobilize', 1, ARRAY['Stand with feet wide, reach arms overhead', 'Clasp left wrist with right hand', 'Gently pull torso to the right, opening side body', 'Switch sides and repeat'], 'mobilize_side_bend'),

  ('Air Squat', 'strengthen', 1, ARRAY['Feet shoulder-width apart, chest tall', 'Lower hips down and back as if sitting in a chair', 'Keep knees tracking over toes', 'Drive through heels to stand back up'], 'strengthen_air_squat'),
  ('Glute Bridge', 'strengthen', 1, ARRAY['Lie on back with knees bent, feet flat on floor', 'Squeeze glutes and lift hips toward ceiling', 'Hold for 1 second at the top', 'Slowly lower back down'], 'strengthen_glute_bridge'),
  ('Incline Push-Up', 'strengthen', 1, ARRAY['Place hands on a wall, bench, or chair', 'Keep body in a straight line from head to heels', 'Lower chest to surface, elbows bent at 45 degrees', 'Press firmly back to starting position'], 'strengthen_incline_pushup'),
  ('Bird-Dog', 'strengthen', 1, ARRAY['Start on hands and knees, core braced', 'Extend opposite arm and leg straight out', 'Hold for 1 second, keeping hips square', 'Return to center and switch sides'], 'strengthen_bird_dog'),
  ('Reverse Lunge', 'strengthen', 2, ARRAY['Stand tall, feet hip-width apart', 'Step back with left foot and lower back knee', 'Keep front knee stacked over front ankle', 'Step back forward and alternate sides'], 'strengthen_reverse_lunge'),
  ('Bodyweight Row', 'strengthen', 2, ARRAY['Hold onto a stable doorframe or pole', 'Lean back slightly, keeping body straight', 'Pull chest toward your hands by squeezing back muscles', 'Control the return to lean position'], 'strengthen_bodyweight_row'),

  ('March in Place', 'move', 1, ARRAY['Stand tall with feet hip-width', 'Drive knees up high, alternating legs', 'Pump arms in rhythm with knees', 'Keep a steady, energized pace'], 'move_march_in_place'),
  ('Shadow Boxing', 'move', 1, ARRAY['Assume an athletic stance, hands protecting chin', 'Throw light, relaxed jabs and crosses', 'Keep weight light on toes', 'Exhale with each throw'], 'move_shadow_boxing'),
  ('Modified Jumping Jacks', 'move', 1, ARRAY['Stand tall, arms at sides', 'Step left foot out while raising arms overhead', 'Step back to center and lower arms', 'Repeat with the right foot to alternate'], 'move_modified_jacks'),
  ('Cardio Step-back', 'move', 1, ARRAY['Start with soft knees', 'Quickly tap left foot back, returning to center', 'Tap right foot back, returning to center', 'Pump arms back and forth dynamically'], 'move_cardio_stepback'),
  ('High Knees', 'move', 2, ARRAY['Jog in place, focusing on pulling knees high', 'Aim for hip height with knees', 'Stay light on the balls of your feet', 'Use arms to drive the pace'], 'move_high_knees'),
  ('Lateral Hops', 'move', 2, ARRAY['Stand with knees slightly bent', 'Jump sideways to the right, landing softly', 'Immediately jump sideways back to the left', 'Keep core engaged and hops springy'], 'move_lateral_hops'),

  ('Legs-up-Wall', 'downshift', 1, ARRAY['Sit sideways next to a wall', 'Swing legs up wall as you lie on your back', 'Scoot hips close to wall, arms relax at sides', 'Focus on long, slow belly breathing'], 'downshift_legs_up_wall'),
  ('Child''s Pose', 'downshift', 1, ARRAY['Kneel on floor, big toes touching, knees wide', 'Sink hips back onto heels', 'Walk hands forward and lower chest to floor', 'Rest forehead on floor and breathe deep'], 'downshift_childs_pose'),
  ('Thread the Needle', 'downshift', 1, ARRAY['Start on hands and knees', 'Slide right arm under left arm, palm up', 'Rest right shoulder and temple on floor', 'Hold and take slow, deep breaths'], 'downshift_thread_needle'),
  ('Reclined Butterfly', 'downshift', 1, ARRAY['Lie on back, soles of feet together', 'Allow knees to fall open to the sides', 'Place one hand on heart, one on belly', 'Feel the breath rise and fall'], 'downshift_reclined_butterfly'),
  ('Sphinx Pose', 'downshift', 1, ARRAY['Lie on belly, elbows under shoulders', 'Press forearms into floor and gently lift chest', 'Keep neck long and shoulders down', 'Breathe softly into front body'], 'downshift_sphinx_pose'),
  ('Corpse Pose', 'downshift', 1, ARRAY['Lie flat on your back, legs slightly apart', 'Let feet flop open, palms facing up', 'Close eyes and soften face and jaw', 'Let go of all muscular effort'], 'downshift_corpse_pose')
ON CONFLICT DO NOTHING;
