# PROJECT_MAP.md — file index

"Where is X?" Jump straight to the file instead of scanning. Sizes are approximate.

## Root

| File | Purpose |
|---|---|
| [App.tsx](App.tsx) | Bootstrap + provider tree + loading gate |
| [app.json](app.json) | Expo app config |
| [babel.config.js](babel.config.js) | Babel + `@/` module-resolver + reanimated/nativewind plugins |
| [metro.config.js](metro.config.js) | Metro + NativeWind |
| [tailwind.config.js](tailwind.config.js) / [global.css](global.css) | NativeWind v4 setup |
| [tsconfig.json](tsconfig.json) | Strict TS + `@/*` path alias |
| [jest.setup.ts](jest.setup.ts) | Test setup |
| [docs/archive/supabase-schema.sql](docs/archive/supabase-schema.sql) | **Archived** former server schema (reference only) — the live data model is [DATABASE.md](DATABASE.md) |

## `src/domain/` — pure business logic (no I/O)

| File | Purpose |
|---|---|
| [sessions/composer.ts](src/domain/sessions/composer.ts) | `composeSession()` — state → scored exercise blocks. **The core algorithm.** |

## `src/store/` — Zustand stores (own async/orchestration)

| File | Owns |
|---|---|
| [profileStore.ts](src/store/profileStore.ts) | local profile (name, premium, install id); `eraseAll` |
| [sessionStore.ts](src/store/sessionStore.ts) | `logCheckIn` / `updateCheckIn` → `startTodaysSession` (free-quota gate) → play → complete; `homeStep`; `loadWeek`; stats cache |
| [settingsStore.ts](src/store/settingsStore.ts) | notifications/motion/onboarding flags (AsyncStorage) |

## `src/services/` — side-effect wrappers

| File | Purpose |
|---|---|
| [db/](src/services/db/index.ts) | **the only data layer** — local repository over AsyncStorage (`table.ts` = serialized JSON tables) |
| [telemetry.ts](src/services/telemetry.ts) | PostHog wrapper; no-op without API key |
| [notifications.ts](src/services/notifications.ts) | state-aware daily nudge scheduling |
| [premium.ts](src/services/premium.ts) | `startCheckout` (**stub** — store billing later; premium flag lives on the local profile) |
| [behavioralProfile.ts](src/services/behavioralProfile.ts) | 90-day behavioral profile from local history |
| [network.ts](src/services/network.ts) | `friendlyErrorMessage` (calm error copy) |

## `src/screens/`

| File | Purpose |
|---|---|
| [onboarding/OnboardingScreen.tsx](src/screens/onboarding/OnboardingScreen.tsx) | first launch: name (optional) + 4 preference steps. **No sign-in screens exist.** |
| [main/HomeScreen.tsx](src/screens/main/HomeScreen.tsx) | 4-state home: active session → mood tiles → Logged panel → week view |
| [main/JourneyScreen.tsx](src/screens/main/JourneyScreen.tsx) | history + charts |
| [main/ProfileScreen.tsx](src/screens/main/ProfileScreen.tsx) | name, premium, "your data stays on this phone", Erase all my data |

## `src/components/`

Home: [home/MoodPicker](src/components/home/MoodPicker.tsx) (one-tap check-in) ·
[home/LoggedPanel](src/components/home/LoggedPanel.tsx) (Start / Not now, optional sleep + note) ·
[home/WeekView](src/components/home/WeekView.tsx) (this week vs last).
Session UI: [SessionOverview](src/components/SessionOverview.tsx) ·
[SessionPlayer](src/components/SessionPlayer.tsx) · [SessionComplete](src/components/SessionComplete.tsx) ·
[Paywall](src/components/Paywall.tsx).
Primitives: [Button](src/components/Button.tsx) (primary/secondary/link) · [MoodTile](src/components/MoodTile.tsx) ·
[Chip](src/components/Chip.tsx) · [WeekCard](src/components/WeekCard.tsx) · Card, Header, Screen, Slider, BarChart.

## `src/navigation/`

[RootNavigator](src/navigation/RootNavigator.tsx) (auth gating) · [AuthStack](src/navigation/AuthStack.tsx) ·
[TabNavigator](src/navigation/TabNavigator.tsx) · [TabIcon](src/navigation/TabIcon.tsx) ·
[types.ts](src/navigation/types.ts) (param lists).

## `src/` leaf modules

| File | Purpose |
|---|---|
| [types/index.ts](src/types/index.ts) | **All shared domain types** (Profile, CheckIn, Exercise, Session, SessionBlock, PostRating, UserExerciseStats, UserState) |
| [constants/colors.ts](src/constants/colors.ts) | "Sunrise" palette + `stateColors` (soft/ink/accent/tint); contrast-tested |
| [data/exercises.ts](src/data/exercises.ts) | the bundled exercise library (30, stable ids `ex-<category>-<n>`) |
| [domain/sessions/applyRating.ts](src/domain/sessions/applyRating.ts) | per-exercise stats update on rating (pure port of the old trigger) |
| [domain/checkin/moods.ts](src/domain/checkin/moods.ts) | `MOODS`, `moodToEnergy`, `mapEnergyToState` (pure) |
| [domain/insights/weekCompare.ts](src/domain/insights/weekCompare.ts) | `compareWeeks`, `weekBounds`, `isSameLocalDay` (pure) |
| [constants/copy.ts](src/constants/copy.ts) | user-facing strings |
| [hooks/useBootstrapData.ts](src/hooks/useBootstrapData.ts) · [hooks/useToast.ts](src/hooks/useToast.ts) | hooks |
| [utils/date.ts](src/utils/date.ts) · [utils/format.ts](src/utils/format.ts) | helpers |

## `__tests__/`

[composer.test.ts](__tests__/composer.test.ts) (domain) · [format.test.ts](__tests__/format.test.ts) ·
[Button.test.tsx](__tests__/Button.test.tsx).
