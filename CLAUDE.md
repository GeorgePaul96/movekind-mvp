# CLAUDE.md — MoveKind MVP

> Orientation file for Claude Code. Read this first. It plus the linked docs let you
> understand ~85% of the project without scanning `src/**`.

## What this is

MoveKind is a **calm, anti-guilt self-care tracker with a garden that grows** (Expo / React
Native / TypeScript). People log the everyday care they already spread across several apps
(**water, workouts done anywhere, a one-tap mood check-in**, and soon **steps**) and see it
turn into a living garden: water fills the stream, steps grow the grass, workouts grow the
tree, each mood plants a flower. A **Changes** tab says in plain sentences what their
activity is changing. MoveKind **never tells anyone how to move** (no exercise instructions).
No streaks, no targets, no guilt: the garden only grows or rests.

## Tech stack

Expo SDK 57 · React Native 0.86 · React 19.2 · TypeScript 6 (strict) · **local-first: all
data on the device (AsyncStorage via `src/services/db`), no backend, no accounts** · Zustand (state) ·
React Navigation 6 · react-native-svg (the garden) · NativeWind 4 · PostHog (optional, anonymous) ·
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

- **The garden is pure and derived.** [gardenState(input, now)](src/domain/garden/garden.ts) turns
  logged water / workouts / check-ins / steps into what the garden shows. **No I/O, no React,
  no clock** (`now` is a parameter, so `gardenState(input, aMonthAgo)` is the past garden).
  Stream and grass reset each local morning and have a floor (a trickle, short grass); the tree
  grows from all-time workout minutes (`TREE_STAGE_MINUTES`) and **never shrinks**; one flower per
  day with a check-in (latest mood wins); `resting` after 3 quiet days (moon, nothing lost).
- **Changes are gentle.** [weeklyChanges](src/domain/garden/changes.ts) compares this week so far
  with the *same stretch* of last week. Ups are celebrated; quieter weeks are named kindly and
  never state a shortfall (no numbers, no "less/fewer/missed").
- **Days are local.** Use `localDayKey` / `startOfLocalDay` / `weekBounds` from
  [days.ts](src/domain/garden/days.ts). Never UTC day maths.
- **Moods.** Four tiles ("Running on empty / A bit low / Steady / Buzzing", `MOOD_COPY`) →
  `moodToEnergy` (1/2/4/5) → `mapEnergyToState` in [moods.ts](src/domain/checkin/moods.ts). A day is
  one check-in: re-picking edits it. Mood colour = `stateColors[mood].tint` (the flower).
- **One store.** [gardenStore](src/store/gardenStore.ts) owns loading and every log action; screens
  stay thin. Each log sends telemetry `logged {kind}` only — never values.
- **Local-first, no accounts.** [src/services/db/](src/services/db/index.ts) is the **only** data
  access path. First launch → onboarding (optional name, then "how your garden grows") → Garden.
- **Reminder is opt-in.** One 9am reminder, **off by default**, permission asked only when switched
  on in Me. Nothing is requested at launch.
- **Steps.** [services/steps.ts](src/services/steps.ts) reads daily steps from the phone: the iOS
  pedometer (works in Expo Go too) or Health Connect on Android (**development/store build only**;
  Expo Go on Android reports `needs-full-app`). Never asked at launch: `refreshSteps()` reads only if
  access was already given; `allowSteps()` asks, from a tap on Steps. Steps are not stored; with no
  access `stepsToday` stays `null` and the grass keeps a calm default.

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
  moods, `<ActionTile>` for the big log cards, RN `Switch` for on/off settings, `<Icon>` (decorative
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

## Doing work efficiently

- To change **what the garden shows** → `src/domain/garden/garden.ts` (+ `__tests__/garden.test.ts`),
  then the drawing in `src/components/garden/Garden.tsx`.
- To change **the Changes sentences** → `changes.ts` + `CHANGES_COPY` (+ `__tests__/changes.test.ts`).
- To change **the data model** → `src/services/db/` + `src/types/index.ts` + [DATABASE.md](DATABASE.md). Keep all three in sync.
- To change **a screen** → `src/screens/**`; shared UI in `src/components/**`.
- **Never** open `package-lock.json` or `node_modules/**` (excluded via `.claudeignore`).
