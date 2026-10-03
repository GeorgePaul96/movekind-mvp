# CLAUDE.md — MoveKind MVP

> Orientation file for Claude Code. Read this first. It plus the linked docs let you
> understand ~85% of the project without scanning `src/**`.

## What this is

MoveKind is a **calm, anti-guilt movement app** (Expo / React Native / TypeScript).
A user does a short **check-in** → the app maps their energy to one of four **capacity
states** → a **pure composer** builds an adaptive exercise session → a **guided player**
walks them through it with voice cues → a **post-rating** feeds per-exercise stats so
future sessions personalize. No streaks, no guilt.

## Tech stack

Expo SDK 54 · React Native 0.81 · React 19 · TypeScript (strict) · Supabase
(Postgres + Auth + RLS) · Zustand (state) · React Navigation 6 · NativeWind 4 (Tailwind) ·
Victory Native (charts) · PostHog (optional analytics) · Jest + Testing Library.

## Commands

```bash
npm start          # Expo dev server
npm run ios|android|web
npm test           # Jest (unit + component)
npm run typecheck  # tsc --noEmit  ← run this after any TS change
```

There is **no lint script** and **no build step** to run locally for verification.
Verify changes with `npm run typecheck` and `npm test`.

## The doc layer (read on demand)

| Need | Read |
|---|---|
| How data flows, the state machine, layering | [ARCHITECTURE.md](ARCHITECTURE.md) |
| "Where is X?" — file-by-file index | [PROJECT_MAP.md](PROJECT_MAP.md) |
| Tables, columns, RLS, triggers, the stats engine | [DATABASE.md](DATABASE.md) |
| Every Supabase query, grouped by caller | [API_MAP.md](API_MAP.md) |
| Setup, testing, "how do I add an exercise / wire Stripe" | [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) |
| Product framing, env vars, build | [README.md](README.md) |
| What's next — phases, priorities, guardrails | [ROADMAP.md](ROADMAP.md) |

> **Planning authority:** [ROADMAP.md](ROADMAP.md) is the **only** current plan. The specs and
> plans under `docs/superpowers/**` and `.superpowers/**` are **historical archives** of already
> -shipped work (Phases 1–3A) — never treat them as pending work or current requirements. When a
> document there conflicts with ROADMAP.md, ROADMAP.md wins. Update ROADMAP.md as phases complete.

## Core concepts (memorize these)

- **Four capacity states:** `overloaded · recovering · regulated · activated`. Derived
  from `energy_score` (1–5) by `mapEnergyToState` in [moods.ts](src/domain/checkin/moods.ts)
  (re-exported by the store). Users never see these names — they tap one of four mood tiles
  ("Running on empty / A bit low / Steady / Buzzing", `MOOD_COPY`) → `moodToEnergy` (1/2/4/5).
- **One-tap check-in.** `logCheckIn(mood)` only saves the check-in and **never** shows the
  paywall; `startTodaysSession()` composes the session and is the only paywall path.
- **Composer is pure & sacred.** [src/domain/sessions/composer.ts](src/domain/sessions/composer.ts)
  takes state + exercise library + recency + stats and returns blocks. **No I/O, no React,
  no Supabase.** It is the only unit-tested business logic. Keep it pure; test changes via
  [__tests__/composer.test.ts](__tests__/composer.test.ts).
- **`ENGINE_VERSION`** (currently `v3.0`) is stamped on every check-in and session. Bump it
  when composition logic changes.
- **Exercise categories:** `regulate · mobilize · strengthen · move · downshift`. Each state
  maps to a fixed category sequence with target durations (see the composer).
- **Stats are computed server-side.** A Postgres trigger updates `user_exercise_stats` when a
  `post_ratings` row is inserted — the client never writes stats directly. See [DATABASE.md](DATABASE.md).

## Conventions

- **Imports:** use the `@/` alias for `src/` (configured in `tsconfig.json` + `babel.config.js`).
- **State:** Zustand stores in `src/store/`. Stores own async + Supabase calls; components stay thin.
- **Styling:** NativeWind classes; **all color comes from semantic tokens in
  [src/constants/colors.ts](src/constants/colors.ts)** — never hardcode hex. Use the semantic
  names (`background`, `surface`, `surfaceSecondary`, `primary`/`primaryPressed`/`onPrimary`,
  `textPrimary`/`textSecondary`/`textMuted`, `border`, `divider`, `success`/`warning`/`error`/`info`,
  `shadow`) plus `elevation.card`/`elevation.raised`. For mood color use
  `stateColors[state]`: `.soft` tile/surface fill, `.ink` text + border on `.soft`, `.accent`
  for fills bearing white text, `.tint` for bars/slider. Palette is "Sunrise" (warm cream).
  **Contrast is enforced by [__tests__/colors.test.ts](__tests__/colors.test.ts)** (text ≥4.5:1,
  UI/graphs ≥3:1) — add a pair there when you add a token.
- **Buttons:** only `<Button>` with `variant="primary"` (solid), `"secondary"` (2px outline) or
  `"link"` (underlined, 44pt target). Choice sets use `<Chip>`; mood picks use `<MoodTile>`.
  No hand-rolled `Pressable` buttons. Minimum font size 13.
- **Copy:** user-facing strings live in [src/constants/copy.ts](src/constants/copy.ts).
- **Side effects** (Supabase, telemetry, notifications) live in `src/services/`, never in `domain/`.

## Gotchas / known debt (do not "fix" silently)

- `premium.ts` / `startCheckout` is a **stub** — Stripe is not wired.
- Telemetry is a **no-op** unless `EXPO_PUBLIC_POSTHOG_API_KEY` is set.

## Doing work efficiently

- To change **session logic** → `composer.ts` (+ its test) and/or `sessionStore.ts`. Nothing else.
- To change **the DB** → `supabase/schema.sql` + `src/types/index.ts` + [DATABASE.md](DATABASE.md). Keep all three in sync.
- To change **a screen** → `src/screens/**`; shared UI in `src/components/**`.
- **Never** open `package-lock.json` or `node_modules/**` (excluded via `.claudeignore`).
