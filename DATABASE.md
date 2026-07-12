# DATABASE.md — Supabase / Postgres

Source of truth: [supabase/schema.sql](supabase/schema.sql). TS mirror: [src/types/index.ts](src/types/index.ts).
**Keep these two in sync** when changing the schema. All tables have **Row Level Security**;
users can only see/modify their own rows.

## Tables

### `profiles`
`id` (uuid, = `auth.users.id`) · `name` · `is_premium` (bool, default false) · `created_at` · `updated_at`.
Auto-created on signup by the `handle_new_user` trigger. RLS: select/insert/update own.

### `check_ins`
`id` · `user_id` → profiles · `energy_score` (int **1–5**, checked) · `sleep_quality`
(`good|fair|poor|null`) · `intention` (text, nullable — optional one-line intention set at
check-in, reflected back at session end) · `engine_version` · `created_at`.
Index: `(user_id, created_at desc)`. RLS: select/insert own.

### `exercises` (read-only library)
`id` · `name` · `category` (`regulate|mobilize|strengthen|move|downshift`) ·
`base_difficulty` (int 1–3) · `cues` (text[]) · `illustration_ref` · `created_at`.
Index: `(category)`. RLS: **select=true for all** (shared library); no client writes.
Seeded with **30 exercises** (6 per category) at the bottom of `schema.sql`.

### `sessions`
`id` · `user_id` → profiles · `check_in_id` → check_ins (nullable; null for Safe Harbor) ·
`state` (`overloaded|recovering|regulated|activated`) ·
`status` (`generated|started|completed|abandoned`, default generated) · `engine_version` · `created_at`.
Index: `(user_id, created_at desc)`. RLS: select/insert/update own.

### `session_blocks`
`id` · `session_id` → sessions · `exercise_id` → exercises · `block_order` (int) ·
`target_duration` (sec) · `actual_duration` (sec, nullable) ·
`status` (`pending|completed|skipped|swapped`, default pending) · `created_at`.
Index: `(session_id)`. RLS: ownership checked via parent `sessions.user_id`.

### `post_ratings`
`id` · `session_id` → sessions · `rating_delta` (int **−1 to 2**, checked) · `notes` · `created_at`.
Index: `(session_id)`. RLS via parent session. **Insert here fires the stats trigger.**

### `user_exercise_stats`
`id` · `user_id` → profiles · `exercise_id` → exercises · `times_completed` ·
`average_energy_delta` (numeric 3,2) · `average_session_completion_rate` (numeric 3,2) ·
`last_completed_at`. **Unique `(user_id, exercise_id)`.** RLS: select own.
**Written only by the trigger below**, never by the client.

## Triggers / functions

- **`handle_new_user()`** — `after insert on auth.users` → inserts a `profiles` row
  (name from `raw_user_meta_data`). `security definer`.
- **`sync_user_exercise_stats()`** — `after insert on post_ratings`. For every `completed`
  block in that session it upserts `user_exercise_stats`, recomputing a running
  `average_energy_delta` from the new `rating_delta`. This is the adaptive-personalization
  engine the composer reads from. `security definer`.

## ER sketch

```
auth.users ─1:1─ profiles ─1:N─ check_ins
                     │
                     ├─1:N─ sessions ─1:N─ session_blocks ─N:1─ exercises
                     │            └─1:N─ post_ratings ──(trigger)──┐
                     └─1:N─ user_exercise_stats ◄──────────────────┘
```

## Changing the schema — checklist
1. Edit `supabase/schema.sql` (statements are idempotent: `if not exists`, `drop policy if exists`).
2. Update the matching interface in `src/types/index.ts`.
3. Update queries (see [API_MAP.md](API_MAP.md)) and this doc.
4. Re-run the SQL in the Supabase SQL editor.
