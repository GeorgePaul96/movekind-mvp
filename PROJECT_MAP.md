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
| [supabase/schema.sql](supabase/schema.sql) | **All** DDL, RLS, triggers, exercise seed → see [DATABASE.md](DATABASE.md) |

## `src/domain/` — pure business logic (no I/O)

| File | Purpose |
|---|---|
| [sessions/composer.ts](src/domain/sessions/composer.ts) | `composeSession()` — state → scored exercise blocks. **The core algorithm.** |

## `src/store/` — Zustand stores (own async/orchestration)

| File | Owns |
|---|---|
| [authStore.ts](src/store/authStore.ts) | session/user, signIn/Up/Out, restoreSession |
| [sessionStore.ts](src/store/sessionStore.ts) | check-in → compose → play → complete; free-quota gate; stats cache |
| [settingsStore.ts](src/store/settingsStore.ts) | notifications/motion/onboarding flags (AsyncStorage) |

## `src/services/` — side-effect wrappers

| File | Purpose |
|---|---|
| [supabase.ts](src/services/supabase.ts) | Supabase client (AsyncStorage-backed auth) |
| [telemetry.ts](src/services/telemetry.ts) | PostHog wrapper; no-op without API key |
| [notifications.ts](src/services/notifications.ts) | state-aware daily nudge scheduling |
| [premium.ts](src/services/premium.ts) | `isPremium` / `startCheckout` (**Stripe stub**) |
| [profile.ts](src/services/profile.ts) | get/update profile (cache fallback) |
| [cache.ts](src/services/cache.ts) | AsyncStorage read/write helpers (⚠ has dead keys) |

## `src/screens/`

| File | Purpose |
|---|---|
| [auth/OnboardingScreen.tsx](src/screens/auth/OnboardingScreen.tsx) | new-user onboarding (largest screen, 405 ln) |
| [auth/SignInScreen.tsx](src/screens/auth/SignInScreen.tsx) / [SignUpScreen.tsx](src/screens/auth/SignUpScreen.tsx) | auth |
| [main/HomeScreen.tsx](src/screens/main/HomeScreen.tsx) | check-in entry + active session host |
| [main/JourneyScreen.tsx](src/screens/main/JourneyScreen.tsx) | history + charts |
| [main/ProfileScreen.tsx](src/screens/main/ProfileScreen.tsx) | profile, premium, settings |

## `src/components/`

Session UI: [CheckInFlow](src/components/CheckInFlow.tsx) · [SessionOverview](src/components/SessionOverview.tsx) ·
[SessionPlayer](src/components/SessionPlayer.tsx) · [SessionComplete](src/components/SessionComplete.tsx) ·
[Paywall](src/components/Paywall.tsx).
Primitives: Button, Card, Chip, Header, Screen, SectionLabel, Slider, Toast, RatingRow, BarChart.

## `src/navigation/`

[RootNavigator](src/navigation/RootNavigator.tsx) (auth gating) · [AuthStack](src/navigation/AuthStack.tsx) ·
[TabNavigator](src/navigation/TabNavigator.tsx) · [TabIcon](src/navigation/TabIcon.tsx) ·
[types.ts](src/navigation/types.ts) (param lists).

## `src/` leaf modules

| File | Purpose |
|---|---|
| [types/index.ts](src/types/index.ts) | **All shared domain types** (Profile, CheckIn, Exercise, Session, SessionBlock, PostRating, UserExerciseStats, UserState) |
| [constants/colors.ts](src/constants/colors.ts) | color palette (single source of truth) |
| [constants/copy.ts](src/constants/copy.ts) | user-facing strings |
| [hooks/useBootstrapData.ts](src/hooks/useBootstrapData.ts) · [hooks/useToast.ts](src/hooks/useToast.ts) | hooks |
| [utils/date.ts](src/utils/date.ts) · [utils/format.ts](src/utils/format.ts) | helpers |

## `__tests__/`

[composer.test.ts](__tests__/composer.test.ts) (domain) · [format.test.ts](__tests__/format.test.ts) ·
[Button.test.tsx](__tests__/Button.test.tsx).
