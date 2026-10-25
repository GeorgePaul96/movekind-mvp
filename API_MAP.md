# API_MAP.md — Data access by caller

There is no network API: every read and write goes through the local repository
[`db`](src/services/db/index.ts). This maps each caller to the repository methods it uses.

## `src/store/gardenStore.ts`

| Action | Repository calls |
|---|---|
| `load()` | `db.checkIns.since(60 days)` · `db.water.since(60 days)` · `db.workouts.all()` |
| `logMood(mood)` | `db.checkIns.update(todayId, {energy_score})` if today has one, else `db.checkIns.add(...)` |
| `addGlass()` / `removeLastGlassToday()` | `db.water.add()` / `db.water.remove(id)` |
| `addWorkout()` / `updateWorkout()` / `removeWorkout()` | `db.workouts.add` / `update` / `remove` |
| `refreshSteps()` | no db: `stepsStatus()` then `stepsByDay(14)` from [steps](src/services/steps.ts), only if access was already given |
| `allowSteps()` | `requestStepsAccess()` (from a tap) then `refreshSteps()` |

Each log action also sends `telemetry.capture('logged', { kind })`, nothing else.

## `src/store/profileStore.ts`

| Action | Repository calls |
|---|---|
| `hydrate()` | `db.profile.get()` |
| `setName()` | `db.profile.update({ name })` |
| `eraseAll()` | `db.eraseAll()` + `settingsStore.reset()` |

## `App.tsx`

| When | Calls |
|---|---|
| launch | `db.dropLegacy()` · `trackAppOpened()` · `disableDailyReminder()` if the reminder is off |
| app returns to foreground | `trackAppOpened()` |

## Screens and components

Screens never call `db` directly: they read `useGardenStore` / `useProfileStore` /
`useSettingsStore` and derive the garden with pure functions from `src/domain/garden/`.
The Me screen calls `enableDailyReminder()` / `disableDailyReminder()` from
[notifications](src/services/notifications.ts).
