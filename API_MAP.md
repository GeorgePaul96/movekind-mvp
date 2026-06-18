# API_MAP.md — data-access surface

MoveKind has **no REST/GraphQL backend of its own**. All data access is the **Supabase
JS client** (`src/services/supabase.ts`) talking directly to Postgres under RLS, plus
Supabase **Auth**. This map lists every query/mutation grouped by caller, so you can find
the one line that touches a table without reading whole files.

## Auth — `src/store/authStore.ts`
| Call | Supabase API |
|---|---|
| restore session | `auth.getSession()` |
| live sync | `auth.onAuthStateChange(...)` |
| sign in | `auth.signInWithPassword({ email, password })` |
| sign up | `auth.signUp({ email, password, options.data.name })` |
| sign out | `auth.signOut()` |

## Session lifecycle — `src/store/sessionStore.ts`
| Method | Tables touched |
|---|---|
| `loadStatsAndHistory()` | SELECT `user_exercise_stats`; SELECT latest `check_ins` (today); SELECT active `sessions` (`generated\|started`); SELECT `session_blocks` (+ joined `exercises`) |
| `checkIn(energy, sleep)` | SELECT `profiles.is_premium`; (quota) count `sessions`; INSERT `check_ins`; SELECT `exercises`; SELECT recent completed `session_blocks`; INSERT `sessions`; INSERT `session_blocks` |
| `safeHarborBypass()` | SELECT `exercises`; INSERT `sessions` (check_in_id null); INSERT `session_blocks` |
| `startSession()` | UPDATE `sessions.status='started'` |
| `completeBlock(id, dur)` | UPDATE `session_blocks` status/actual_duration |
| `skipBlock(id)` | UPDATE `session_blocks.status='skipped'` |
| `completeSession(delta, notes)` | INSERT `post_ratings` (→ trigger updates stats); UPDATE `sessions.status='completed'` |
| `abandonSession()` | UPDATE `sessions.status='abandoned'` |
| `getFreeSessionsCount()` | COUNT `sessions` where `status='completed'` (free tier limit = **5**) |

> The `post_ratings` INSERT is the only path that mutates `user_exercise_stats` —
> via the `sync_user_exercise_stats` DB trigger, not client code. See [DATABASE.md](DATABASE.md).

## Profile — `src/services/profile.ts`
| Fn | Behavior |
|---|---|
| `getProfile(userId)` | SELECT `profiles`; falls back to AsyncStorage cache on error |
| `updateProfile(userId, patch)` | UPDATE `profiles` (`name`/`is_premium`); writes cache |

## Premium — `src/services/premium.ts` (stub)
| Fn | Behavior |
|---|---|
| `isPremium(userId)` | SELECT `profiles.is_premium` |
| `startCheckout(userId)` | **returns null** — placeholder for a Stripe Edge Function |

## External services (not Supabase)
- **PostHog** — `telemetry.identify/capture/reset` (`src/services/telemetry.ts`). No-op
  unless `EXPO_PUBLIC_POSTHOG_API_KEY` is set. Events: `checkin_completed`,
  `session_generated/started/completed/abandoned`, `block_completed/skipped`, `safe_harbor_bypass`.
- **expo-notifications** — daily `daily-nudge` scheduling (`src/services/notifications.ts`).
- **expo-speech** — voice cues in `SessionPlayer`.

## Environment variables
| Key | Required | Purpose |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | yes | anon public key |
| `EXPO_PUBLIC_POSTHOG_API_KEY` | no | enables analytics |
| `EXPO_PUBLIC_POSTHOG_HOST` | no | defaults to `https://us.i.posthog.com` |
