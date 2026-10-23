# MoveKind Garden Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace MoveKind's guided sessions with a garden home that grows from logged water, workouts, mood check-ins and (stage 2) steps.

**Architecture:** Pure garden and changes logic in `src/domain/garden/` (unit-tested like the composer was), new local tables behind `src/services/db`, one Zustand store (`gardenStore`) replacing `sessionStore`, an SVG garden drawn in code. Stage 1 runs in Expo Go; stage 2 adds a development build for steps only.

**Tech Stack:** Expo SDK 57, React Native 0.86, TypeScript strict, Zustand, react-native-svg (installed), AsyncStorage via `src/services/db`, Jest + Testing Library. Stage 2: expo-dev-client, expo-sensors (iOS steps), react-native-health-connect + expo-health-connect (Android steps).

**Spec:** `docs/superpowers/specs/2026-10-23-garden-pivot-design.md`

## Global Constraints

- Never visibly backwards: no drying, browning, wilting, dying, red, "you missed". Stream and grass have a non-zero floor; tree never shrinks.
- No targets, streak counters, scores, or comparisons with other people.
- Every mood flower equally pretty; no mood presented as worse.
- No calorie, weight, BMI or body-composition features.
- Health data never leaves the phone; telemetry sends event names and coarse non-value props only (never glass counts, minutes, steps, moods).
- All user-facing copy in `src/constants/copy.ts`; no em dashes (enforced by `__tests__/noEmDash.test.ts`).
- All colour from `src/constants/colors.ts` tokens; any new text/UI pair added to `__tests__/colors.test.ts` (text ≥4.5:1, UI ≥3:1). Garden illustration colours live in a `gardenColors` token group marked decorative.
- Minimum font 13; 44pt touch targets; only `<Button>`, `<Chip>`, `<MoodTile>` for controls; every control has an accessibility label.
- The garden respects the phone's reduce-motion setting.
- Imports use `@/`. Side effects only in `src/services/`, never `src/domain/`.
- Stage 1 adds **no native modules** (must run in Expo Go).
- Daily reminder **off by default**; no permission prompt at launch.
- Verify every task with `npm run typecheck` and `npm test`.

## Review Focus

1. **Day boundaries in local time.** A glass logged at 23:59 and one at 00:01 belong to different days; stream/grass reset at local midnight, not UTC. → test in Task 1 (`resets at local midnight`).
2. **Re-picking today's mood** edits today's flower instead of planting a second one. → test in Task 3 (`re-picking today's mood replaces the flower`).
3. **Quick repeated taps on Water** (5 taps in a row) all count and none is lost. → test in Task 3 (`five quick glasses all land`).
4. **Old data on testers' phones** (sessions, ratings, stats keys, `safetyAcknowledged`) never crashes launch and is removed once. → test in Task 8 (`drops legacy tables, keeps profile and check-ins`).
5. **Empty first launch**: no logs at all still shows a calm sprout garden and a friendly note, never an empty chart or "0". → tests in Task 1 (`empty input is a calm sprout garden`) and Task 6 (`first week shows a welcome line`).

---

## File Structure

| File | Responsibility |
|---|---|
| `src/domain/garden/days.ts` | local day keys and week bounds (moved `weekBounds`, `isSameLocalDay` from `weekCompare.ts`) |
| `src/domain/garden/garden.ts` | `gardenState()`: pure inputs → what the garden shows |
| `src/domain/garden/changes.ts` | `weeklyChanges()`, `flowersByWeek()`: plain-sentence comparisons |
| `src/types/index.ts` | add `WaterLog`, `Workout`, `WorkoutType`; remove session/exercise types (Task 8) |
| `src/services/db/table.ts`, `index.ts` | add `remove(id)`; `water` and `workouts` tables; legacy cleanup |
| `src/store/gardenStore.ts` | load + log actions; replaces `sessionStore` |
| `src/hooks/useReduceMotion.ts` | port from `exercise-figures` branch |
| `src/components/garden/Garden.tsx` | the SVG scene |
| `src/components/garden/QuickActions.tsx` | Water / Workout / Steps buttons |
| `src/components/garden/WorkoutSheet.tsx` | the two-tap log + today's list (edit/delete) |
| `src/screens/main/GardenScreen.tsx` | home (replaces `HomeScreen`) |
| `src/screens/main/ChangesScreen.tsx` | replaces `JourneyScreen` |
| `src/screens/main/ProfileScreen.tsx` | becomes **Me**: name, reminder toggle, erase |
| `src/services/notifications.ts` | `enableDailyReminder()` / `disableDailyReminder()` |
| `src/services/steps.ts` | stage 2 only |

---

## Stage 1 (Expo Go)

### Task 1: Garden domain

**Files:**
- Create: `src/domain/garden/days.ts`, `src/domain/garden/garden.ts`
- Modify: `src/domain/insights/weekCompare.ts` (re-export `weekBounds`, `isSameLocalDay` from `days.ts` until Task 8 deletes it)
- Test: `__tests__/garden.test.ts`

**Interfaces:**
- Produces:
  - `localDayKey(d: Date): string` (`'YYYY-MM-DD'` in local time)
  - `isSameLocalDay(a: Date, b: Date): boolean`, `weekBounds(now: Date)` (unchanged signatures, moved)
  - `type GardenInput = { checkIns: {energy_score: number; created_at: string}[]; water: {created_at: string}[]; workouts: {minutes: number; created_at: string}[]; stepsToday: number | null }`
  - `type GardenState = { stream: 0|1|2|3|4; ducks: boolean; grass: 1|2|3|4; tree: 0|1|2|3|4|5|6; birds: boolean; flowers: { day: string; mood: UserState }[]; resting: boolean }`
  - `gardenState(input: GardenInput, now: Date): GardenState` (ignores entries after `now`, so `gardenState(input, monthAgo)` gives the past garden)
  - `TREE_STAGE_MINUTES = [0, 1, 60, 180, 360, 600, 1000]`

Values (builder may tune later, but these are the tested defaults):
- `stream` from glasses logged today: 0 → 0 (gentle trickle, still drawn), 1–2 → 1, 3–4 → 2, 5–6 → 3, 7+ → 4. `ducks = stream >= 2`.
- `grass` from `stepsToday`: `null` → 1 (calm default), <2000 → 1, <5000 → 2, <8000 → 3, else 4.
- `tree`: highest index i where cumulative workout minutes ≥ `TREE_STAGE_MINUTES[i]` (first logged workout ⇒ stage 1). `birds = tree >= 3`.
- `flowers`: one per local day with a check-in in the 28 days up to `now`; the latest check-in that day wins; mood = `mapEnergyToState(energy_score)`; oldest first.
- `resting`: nothing logged (water, workout, check-in) today **or** the previous 2 local days. Stream/grass/tree/flowers are still reported unchanged while resting.

- [ ] **Step 1: Write the failing tests** in `__tests__/garden.test.ts`:
  - `empty input is a calm sprout garden` → `{stream:0, ducks:false, grass:1, tree:0, birds:false, flowers:[], resting:true}`
  - `one glass makes the stream visibly fuller` → stream 1; `three glasses bring ducks` → stream 2, ducks true; `nine glasses cap at 4`
  - `resets at local midnight` → 3 glasses at 23:59 yesterday, 0 today ⇒ stream 0
  - `the first workout grows the tree` → one 10-min workout ⇒ tree 1; `tree never shrinks over time` → same workouts, `now` + 60 days ⇒ same tree stage
  - `birds arrive at 180 minutes`
  - `steps unknown keeps grass calm, never below 1` → `stepsToday: null` ⇒ 1; `0` ⇒ 1; `8000` ⇒ 4
  - `one flower per day, latest mood wins` → two check-ins today (energy 1 then 5) ⇒ one flower `activated`
  - `flowers older than 28 days fall out of the bed`
  - `resting after three quiet days, awake after any log`
  - `the past garden ignores later entries` → workout dated after `now` does not count
- [ ] **Step 2: Run** `npx jest __tests__/garden.test.ts` → FAIL (module not found)
- [ ] **Step 3: Implement** `days.ts` and `garden.ts` per the interfaces above. Pure: no React, no storage, no `Date.now()` (only the `now` parameter).
- [ ] **Step 4: Run** `npx jest __tests__/garden.test.ts __tests__/weekCompare.test.ts` → PASS; `npm run typecheck` → clean
- [ ] **Step 5: Commit** `feat(garden): pure garden state from water, workouts, moods and steps`

### Task 2: Water and workout storage

**Files:**
- Modify: `src/types/index.ts`, `src/services/db/table.ts`, `src/services/db/index.ts`, `DATABASE.md`
- Test: `__tests__/db.test.ts`

**Interfaces:**
- Produces:
  - `type WorkoutType = 'walk' | 'run' | 'yoga' | 'gym' | 'cycle' | 'sport' | 'dance' | 'other'`
  - `interface WaterLog { id: string; created_at: string }`
  - `interface Workout { id: string; type: WorkoutType; minutes: number; created_at: string }`
  - `Table<T>.remove(id: string): Promise<void>`
  - `db.water.add(): Promise<WaterLog>`, `db.water.since(iso: string): Promise<WaterLog[]>`, `db.water.remove(id: string): Promise<void>`
  - `db.workouts.add(input: { type: WorkoutType; minutes: number }): Promise<Workout>`, `db.workouts.all(): Promise<Workout[]>` (newest first), `db.workouts.update(id, patch: Partial<Pick<Workout,'type'|'minutes'>>)`, `db.workouts.remove(id)`
  - `eraseAll()` also clears `water` and `workouts`.
  - Table names: `'water'`, `'workouts'`.

- [ ] **Step 1: Write failing tests** in `__tests__/db.test.ts`: `water.add then since returns it`, `water.remove deletes one glass`, `workouts add/update/remove round-trip`, `workouts.all is newest first`, `eraseAll clears water and workouts`, `remove of an unknown id is a no-op`.
- [ ] **Step 2: Run** `npx jest __tests__/db.test.ts` → FAIL
- [ ] **Step 3: Implement**; `remove` goes through the same serialized `mutate` queue as other writes. Document both tables in `DATABASE.md`.
- [ ] **Step 4: Run** `npx jest __tests__/db.test.ts` → PASS; typecheck clean
- [ ] **Step 5: Commit** `feat(db): water and workout tables`

### Task 3: gardenStore

**Files:**
- Create: `src/store/gardenStore.ts`
- Test: `__tests__/gardenStore.test.ts`

**Interfaces:**
- Consumes: `db.checkIns`, `db.water`, `db.workouts` (Task 2), `moodToEnergy` (`src/domain/checkin/moods.ts`), `localDayKey` (Task 1)
- Produces `useGardenStore` with state `{ checkIns: CheckIn[]; water: WaterLog[]; workouts: Workout[]; stepsToday: number | null; loaded: boolean; error: string | null }` and actions:
  - `load(): Promise<void>` (check-ins and water from the last 60 days; all workouts)
  - `logMood(mood: UserState): Promise<void>` (one check-in per local day: re-picking updates today's `energy_score`)
  - `addGlass(): Promise<void>`, `removeLastGlassToday(): Promise<void>`
  - `addWorkout(type: WorkoutType, minutes: number)`, `updateWorkout(id, patch)`, `removeWorkout(id)`
  - `todayMood(): UserState | null`
  - `gardenInput(): GardenInput` (feeds `gardenState`)
  - `stepsToday` stays `null` in stage 1.
- Each log action captures telemetry `telemetry.capture('logged', { kind: 'water' | 'workout' | 'mood' })` and nothing else.
- Errors: set `error` with `friendlyErrorMessage(err)` and rethrow (UI offers a one-tap retry, like `MoodPicker` today).

- [ ] **Step 1: Write failing tests**: `logMood saves a check-in`, `re-picking today's mood replaces the flower` (one row, new energy), `five quick glasses all land` (fire 5 `addGlass()` without awaiting, then `load()` ⇒ 5), `removeLastGlassToday never touches yesterday`, `addWorkout grows gardenInput().workouts`, `telemetry carries only the kind` (spy on `telemetry.capture`; props deep-equal `{kind:'water'}`).
- [ ] **Step 2: Run** → FAIL
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npx jest __tests__/gardenStore.test.ts` → PASS; typecheck clean
- [ ] **Step 5: Commit** `feat(store): gardenStore for moods, water and workouts`

### Task 4: The garden scene

**Files:**
- Create: `src/components/garden/Garden.tsx`, `src/hooks/useReduceMotion.ts` (copy from `git show exercise-figures:src/hooks/useReduceMotion.ts`)
- Modify: `src/constants/colors.ts` (add `gardenColors`), `src/constants/copy.ts` (`GARDEN_COPY.a11ySummary(state: GardenState): string`)
- Test: `__tests__/Garden.test.tsx`

**Interfaces:**
- Consumes: `GardenState` (Task 1)
- Produces: `<Garden state={GardenState} height?: number />` filling its parent's width; `viewBox="0 0 290 250"` like the mockup.

Scene (from the approved mockup `.superpowers/brainstorm/515-1792746702/content/garden-home.html`): warm sky + sun, two rolling hills, a stream crossing the lower hill whose width/opacity rises with `stream` (level 0 is still a visible thin trickle), grass blades whose height scales with `grass`, a tree drawn per `tree` stage (sprout → sapling → tree → birds → blossom → fruit → second tree), ducks on the stream when `ducks`, flowers along the front edge coloured `stateColors[mood].tint`, and when `resting` a soft evening sky (moon instead of sun, cooler tint) with everything else unchanged. Gentle motion only (grass sway, stream shimmer, ~4–6 s cycles) and none when reduce motion is on.

`gardenColors` (decorative; not text, exempt from contrast pairs, say so in the comment): `sky, skyRest, sun, moon, hillBack, hillFront, grass, stream, streamDeep, trunk, leaf, leafLight, blossom, fruit, bird, duck`. Use the mockup's hex values as the starting palette.

- [ ] **Step 1: Write failing tests**: `has a spoken summary` (`getByLabelText` matches `GARDEN_COPY.a11ySummary(state)`), `summary never uses negative words` (for every combination of stream 0–4 × grass 1–4 × tree 0–6 × resting, summary contains none of `/dry|dead|dying|wilt|brown|missed|lost/i`), `ducks appear at stream 2` (testID `duck` present/absent), `fruit appears at tree 5` (testID `fruit`), `resting shows the moon` (testID `moon`), `one flower per entry` (count testID `flower`), `holds still with reduce motion` (mock `useReduceMotion` → true; advance timers; grass blade `y` unchanged).
- [ ] **Step 2: Run** → FAIL
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npx jest __tests__/Garden.test.tsx __tests__/colors.test.ts __tests__/noEmDash.test.ts` → PASS
- [ ] **Step 5: Commit** `feat(garden): the garden scene, drawn in code`

### Task 5: Garden home, quick actions and workout sheet

**Files:**
- Create: `src/screens/main/GardenScreen.tsx`, `src/components/garden/QuickActions.tsx`, `src/components/garden/WorkoutSheet.tsx`
- Modify: `src/navigation/TabNavigator.tsx`, `src/navigation/types.ts` (tabs `Garden`, `Changes`, `Me`), `src/components/home/MoodPicker.tsx` (use `useGardenStore().logMood`; drop the "gentle reset" link), `src/constants/copy.ts` (`GARDEN_COPY`, `WORKOUT_COPY`)
- Test: `__tests__/GardenScreen.test.tsx`

**Interfaces:**
- Consumes: `useGardenStore` (Task 3), `gardenState` (Task 1), `<Garden>` (Task 4), `weeklyChanges` first line (Task 6; until then a `GARDEN_COPY.defaultNote`)
- Produces: tab names `'Garden' | 'Changes' | 'Me'` in `TabParamList`.

Layout A from the spec: greeting with name, `<Garden>`, one note line, the mood prompt (a compact `MoodPicker` shown until today's mood is picked, then a small "Today: <flower>" line that re-opens it), then `QuickActions`:
- **Water**: one tap = `addGlass()`; label shows today's count (`GARDEN_COPY.glasses(n)`); long-press or a small "undo" link calls `removeLastGlassToday()`.
- **Workout**: opens `WorkoutSheet` (React Native `Modal`, slide up). Type chips: Walk, Run, Yoga, Gym, Cycle, Sport, Dance, Other. Duration chips: 10, 20, 30, 45, 60 (label "1 hr+"). Primary button "Add to my garden" enabled once both picked. Below: today's workouts with edit (re-open sheet prefilled) and delete.
- **Steps**: stage 1 shows `GARDEN_COPY.stepsSoon` ("Steps arrive soon") and is not a dead control (it explains, via `accessibilityHint`).

- [ ] **Step 1: Write failing tests**: `water tap adds a glass and updates the count`, `workout needs a type and a length before saving`, `saving a workout closes the sheet and lists it under today`, `deleting a workout removes it`, `mood tiles show until today's mood is picked`, `steps shows the arrive-soon state`, `tabs are Garden, Changes, Me`.
- [ ] **Step 2: Run** → FAIL
- [ ] **Step 3: Implement.** Mount `GardenScreen` as the `Garden` tab; keep `JourneyScreen`/`ProfileScreen` mounted as `Changes`/`Me` until Tasks 6–7 replace them.
- [ ] **Step 4: Run** full `npm test` → PASS (old session tests still pass; nothing deleted yet); typecheck clean
- [ ] **Step 5: Commit** `feat(garden): garden home with water, workout log and mood`

### Task 6: Changes tab

**Files:**
- Create: `src/domain/garden/changes.ts`, `src/screens/main/ChangesScreen.tsx`
- Modify: `src/constants/copy.ts` (`CHANGES_COPY`), `TabNavigator.tsx`, `GardenScreen.tsx` (note = first `weeklyChanges` line)
- Test: `__tests__/changes.test.ts`, `__tests__/ChangesScreen.test.tsx`

**Interfaces:**
- Consumes: `GardenInput`, `gardenState`, `weekBounds`, `localDayKey` (Task 1)
- Produces:
  - `type ChangeLine = { kind: 'steps' | 'workouts' | 'water' | 'checkins' | 'welcome'; text: string }`
  - `weeklyChanges(input: GardenInput & { stepsByDay?: Record<string, number> }, now: Date): ChangeLine[]` (this week vs last week, ordered most-encouraging first)
  - `flowersByWeek(checkIns: GardenInput['checkIns'], now: Date, weeks = 4): { weekStart: string; flowers: { day: string; mood: UserState }[] }[]`

Rules: up = celebrate in a plain sentence ("You logged 3 workouts this week, one more than last week."); same = steady ("Same number of workouts as last week. Steady counts."); down = neutral and never a number of what was lost ("A quieter week for workouts. Your tree keeps everything it has grown."). Steps line only when `stepsByDay` is given (stage 2). First week (no last-week data) ⇒ a single `welcome` line.

Screen: the change lines; "A month ago / Today" side by side (`<Garden state={gardenState(input, now − 28 days)}>` and today's); the flowerbed by week (`flowersByWeek`, each week a row of small flowers with the week's start date). No charts, no numbers of targets, no streaks.

- [ ] **Step 1: Write failing tests**: `more workouts this week is celebrated`, `fewer workouts is gentle and states no shortfall` (text has no digits and none of `/less|fewer|down|drop|missed/i`), `same is steady`, `first week shows a welcome line`, `no steps line without step data`, `flowersByWeek groups by local week, 4 weeks, oldest first`; screen: `shows a month-ago garden and today's`, `shows the flowerbed`.
- [ ] **Step 2: Run** → FAIL
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test` → PASS; typecheck clean
- [ ] **Step 5: Commit** `feat(changes): what your activity is changing, in plain sentences`

### Task 7: Me tab, reminder off by default, simpler onboarding, open telemetry

**Files:**
- Modify: `src/screens/main/ProfileScreen.tsx` (rename tab label "Me"; remove the Premium card), `src/store/settingsStore.ts` (`notificationsEnabled` default `false`; drop `safetyAcknowledged`, `onboardingAnswers`), `src/services/notifications.ts`, `App.tsx`, `src/screens/onboarding/OnboardingScreen.tsx`, `src/navigation/rootRoute.ts`, `RootNavigator.tsx`, `src/constants/copy.ts`
- Test: `__tests__/notifications*.test.ts`, `__tests__/settingsStore.test.ts`, `__tests__/rootRoute.test.ts` (create if absent), `__tests__/telemetryOpen.test.ts`

**Interfaces:**
- Produces:
  - `enableDailyReminder(): Promise<boolean>` (asks permission; schedules one 9:00 repeating local reminder with `REMINDER_COPY.body`; returns false if denied or unavailable)
  - `disableDailyReminder(): Promise<void>`
  - `rootRoute(s: { onboarded: boolean }): 'Onboarding' | 'Main'`
  - `completeOnboarding(): Promise<void>` (no answers argument)
  - `trackAppOpened(profileCreatedAt: string, now: Date): void` in `src/services/telemetry.ts`, capturing `'app_opened'` with `{ day_index: number }` (whole local days since install)
- `App.tsx` no longer calls `initNotifications()` at launch; it calls `trackAppOpened` on launch and whenever `AppState` becomes `active`.
- Onboarding: the name step, then one short "Your garden grows with you" screen (water → stream, steps → grass, workouts → tree, moods → flowers), then Main. The four movement questions are removed.
- Me: name, a reminder `Switch` row (calls enable/disable; if permission denied, switch returns to off with a calm line), local-data note, "Erase all my data".

- [ ] **Step 1: Write failing tests**: `reminder is off on first launch`, `launch never asks for notification permission` (render `App`; `requestPermissionsAsync` not called), `enabling schedules one daily reminder`, `denied permission leaves the switch off`, `rootRoute goes straight from onboarding to Main`, `app_opened carries only day_index`.
- [ ] **Step 2: Run** → FAIL
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test` → PASS; typecheck clean
- [ ] **Step 5: Commit** `feat(me): reminder off by default, simpler onboarding, open tracking`

### Task 8: Remove guided sessions and update the docs

**Files:**
- Delete: `src/domain/sessions/**`, `src/domain/premium/**`, `src/domain/behavioral/**`, `src/domain/insights/weekCompare.ts`, `src/data/exercises.ts`, `src/data/voiceClips.generated.ts`, `assets/voice/**`, `scripts/voice/**`, `src/services/voicePlayer.ts`, `src/services/premium.ts`, `src/services/behavioralProfile.ts`, `src/hooks/useBehavioralProfile.ts`, `src/store/sessionStore.ts`, `src/components/{SessionPlayer,SessionOverview,SessionComplete,Paywall,BehavioralBanner,BarChart,WeekCard,Slider}.tsx`, `src/components/home/{LoggedPanel,WeekView}.tsx`, `src/screens/main/{HomeScreen,JourneyScreen}.tsx`, `src/screens/onboarding/SafetyNoticeScreen.tsx`, `docs/exercise-source-review.md`, and every test that only covers deleted code.
- Modify: `src/types/index.ts` (drop `Exercise`, `Session`, `SessionBlock`, `PostRating`, `UserExerciseStats`, `Profile.is_premium`), `src/services/db/index.ts` (drop those tables; add `dropLegacy()`), `App.tsx` (call `db.dropLegacy()` once after hydrate), `package.json` (remove `expo-audio`, `expo-speech`, `kokoro-js`, `ffmpeg-static`, `tsx` if unused, the `voice:generate` script), `app.json` (remove the expo-audio plugin entry), `src/constants/copy.ts` (remove unused copy), `CLAUDE.md`, `ARCHITECTURE.md`, `PROJECT_MAP.md`, `DATABASE.md`, `API_MAP.md`, `DEVELOPER_GUIDE.md`, `README.md`, `ROADMAP.md` (garden pivot is the current phase; stage 2 and release 2 listed)
- Test: `__tests__/db.test.ts`

**Interfaces:**
- Produces: `db.dropLegacy(): Promise<void>` removing AsyncStorage keys `@movekind/db/sessions`, `session_blocks`, `post_ratings`, `user_exercise_stats`; idempotent.

- [ ] **Step 1: Write failing test** `drops legacy tables, keeps profile and check-ins` (seed all six keys; `dropLegacy()`; legacy keys gone, profile + check-ins intact; second call does not throw).
- [ ] **Step 2: Run** → FAIL
- [ ] **Step 3: Implement `dropLegacy`, then delete the files above**, fix imports until `npm run typecheck` is clean, `npm install` to update the lockfile (do not open it).
- [ ] **Step 4: Run** `npm test` → PASS; `npm run typecheck` → clean; `grep -rn "sessionStore\|exercise\|voicePlayer" src` → no hits outside comments
- [ ] **Step 5: Commit** `refactor: remove guided sessions, voice and paywall`

### Checkpoint: owner tests stage 1 in Expo Go

Stop. The owner runs `npm run go`, tests every feature and the UI on their phone, and reports back. Fix feedback (new tasks as needed) before stage 2.

---

## Stage 2 (development build, before testers)

### Task 9: Real steps on both platforms

**Files:**
- Create: `src/services/steps.ts`
- Modify: `package.json` (add `expo-dev-client`, `expo-sensors`, `react-native-health-connect`, `expo-health-connect`, `expo-build-properties` via `npx expo install`), `app.json` (plugins: `expo-health-connect`, `expo-build-properties` with Android `minSdkVersion: 26`; iOS `NSMotionUsageDescription` from copy), `src/store/gardenStore.ts` (`load()` fills `stepsToday` and `stepsByDay`), `GardenScreen`/`QuickActions` (Steps shows the count; tap opens the week), `ChangesScreen` (passes `stepsByDay`)
- Test: `__tests__/steps.test.ts`, `__tests__/gardenStore.test.ts`

**Interfaces:**
- Produces:
  - `stepsAvailable(): Promise<boolean>`
  - `requestStepsAccess(): Promise<boolean>`
  - `stepsByDay(days: number, now?: Date): Promise<Record<string, number>>` keyed by `localDayKey`
  - iOS: `expo-sensors` `Pedometer.getStepCountAsync(start, end)` per local day. Android: `react-native-health-connect` `initialize()`, `requestPermission([{ accessType: 'read', recordType: 'Steps' }])`, `aggregateRecord({ recordType: 'Steps', timeRangeFilter })` per local day. **Check both libraries' current docs for SDK 57 at execution time; the call names above are the expected shape, not a guarantee.**
  - When unavailable or denied: every function resolves (false / `{}`), the garden keeps the calm default, and Steps shows a one-tap "Allow steps" action. Never throws into the UI.
- Steps are asked for on first tap of the Steps button, not at launch.

- [ ] **Step 1: Write failing tests** (mock both libraries): `iOS reads today's steps from the pedometer`, `Android reads aggregated steps from Health Connect`, `denied access resolves to empty and keeps the calm grass`, `missing Health Connect app resolves to unavailable`, `gardenStore fills stepsToday after load`.
- [ ] **Step 2: Run** → FAIL
- [ ] **Step 3: Implement**; build with `npm run build:dev:android` (and `build:dev:ios` if the owner has an iPhone to test).
- [ ] **Step 4: Run** `npm test` → PASS; typecheck clean; owner installs the dev build and confirms steps match their phone's own count within a few percent.
- [ ] **Step 5: Commit** `feat(steps): real daily steps on Android and iPhone`

### Task 10: Tester-ready check

**Files:**
- Modify: `ROADMAP.md`, `README.md` (how to join the test; PostHog key setup in `.env`: `EXPO_PUBLIC_POSTHOG_API_KEY`)

- [ ] **Step 1:** Confirm with the owner that the PostHog key is set and an `app_opened` event arrives from a dev build.
- [ ] **Step 2:** Write the success measure into `ROADMAP.md`: 15–20 testers, one week, reminder off, success = most open on ≥5 of 7 days (PostHog: distinct days with `app_opened` per person).
- [ ] **Step 3: Commit** `docs: tester week plan`
