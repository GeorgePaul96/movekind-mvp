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
| [checkin/moods.ts](src/domain/checkin/moods.ts) | `MOODS`, `moodToEnergy`, `mapEnergyToState`; yard: `YARD_MOODS`, `yardMoodToEnergy`, `yardMoodOf` |
| [yard/layout.ts](src/domain/yard/layout.ts) | `yardLayout(w, h)`: where every object, tap target and walk spot sits (objects in a 29 to 51% band) |
| [yard/script.ts](src/domain/yard/script.ts) | `yardScript(target)`: the choreography for a tap and what a save or cancel does (hop, roll, bloom, bubble) |
| [yard/moods.ts](src/domain/yard/moods.ts) | Maple's pose and colours per yard mood |

## `src/store/` — Zustand stores (own async)

| File | Owns |
|---|---|
| [gardenStore.ts](src/store/gardenStore.ts) | check-ins, water, workouts, steps (`stepsToday`, `stepsByDay`, `stepsStatus`, `refreshSteps`, `allowSteps`); meals, sleep; `load`, `logMood`, `logYardMood`, `todayYardMood`, `mealsToday`, `setMealsToday`, `lastNightSleep`, `logSleep`, `addGlass`, `removeLastGlassToday`, workout add/update/remove |
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
| [onboarding/OnboardingScreen.tsx](src/screens/onboarding/OnboardingScreen.tsx) | optional name → "Meet Maple and Pudding" |
| [main/YardScreen.tsx](src/screens/main/YardScreen.tsx) | home: Maple's yard, the greeting, tap scripts, speech bubbles, blooms, the drawer, one sheet at a time |
| [main/ChangesView.tsx](src/screens/main/ChangesView.tsx) | (in the drawer) change sentences, a month ago vs today, mood flowerbed |
| [main/HomeScreen.tsx](src/screens/main/HomeScreen.tsx) | **Home.** Four tabs (Today, Changes, Insights, You); loads the garden store. `RootNavigator` shows it unless `settingsStore.yardHome` is on, then `YardScreen` |
| [main/TodayView.tsx](src/screens/main/TodayView.tsx) | Today: greeting, care dots, inline logging for mood, water, food, movement, sleep, steps, One good thing, A slow breath. Pieces (`CareDots`, `Section`, `TabBar`, `BreathPacer`) in `src/components/home/parts.tsx`; `careToday`, `breathAt` in `src/domain/home/care.ts`; copy in `src/constants/homeCopy.ts` |
| [flow/CheckInFlow.tsx](src/components/flow/CheckInFlow.tsx) | The paged check-in: mood, water, food (+ optional calories), movement, sleep. One colour world per page (`flowThemes`), copy in `src/constants/flowCopy.ts`. Opened by `HomeScreen` |
| [home/MonthView.tsx](src/components/home/MonthView.tsx) | "Looking back": five weeks of days at the top of the Changes tab |
| [main/InsightsView.tsx](src/screens/main/InsightsView.tsx) | (in the drawer) Patterns and Export for everyone; behind `bodyEnabled`: `BodyView`, Sleep balance, Steps and health, Fitness estimate with the pulse counter |
| [main/BodyView.tsx](src/screens/main/BodyView.tsx) | Opt-in Body: details form, today's measurements, the report, "at this pace" with the two figures. Shared pieces in `src/components/body/parts.tsx` |
| `src/domain/body/` | Pure body maths: `composition.ts` (Navy body fat, BMI, bands), `energy.ts` (Mifflin-St Jeor, steps and workout energy), `projection.ts` (weight trend, Hall/Forbes simulation, guardrails), `silhouette.ts` (inverted Navy waist, figure outline), `summary.ts` (`bodySummary`, the one place screen and report read from), `units.ts` |
| `src/domain/insights/` | Pure insights: `patterns.ts`, `sleepDebt.ts`, `stepsHealth.ts`, `fitness.ts` (HUNT VO2peak), `report.ts` (`buildReport` for Export) |
| [constants/sources.ts](src/constants/sources.ts) · [constants/bodyCopy.ts](src/constants/bodyCopy.ts) | The citation for every formula · `BODY_COPY` and `INSIGHTS_COPY` (re-exported from `copy.ts`) |
| [store/bodyStore.ts](src/store/bodyStore.ts) | Body profile, measurements and pulse: loading and log actions |
| [main/MeView.tsx](src/screens/main/MeView.tsx) | (in the drawer) **Me**: name, daily reminder switch, local data note, erase |

## `src/components/`

Yard: [yard/YardScene](src/components/yard/YardScene.tsx) (the scene, hotspots, blooms, a11y summary) ·
[yard/Maple](src/components/yard/Maple.tsx) (golden retriever: mood poses, walk, drink, eat, play, hop) ·
[yard/Pudding](src/components/yard/Pudding.tsx) (bulldog: asleep belly up or down, wakes for food) ·
[yard/SpeechBubble](src/components/yard/SpeechBubble.tsx) · [yard/YardDrawer](src/components/yard/YardDrawer.tsx) (pull-up: today, steps, note, Changes, Me) ·
yard art: `src/components/yard/art/` (environment and props; `yardColors` per light) ·
yard/sheets: [Mood](src/components/yard/sheets/MoodSheet.tsx), [Food](src/components/yard/sheets/FoodSheet.tsx), [Sleep](src/components/yard/sheets/SleepSheet.tsx).
Shared (`src/components/park/`, kept from the park): [Hotspot](src/components/park/Hotspot.tsx) (accessible tap target) ·
[Sheet](src/components/park/Sheet.tsx) · [Motion](src/components/park/Motion.tsx) ·
sheets: [Water](src/components/park/sheets/WaterSheet.tsx), [Steps](src/components/park/sheets/StepsSheet.tsx).
Garden: [garden/Garden](src/components/garden/Garden.tsx) (the SVG scene; used by Changes for then-and-now) ·
[garden/WorkoutSheet](src/components/garden/WorkoutSheet.tsx) (two-tap log) ·
[home/MoodPicker](src/components/home/MoodPicker.tsx) (one-tap check-in).
Primitives: [Button](src/components/Button.tsx) · [MoodTile](src/components/MoodTile.tsx) ·
[Chip](src/components/Chip.tsx) · Card, ErrorBoundary.

## `src/navigation/`

[RootNavigator](src/navigation/RootNavigator.tsx) (Onboarding | Main) · [rootRoute](src/navigation/rootRoute.ts) ·
[types.ts](src/navigation/types.ts). No tab bar: Main is the yard.

## `src/` leaf modules

| File | Purpose |
|---|---|
| [types/index.ts](src/types/index.ts) | shared types: Profile, CheckIn (+ optional `mood: YardMood`), WaterLog, Workout, WorkoutType, MealLog, SleepLog, UserState |
| [constants/colors.ts](src/constants/colors.ts) | "Sunrise" tokens, `stateColors`, `gardenColors` (decorative); contrast-tested |
| [constants/copy.ts](src/constants/copy.ts) | user-facing strings (no em dashes) |
| [hooks/useReduceMotion.ts](src/hooks/useReduceMotion.ts) | the phone's reduce-motion setting |
| [utils/format.ts](src/utils/format.ts) | helpers |

## `__tests__/`

Domain: `garden`, `changes`, `moods`. Data: `db`, `gardenStore`, `profileStore`, `settingsStore`.
Yard: `yardLayout`, `yardScript`, `yardMoods`, `yardData`, `sheets`, `YardScreen`.
Screens/components: `ChangesView`, `MeView`, `OnboardingScreen`, `Garden`,
`homeComponents`, `Button`, `ErrorBoundary`. Services: `reminder`, `notificationsExpoGo`, `appOpens`,
`appLaunch`, `telemetryPrivacy`, `network`. Rules: `colors` (contrast), `noEmDash`.
