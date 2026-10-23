# ARCHITECTURE.md — MoveKind MVP

## Layering

```
┌──────────────────────────────────────────────────────────────┐
│ App.tsx          bootstrap: hydrate settings + profile, drop   │
│                  legacy tables, count the app open; no prompts │
├──────────────────────────────────────────────────────────────┤
│ navigation/      RootNavigator → Onboarding | Main (tabs:      │
│                  Garden · Changes · Me), gated by `onboarded`  │
├──────────────────────────────────────────────────────────────┤
│ screens/         GardenScreen · ChangesScreen · ProfileScreen  │
│                  (Me) · OnboardingScreen — thin, read stores    │
│ components/      garden/* (Garden, QuickActions, WorkoutSheet) │
│                  · home/MoodPicker · ActionTile · Button · Chip │
├──────────────────────────────────────────────────────────────┤
│ store/ (Zustand) gardenStore · profileStore · settingsStore    │
│                  own all async + db calls                      │
├──────────────────────────────────────────────────────────────┤
│ domain/          PURE: garden/garden · garden/changes ·         │
│                  garden/days · checkin/moods                   │
│ services/        db (local repository) · telemetry · appOpens · │
│                  notifications · network  (all side effects)    │
├──────────────────────────────────────────────────────────────┤
│ Device storage   AsyncStorage JSON tables, no backend           │
└──────────────────────────────────────────────────────────────┘
```

**Dependency rule:** `domain/` depends only on `types/`, `constants/` (copy, for sentences) and
other `domain/` modules. `store/` may use `domain/` and `services/`. `services/` wrap external SDKs.
Screens/components read stores and render. Keep this acyclic: it is what makes the garden logic
testable in isolation.

## Data flow

```
tap Water / Workout / mood tile
   → gardenStore action → db.water | db.workouts | db.checkIns (AsyncStorage)
   → store state updates → telemetry 'logged' {kind}
   → screen derives gardenState(input, now) and weeklyChanges(input, now)
   → <Garden state> draws stream / grass / tree / flowers (SVG)
```

Nothing about the garden is stored: it is recomputed from the logs every render, so it can never
drift from what the user actually logged, and the past garden is just `gardenState(input, then)`.

## The garden rules

| Part | Input | Rule (see `garden.ts`) |
|---|---|---|
| Stream 0–4 | glasses today | 0 → trickle (still drawn), 1–2 → 1, 3–4 → 2 (+ ducks), 5–6 → 3, 7+ → 4 |
| Grass 1–4 | steps today | null or <2000 → 1, <5000 → 2, <8000 → 3, else 4 |
| Tree 0–6 | all-time workout minutes | `TREE_STAGE_MINUTES = [0,1,60,180,360,600,1000]`; birds from 3; never shrinks |
| Flowers | check-ins, last 28 days | one per local day, latest mood wins, colour `stateColors[mood].tint` |
| Resting | nothing logged today or the 2 days before | moon instead of sun; nothing else changes |

## Launch sequence (App.tsx)

1. Hydrate settings and profile (local only).
2. `db.dropLegacy()` removes the old session app's tables.
3. `trackAppOpened(profile.created_at)` → `app_opened {day_index}` (also on every return to foreground).
4. If the reminder is off, `disableDailyReminder()` clears any reminder an older version scheduled.
   **No permission is ever requested at launch.**
