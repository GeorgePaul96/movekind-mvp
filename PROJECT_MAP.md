# PROJECT_MAP.md — file index

"Where is X?" Jump straight to the file instead of scanning.

## Root

| File | Purpose |
|---|---|
| [App.tsx](App.tsx) | Bootstrap (hydrate, drop legacy tables, count app opens) + provider tree + loading gate |
| [app.json](app.json) | Expo app config |
| [babel.config.js](babel.config.js) | Babel + `@/` module-resolver + reanimated/nativewind plugins |
| [metro.config.js](metro.config.js) | Metro + NativeWind |
| [tailwind.config.js](tailwind.config.js) / [global.css](global.css) | NativeWind v4 setup |
| [tsconfig.json](tsconfig.json) | Strict TS + `@/*` path alias |
| [jest.setup.ts](jest.setup.ts) | Test setup |
| [docs/archive/supabase-schema.sql](docs/archive/supabase-schema.sql) | **Archived** former server schema (reference only) |

## `src/domain/` — pure logic (no I/O, no clock)

| File | Purpose |
|---|---|
| [garden/garden.ts](src/domain/garden/garden.ts) | `gardenState(input, now)`: logs → stream, grass, tree, flowers, resting. **The core.** |
| [garden/changes.ts](src/domain/garden/changes.ts) | `weeklyChanges` (plain sentences, this week vs the same stretch of last) · `flowersByWeek` |
| [garden/days.ts](src/domain/garden/days.ts) | local-day helpers: `localDayKey`, `startOfLocalDay`, `isSameLocalDay`, `weekBounds` |
| [checkin/moods.ts](src/domain/checkin/moods.ts) | `MOODS`, `moodToEnergy`, `mapEnergyToState` |

## `src/store/` — Zustand stores (own async)

| File | Owns |
|---|---|
| [gardenStore.ts](src/store/gardenStore.ts) | check-ins, water, workouts, steps (`stepsToday`, `stepsByDay`, `stepsStatus`, `refreshSteps`, `allowSteps`); `load`, `logMood`, `addGlass`, `removeLastGlassToday`, workout add/update/remove |
| [profileStore.ts](src/store/profileStore.ts) | local profile (name, install id); `eraseAll` |
| [settingsStore.ts](src/store/settingsStore.ts) | reminder on/off (default off), reduce motion, onboarded |

## `src/services/` — side-effect wrappers

| File | Purpose |
|---|---|
| [db/](src/services/db/index.ts) | **the only data layer**: local repository over AsyncStorage (`table.ts` = serialized JSON tables) |
| [telemetry.ts](src/services/telemetry.ts) / [telemetryPrivacy.ts](src/services/telemetryPrivacy.ts) | PostHog wrapper (no-op without a key) + property sanitizer |
| [appOpens.ts](src/services/appOpens.ts) | `trackAppOpened` → `app_opened {day_index}` |
| [notifications.ts](src/services/notifications.ts) | `enableDailyReminder` / `disableDailyReminder` (lazy expo-notifications; no-op in Expo Go Android) |
| [steps.ts](src/services/steps.ts) | daily steps: iOS pedometer / Android Health Connect; `stepsStatus`, `requestStepsAccess`, `stepsByDay` |
| [network.ts](src/services/network.ts) | `friendlyErrorMessage` (calm error copy) |

## `src/screens/`

| File | Purpose |
|---|---|
| [onboarding/OnboardingScreen.tsx](src/screens/onboarding/OnboardingScreen.tsx) | optional name → "how your garden grows" |
| [main/GardenScreen.tsx](src/screens/main/GardenScreen.tsx) | home: garden, one note, today's mood, Water / Workout / Steps, today's workouts |
| [main/ChangesScreen.tsx](src/screens/main/ChangesScreen.tsx) | change sentences, a month ago vs today, mood flowerbed |
| [main/ProfileScreen.tsx](src/screens/main/ProfileScreen.tsx) | the **Me** tab: name, daily reminder switch, local data note, erase |

## `src/components/`

Garden: [garden/Garden](src/components/garden/Garden.tsx) (the SVG scene) ·
[garden/QuickActions](src/components/garden/QuickActions.tsx) ·
[garden/WorkoutSheet](src/components/garden/WorkoutSheet.tsx) (two-tap log) ·
[garden/StepsWeekSheet](src/components/garden/StepsWeekSheet.tsx) (last 7 days) ·
[home/MoodPicker](src/components/home/MoodPicker.tsx) (one-tap check-in).
Primitives: [Button](src/components/Button.tsx) · [ActionTile](src/components/ActionTile.tsx) ·
[MoodTile](src/components/MoodTile.tsx) · [Chip](src/components/Chip.tsx) · Card, Header, Screen, ErrorBoundary.

## `src/navigation/`

[RootNavigator](src/navigation/RootNavigator.tsx) (Onboarding | Main) · [rootRoute](src/navigation/rootRoute.ts) ·
[TabNavigator](src/navigation/TabNavigator.tsx) (Garden · Changes · Me) · [TabIcon](src/navigation/TabIcon.tsx) ·
[types.ts](src/navigation/types.ts).

## `src/` leaf modules

| File | Purpose |
|---|---|
| [types/index.ts](src/types/index.ts) | shared types: Profile, CheckIn, WaterLog, Workout, WorkoutType, UserState |
| [constants/colors.ts](src/constants/colors.ts) | "Sunrise" tokens, `stateColors`, `gardenColors` (decorative); contrast-tested |
| [constants/copy.ts](src/constants/copy.ts) | user-facing strings (no em dashes) |
| [hooks/useReduceMotion.ts](src/hooks/useReduceMotion.ts) | the phone's reduce-motion setting |
| [utils/format.ts](src/utils/format.ts) | helpers |

## `__tests__/`

Domain: `garden`, `changes`, `moods`. Data: `db`, `gardenStore`, `profileStore`, `settingsStore`.
Screens/components: `GardenScreen`, `ChangesScreen`, `MeScreen`, `OnboardingScreen`, `Garden`,
`homeComponents`, `Button`, `ErrorBoundary`. Services: `reminder`, `notificationsExpoGo`, `appOpens`,
`appLaunch`, `telemetryPrivacy`, `network`. Rules: `colors` (contrast), `noEmDash`.
