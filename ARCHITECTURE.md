# ARCHITECTURE.md — MoveKind MVP

## Layering

```
┌──────────────────────────────────────────────────────────────┐
│ App.tsx          bootstrap: restore auth, hydrate settings,    │
│                  init notifications, then render navigator     │
├──────────────────────────────────────────────────────────────┤
│ navigation/      RootNavigator → Auth | Onboarding | Main      │
│                  (gated by session + onboarded flags)          │
├──────────────────────────────────────────────────────────────┤
│ screens/         auth/* and main/* — thin; delegate to stores  │
│ components/      UI primitives + session UI (CheckInFlow,       │
│                  SessionOverview, SessionPlayer, SessionComplete)│
├──────────────────────────────────────────────────────────────┤
│ store/ (Zustand) authStore · sessionStore · settingsStore      │
│                  own all async + orchestration                 │
├──────────────────────────────────────────────────────────────┤
│ domain/          composer.ts — PURE session composition        │
│ services/        supabase · telemetry · notifications ·         │
│                  premium · profile · cache  (all side effects) │
├──────────────────────────────────────────────────────────────┤
│ Supabase         Postgres + Auth + RLS + triggers (schema.sql) │
└──────────────────────────────────────────────────────────────┘
```

**Dependency rule:** `domain/` depends on nothing but `types/`. `store/` may use `domain/`
and `services/`. `services/` wrap external SDKs. Screens/components read stores and render.
Keep this acyclic — it is what makes the composer testable in isolation.

## The capacity-state machine

`energy_score` (1–5) from a check-in → `mapEnergyToState()`:

| score | state | session shape (category → seconds) |
|---|---|---|
| 1 | `overloaded` | regulate 180 → downshift 300 → downshift 300 |
| 2–3 | `recovering` | mobilize 180 → regulate 180 → downshift 240 |
| 4 | `regulated` | mobilize 180 → strengthen 360 → move 240 → downshift 180 |
| 5 | `activated` | regulate 120 → strengthen 420 → move 300 → downshift 120 |

The category→duration sequences live in `composeSession()` (`stateSequence`).
**Safe Harbor bypass** always composes an `overloaded` session with no check-in row
(for users who can't face a check-in).

## Composer scoring (per block)

For each step in a state's sequence, candidates of the right category are scored:

- Base `100`.
- **Anti-repetition penalty:** if the exercise is in the last-10 completed list,
  subtract `100 - recentIndex*20` (more recent ⇒ bigger penalty).
- **Adaptive boost:** `+ round(stat.average_energy_delta * 15)` from `user_exercise_stats`.

Highest score wins; chosen exercises can't repeat within a session. Fallback: if a category
has no unused candidates, reuse the first matching exercise (handles tiny libraries).

## Primary data flow — a session lifecycle

```
HomeScreen
  └─ CheckInFlow ──► sessionStore.checkIn(energy, sleep)
        1. premium/free-quota gate (5 free completed sessions → paywallVisible)
        2. INSERT check_ins
        3. SELECT exercises (full library)
        4. SELECT last 10 completed session_blocks (recency)
        5. composeSession(...)            ◄── pure domain
        6. INSERT sessions (status=generated)
        7. INSERT session_blocks (status=pending)
  └─ SessionOverview ──► startSession()            (status=started)
  └─ SessionPlayer ──► completeBlock()/skipBlock()  (per block; voice cues via expo-speech)
  └─ SessionComplete ──► completeSession(ratingDelta, notes)
        • INSERT post_ratings  ──► DB TRIGGER recomputes user_exercise_stats
        • UPDATE sessions status=completed
        • schedule tomorrow's state-aware notification
        • reload stats/history
```

`abandonSession()` mirrors completion but sets `status=abandoned` and skips the rating.

## State & persistence

- **Auth** (`authStore`): subscribes to `supabase.auth.onAuthStateChange`; session persisted
  by Supabase via AsyncStorage. Identifies the user in PostHog.
- **Session** (`sessionStore`): the live session, composed blocks, active index, and cached
  `userStats`. Rehydrated on entering the authed tabs via `loadStatsAndHistory()`.
- **Settings** (`settingsStore`): notifications/reduceMotion/onboarding flags + onboarding
  answers, persisted to AsyncStorage under `@movekind/settings`.

## Cross-cutting

- **Navigation gating** ([RootNavigator.tsx](src/navigation/RootNavigator.tsx)):
  no session → `Auth`; session but `!onboarded` → `Onboarding`; else → `Main` tabs
  (Home / Journey / Profile).
- **Telemetry** is fire-and-forget through `telemetry.capture()`; safe no-op when unconfigured.
- **Notifications** are best-effort, web-guarded, and self-replacing (only cancels its own
  `daily-nudge` entries).
