# Local-First Architecture — Design

> Approved 2026-10-15. Replaces Supabase as the app's data layer. ROADMAP.md is the plan of record.

## Why

The Supabase project was paused (keep-alive never had its secrets) and the account has no free
project slots left. Benchmarking (Bend, Down Dog, Finch) showed MoveKind's core loop —
check in → session → week view — needs no server: only future social "circles" do. Local-first
removes the blocker permanently, removes server cost, makes privacy a selling point ("your mood
and energy never leave your phone") and makes offline the default.

## Decisions

- **No accounts.** First launch → onboarding (now asks for a name, optional) → Home. Sign In /
  Sign Up screens, `authStore`, `AuthStack` are deleted. A stable random install id stands in
  for `user_id` and for anonymous telemetry identity.
- **Storage:** AsyncStorage (already a dependency, works in Expo Go), one JSON document per
  table, in-memory cache after first read, writes serialized per table so concurrent async calls
  never lose rows. All access goes through one repository module (`src/services/db/`), so a later
  move to SQLite or a sync server touches one folder.
- **Exercise library in code:** `src/data/exercises.ts` holds the 30 seeded exercises with
  **stable ids** (`ex-regulate-1` …) because per-exercise stats are keyed by id.
  "Standing Somatic Shake" is renamed "Standing Shake-Out" (jargon rule); id unchanged.
- **Stats trigger → pure function.** `applyRating(stats, exerciseIds, ratingDelta, now)` in
  `src/domain/sessions/applyRating.ts` ports `sync_user_exercise_stats()` exactly: new exercise →
  times 1, avg = delta; existing → avg = (avg·n + delta)/(n+1), n+1; `last_completed_at = now`.
  `db.ratings.add` applies it in the same write path.
- **Premium:** `profile.is_premium` stored locally; Paywall's beta self-upgrade sets it. Real
  purchases later via store billing (RevenueCat) — still no server of our own.
- **Removed:** `@supabase/supabase-js`, `react-native-url-polyfill`, `services/supabase.ts`,
  `services/outbox.ts` (+ test), `services/profile.ts`, `services/cache.ts`,
  `premium.isPremium`, the keep-alive workflow, Supabase env vars. `supabase/schema.sql` moves to
  `docs/archive/supabase-schema.sql` for when circles need a server.
- **Kept:** `services/network.ts` `friendlyErrorMessage` (generic error copy), composer,
  behavioral engine, entitlements, telemetry contract.
- **Profile screen:** name editable; email + Sign out removed; adds "Erase all my data" with a
  confirmation (honest replacement for sign-out on a shared phone).

## Data model (local)

`profile` (doc: id, name, is_premium, created_at) · `check_ins` · `sessions` · `session_blocks`
(+ `created_at`) · `post_ratings` · `user_exercise_stats`. Types in `src/types/index.ts` are reused
unchanged except `SessionBlock.created_at?`. `user_id` is the install id.

## Trade-offs (accepted)

Uninstall deletes data; no cross-device sync. Mitigation: OS device backups include app data;
"Export my data" is a later item.

## Testing

New: exercise library integrity, `applyRating`, repository (persist across cache reset,
concurrent inserts, update, erase). Store/flow tests run against the **real** repository over the
AsyncStorage jest mock instead of a fake Supabase. All existing behavior tests keep passing.
