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
│ components/      UI primitives + home/* (MoodPicker, LoggedPanel,│
│                  WeekView) + session UI (Overview/Player/Complete)│
├──────────────────────────────────────────────────────────────┤
│ store/ (Zustand) profileStore · sessionStore · settingsStore   │
│                  own all async + orchestration                 │
├──────────────────────────────────────────────────────────────┤
│ domain/          PURE: sessions/composer · checkin/moods ·     │
│                  insights/weekCompare · behavioral · premium   │
│ services/        db (local repository) · telemetry ·           │
│                  premium · profile · cache  (all side effects) │
├──────────────────────────────────────────────────────────────┤
│ Device storage   AsyncStorage JSON tables — no backend         │
└──────────────────────────────────────────────────────────────┘
```

**Dependency rule:** `domain/` depends on nothing but `types/`. `store/` may use `domain/`
and `services/`. `services/` wrap external SDKs. Screens/components read stores and render.
Keep this acyclic — it is what makes the composer testable in isolation.

## The capacity-state machine

The user taps a mood tile → `moodToEnergy()` stores `energy_score` 1/2/4/5 (score 3 is
never produced by tiles but still maps for older rows) → `mapEnergyToState()`:

| score | state | session shape (category → seconds) |
|---|---|---|
| 1 | `overloaded` | regulate 180 → downshift 300 → downshift 300 |
| 2–3 | `recovering` | mobilize 180 → regulate 180 → downshift 240 |
| 4 | `regulated` | mobilize 180 → strengthen 360 → move 240 → downshift 180 |
| 5 | `activated` | regulate 120 → strengthen 420 → move 300 → downshift 120 |

The category→duration sequences live in `composeSession()` (`stateSequence`).
**Safe Harbor bypass** (UI: "Too wiped to choose? Start a gentle reset") always composes an
`overloaded` session with no check-in row (for users who can't face a check-in).

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
HomeScreen  (render order: active session → mood tiles → Logged panel → week view)
  └─ MoodPicker ──► sessionStore.logCheckIn(mood)          homeStep='logged'
        • INSERT check_ins (energy from mood; sleep/intention null)
        • if today's check-in exists → UPDATE it instead (a day = one check-in)
        • NO paywall, ever — logging is the free core action
  └─ LoggedPanel ──► updateCheckIn({sleep_quality, intention})   (optional extras)
                 ──► dismissForToday()                      homeStep='done' → WeekView
                 ──► startTodaysSession()
        1. premium/free-quota gate (5 free completed sessions → paywallVisible)
        2. SELECT exercises (full library)
        3. SELECT last 10 completed session_blocks (recency)
        4. composeSession(...)            ◄── pure domain
        5. INSERT sessions (status=generated)
        6. INSERT session_blocks (status=pending)
  └─ WeekView ──► loadWeek() → compareWeeks(...) ◄── pure domain (this week vs last)
             ──► changeTodaysCheckIn()                      homeStep='pick' → tiles
  └─ SessionOverview ──► startSession()            (status=started)
  └─ SessionPlayer ──► completeBlock()/skipBlock()  (per block; voice cues via expo-speech)
  └─ SessionComplete ──► completeSession(ratingDelta, notes)
        • db.ratings.add  ──► applyRating() recomputes user_exercise_stats
        • UPDATE sessions status=completed
        • schedule tomorrow's state-aware notification
        • reload stats/history, homeStep='done', loadWeek()
```

`abandonSession()` mirrors completion but sets `status=abandoned` and skips the rating.

## State & persistence

- **Profile** (`profileStore`): no accounts. A local profile (random install id, optional name,
  premium flag) is created on first launch; its id is the anonymous PostHog id. "Erase all my
  data" wipes the repository and returns to onboarding.
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
