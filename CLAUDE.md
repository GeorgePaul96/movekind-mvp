# CLAUDE.md — MoveKind MVP

> Orientation file for Claude Code. Read this first. It plus the linked docs let you
> understand ~85% of the project without scanning `src/**`.

## What this is

MoveKind is a **calm, anti-guilt self-care companion** (Expo / React Native / TypeScript). Home is
**Maple's yard**: Maple, a golden retriever, sits in the middle, and Pudding, a lazy bulldog, sleeps
on his cushion. People log everyday care by tapping the yard: **the water bowl** (glasses of water),
**the food bowl** (which meals; Pudding wakes only for this), **the ball** (movement done anywhere),
**Pudding** (last night's sleep), and a **mood check-in** that Maple reflects (tired, a bit low,
frustrated, steady, buzzing). Each thing logged blooms a flower. **Steps** are read from the phone and
shown in the drawer. **Changes** (in the pull-up drawer) says in plain sentences what their activity is
changing. MoveKind **never tells anyone how to move** (no exercise instructions). No streaks, no targets,
no guilt, and food is never judged (only whether you ate): the yard only grows or rests.

## Tech stack

Expo SDK 58 · React Native 0.88 · React 19.3 · TypeScript 6 (strict) · **local-first: all
data on the device (AsyncStorage via `src/services/db`), no backend, no accounts** · Zustand (state) ·
React Navigation 6 · react-native-svg (the yard) · NativeWind 4 · PostHog (optional, anonymous) ·
Jest + Testing Library.

## Commands

```bash
npm start          # Expo dev server   (npm run go = force Expo Go)
npm run ios|android|web
npm test           # Jest (unit + component)
npm run typecheck  # tsc --noEmit  ← run this after any TS change
```

There is **no lint script** and **no build step** to run locally for verification.
Verify changes with `npm run typecheck` and `npm test`.

## The doc layer (read on demand)

| Need | Read |
|---|---|
| How data flows, layering | [ARCHITECTURE.md](ARCHITECTURE.md) |
| "Where is X?" — file-by-file index | [PROJECT_MAP.md](PROJECT_MAP.md) |
| The local data model and storage rules | [DATABASE.md](DATABASE.md) |
| Every repository call, grouped by caller | [API_MAP.md](API_MAP.md) |
| Setup, testing, common tasks | [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) |
| Product framing, env vars, build | [README.md](README.md) |
| What's next — phases, priorities, guardrails | [ROADMAP.md](ROADMAP.md) |

> **Planning authority:** [ROADMAP.md](ROADMAP.md) is the **only** current plan. Specs and plans
> under `docs/superpowers/**` are archives of their own work (the garden pivot spec is
> `docs/superpowers/specs/2026-10-23-garden-pivot-design.md`); older ones describe the removed
> guided-session app. When anything conflicts with ROADMAP.md, ROADMAP.md wins.

## Core concepts (memorize these)

- **Home is the simple screen (since 2026-11-10); the yard is kept aside.**
  [HomeScreen](src/screens/main/HomeScreen.tsx) has four plain tabs: Today
  ([TodayView](src/screens/main/TodayView.tsx): greeting, the five "cared for today" dots, then mood,
  water, food, movement, sleep, steps, One good thing and A slow breath, all logged inline with
  `Chip` / `Button`), Changes, Insights and You (`MeView`). Pieces live in
  `src/components/home/parts.tsx`, copy in `HOME_COPY` (`src/constants/homeCopy.ts`), pure helpers in
  `src/domain/home/care.ts`. The warm honey colour is `colors.warm` / `colors.warmInk`. **Maple's yard
  is still in the code and still works**, but it is home only when `settingsStore.yardHome` is on (the
  "Maple's yard" switch in You, off by default) because its art is unfinished. Everything below about
  the yard describes that optional home. Both homes use the same stores, so data is shared.
- **The paged check-in (2026-11-11).** [CheckInFlow](src/components/flow/CheckInFlow.tsx) is five
  full-screen pages, one question each, in this order: mood, water, food (plus optional calories),
  movement, sleep. Each page has its own colour world from `flowThemes` in `colors.ts`
  (contrast-tested) and draws its own controls in those colours. `HomeScreen` opens it by itself once
  a day when nothing is noted yet (`settingsStore.flowSeenDay`), and one page at a time (`single`) from
  the homepage's Add / Edit buttons. Every page can be passed without noting anything; sleep is saved
  only if it was touched. **Today is now a view-and-edit summary**, not inline logging: the greeting,
  the dots, "Your day so far" (one line per kind with Add / Edit), then steps, One good thing and A
  slow breath. The Changes tab starts with **Looking back** ([MonthView](src/components/home/MonthView.tsx)):
  five weeks of days, warmer the more was noted, tap a day to read it.
- **The day has a shape (2026-11-11).** Pure logic in [companion.ts](src/domain/home/companion.ts),
  copy in `COMPANION_COPY` (`src/constants/companionCopy.ts`):
  - **Today's pace.** `dayPace({ sleepHours, mood, pause })` reads last night and the mood into
    rest / gentle / steady / bright. It is `null` until something is noted (never an assumed night or
    mood); a very short night or a tired mood always gives rest; mixed signals give gentle. The
    greeting line and the greeting card's colour (`paceColors`) follow it. **A pace only describes the
    day: no targets, and no line may tell anyone how to move or what to eat** (a test checks the copy).
  - **Pauses.** Unwell / overwhelmed / travelling / resting, chosen on the mood page without needing
    a mood. Stored per day in `db.dayStates` (`setPause`); a paused day shows only water and sleep on
    the homepage until "Show everything". Never sent to telemetry.
  - **Same as yesterday.** `yesterdayRepeat` offers yesterday's meals, movement entries and calories
    as one tap on their pages, only while today's are still empty (it never overwrites).
  - **Close the day.** `setClosed(true)` turns the homepage into a night card listing only what
    happened (`dayFacts`), with no calories and nothing about what was not done; "Reopen today" undoes it.
  Rejected on purpose from the brief this came from: a momentum score that falls on missed days,
  calorie targets or "under-fuelled" statuses, and movement suggestions.
- **Calories are optional and never judged.** `db.calories` holds one number per day, typed on the
  food page only if the person wants to (`setCaloriesToday`; empty clears it). The app never comments
  on it, sets no target, and sends no value to telemetry. With 3 or more days noted, the opt-in Body
  report shows the plain average beside energy use. Meals themselves stay "which ones", nothing more.
- **The name is asked once**, in onboarding. You (`MeView`) no longer has a name field. The "Body and
  numbers" switch, its one-time notice (shown inline, with an "I understand" button) and the units
  choice live at the top of Insights, directly above the things to fill in.
- **One good thing and A slow breath.** `db.goodThings` holds one short note per local day
  (`saveGoodThing`; empty text removes it; the words are never sent to telemetry). The breathing pacer
  is in for five, out for five (NHS), for 1, 3 or 5 minutes, and stores nothing.

- **The yard is home.** [YardScreen](src/screens/main/YardScreen.tsx) runs it: one sheet at a time,
  the speech bubble, and today's blooms (one flower per kind logged today, plus one per save this visit).
  [yardLayout](src/domain/yard/layout.ts) places every object (pure; the drawing and the tap targets
  share it). The objects sit in a band at 29 to 51% of the screen height so the dogs stay visible above
  an open sheet. [yardScript(target)](src/domain/yard/script.ts) is the pure choreography for a tap
  (walk, drink, eat, play, wake Pudding) and what happens after a save or a cancel. Drawing:
  [YardScene](src/components/yard/YardScene.tsx), [Maple](src/components/yard/Maple.tsx),
  [Pudding](src/components/yard/Pudding.tsx) (belly up or belly down; wakes only for the food bowl),
  [SpeechBubble](src/components/yard/SpeechBubble.tsx), art in `src/components/yard/art/`, sheets in
  `src/components/yard/sheets/` (Mood, Food, Sleep) plus the shared Water / Steps sheets in
  `src/components/park/sheets/` and `WorkoutSheet` in `src/components/garden/`. Copy is `YARD_COPY`;
  colours are `yardColors`. Tapping Maple pets her and she says her mood line. No tab bar:
  [YardDrawer](src/components/yard/YardDrawer.tsx) holds today's log rows, steps, the note, `ChangesView`
  and `MeView`. The mood sheet opens by itself when today has no mood; "Not now" saves nothing.
  `src/components/park/` now only holds shared pieces (Sheet, Hotspot, Motion, Water/Steps sheets).
- **The garden state is pure and derived.** [gardenState(input, now)](src/domain/garden/garden.ts) turns
  logged water / workouts / check-ins / steps into stage numbers. **No I/O, no React, no clock** (`now`
  is a parameter). The yard uses it for `resting` (after 3 quiet days: moon, both dogs asleep, nothing
  lost) and `weather`; Changes and the a11y summary use the rest.
- **Weather and light.** `gardenState().weather` is `'rain'` when today's check-in has `unwell: true`
  (the "Feeling unwell today" choice, shown once a mood is picked): soft rain and Maple shelters at
  her rain spot; nothing logged changes, and `unwell` is never sent to telemetry. The light follows the
  phone clock via [skyPhase(now)](src/domain/garden/sky.ts) (dawn 5-8, day 8-17, dusk 17-20, night).
  Resting always shows night.
- **Changes are gentle.** [weeklyChanges](src/domain/garden/changes.ts) compares this week so far
  with the *same stretch* of last week. Ups are celebrated; quieter weeks are named kindly and
  never state a shortfall (no numbers, no "less/fewer/missed").
- **Days are local.** Use `localDayKey` / `startOfLocalDay` / `weekBounds` from
  [days.ts](src/domain/garden/days.ts). Never UTC day maths.
- **Moods.** Five yard moods (`YardMood`: tired, low, frustrated, steady, buzzing; `YARD_MOODS`,
  labels in `YARD_COPY.moods`). `logYardMood` stores the mood on the day's check-in *and* an
  `energy_score` via `yardMoodToEnergy` (1/2/3/4/5) so the garden state and Changes keep working;
  `yardMoodOf(checkIn)` reads it back (old rows without `mood` map from energy). A day is one check-in:
  re-picking edits it. Maple's pose and line follow the mood ([domain/yard/moods.ts](src/domain/yard/moods.ts)).
  The older four-tile `logMood` / `MOOD_COPY` path still exists and clears `mood`.
- **Meals and sleep.** `db.meals` (one row per meal, today's set edited with `setMealsToday`, telemetry
  only when a meal is added) and `db.sleep` (one row per night, `night_of` = the morning's local day key,
  half-hour `hours` via `tidySleepHours`, optional `feel`: restless / okay / deep; upserted by `logSleep`).
  Food is only "did you eat, which meals": never what, how much, or whether it was "good".
- **Body and Insights are opt-in and separate.** The drawer's Insights section
  ([InsightsView](src/screens/main/InsightsView.tsx)) shows Patterns and Export to everyone. Everything
  that states a body number (the [BodyView](src/screens/main/BodyView.tsx) report, the "at this pace"
  projection and silhouette, Sleep balance, Steps and health, Fitness estimate) sits behind
  `settingsStore.bodyEnabled` (the "Body and numbers" switch in Me, **off by default**, adults only).
  **The yard, Maple, Pudding, Changes and the reminder never mention these numbers.** The maths is pure
  and lives in `src/domain/body/` and `src/domain/insights/`; [bodySummary](src/domain/body/summary.ts)
  is the one place the screen and the exported report read from. Every formula is cited in
  [sources.ts](src/constants/sources.ts) and shown as "Source: ..." under its number: **never add or
  change a coefficient without checking it against the paper and adding a worked-value test.** The
  projection works from the person's own weigh-in trend (the app never asks what they eat), needs 4
  weigh-ins over 14 days, is shown as a range, and is replaced by a calm "talk to a doctor" note when
  the pace is too fast or heads under BMI 18.5. Data: `db.body`, `db.measurements`, `db.pulse` via
  [bodyStore](src/store/bodyStore.ts), stored metric.
- **One store.** [gardenStore](src/store/gardenStore.ts) owns loading and every log action; screens
  stay thin. Each log sends telemetry `logged {kind}` only, never values.
- **Local-first, no accounts.** [src/services/db/](src/services/db/index.ts) is the **only** data
  access path. First launch → onboarding (optional name, then "Meet Maple and Pudding") → the yard.
- **Reminder is opt-in.** One 9am reminder, **off by default**, permission asked only when switched
  on in Me. Nothing is requested at launch.
- **Steps.** [services/steps.ts](src/services/steps.ts) reads daily steps from the phone: the iOS
  pedometer (works in Expo Go too) or Health Connect on Android (**development/store build only**;
  Expo Go on Android reports `needs-full-app`). Never asked at launch: `refreshSteps()` reads only if
  access was already given; `allowSteps()` asks, from a tap on Steps. Steps are not stored; with no
  access `stepsToday` stays `null` and the drawer shows a calm placeholder.

## Conventions

- **Imports:** use the `@/` alias for `src/` (configured in `tsconfig.json` + `babel.config.js`).
- **State:** Zustand stores in `src/store/`. Stores own async + `db` calls; components stay thin.
- **Styling:** **all color comes from tokens in [src/constants/colors.ts](src/constants/colors.ts)** — never
  hardcode hex. Semantic UI tokens (`background`, `surface`, `primary`, `textPrimary`…, `scrim`),
  `stateColors[mood]` for mood colour, and `gardenColors` for the (decorative) garden illustration.
  Palette is "Sage" (misty green, from the Stitch designs in `design/`, kept out of git): deep forest
  green `primary` for actions, `sage` for decoration only (white text on it fails). **Contrast is enforced by
  [__tests__/colors.test.ts](__tests__/colors.test.ts)** (text ≥4.5:1, UI ≥3:1) — add a pair there when
  you add a text/UI token.
- **Type:** Plus Jakarta Sans, loaded in `App.tsx`. Pick weights with `...font.bold` etc. from
  [typography.ts](src/constants/typography.ts), never `fontWeight` (Android ignores it for custom fonts).
- **Controls:** `<Button>` (pill: `primary` / `secondary` / `link`), `<Chip>` for choice sets, `<MoodTile>` for
  moods, `<Hotspot>` for yard objects, RN `Switch` for on/off settings, `<Icon>` (decorative
  MaterialCommunityIcons) instead of emoji. No hand-rolled
  `Pressable` buttons in screens. Minimum font size 13; 44pt touch targets; every control labelled.
- **Copy:** user-facing strings live in [src/constants/copy.ts](src/constants/copy.ts). **No em dashes**
  in user-facing text (enforced by `__tests__/noEmDash.test.ts`).
- **Motion:** gentle only, and none when the phone asks for reduced motion (`useReduceMotion`).
- **Side effects** (storage, telemetry, notifications) live in `src/services/`, never in `domain/`.

## Gotchas / known debt (do not "fix" silently)

- Telemetry is a **no-op** unless `EXPO_PUBLIC_POSTHOG_API_KEY` is set.
- Android steps need a **development build** (`npm run build:dev:android`); Expo Go can't read daily
  steps on Android. Use `npm run go` to keep testing everything else in Expo Go.
- Testers' phones may hold the old session app's tables; `db.dropLegacy()` clears them at launch.
- `settingsStore.parkTourSeen` is left over from the park tour and no longer read by the yard. Harmless; remove it with a settings migration when convenient.

## Doing work efficiently

- To change **what happens when an object is tapped** → `src/domain/yard/script.ts` (+ `__tests__/yardScript.test.ts`),
  then `YardScreen.tsx`. To move objects → `src/domain/yard/layout.ts` (+ `__tests__/yardLayout.test.ts`).
- To change **the dogs** → `src/components/yard/Maple.tsx` / `Pudding.tsx`; mood poses and lines in `src/domain/yard/moods.ts` + `YARD_COPY`.
- To change **the Changes sentences** → `changes.ts` + `CHANGES_COPY` (+ `__tests__/changes.test.ts`).
- To change **the data model** → `src/services/db/` + `src/types/index.ts` + [DATABASE.md](DATABASE.md). Keep all three in sync.
- To change **a screen** → `src/screens/**`; shared UI in `src/components/**`.
- **Never** open `package-lock.json` or `node_modules/**` (excluded via `.claudeignore`).
