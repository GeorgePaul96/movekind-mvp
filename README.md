# MoveKind

A calm, kind movement app that meets your nervous system where it is. Built with React Native, Expo, TypeScript, NativeWind, and Zustand. **Local-first:** no account, no backend — everything you log stays on your phone.

Instead of asking you to grind through a fixed workout, MoveKind starts with a short check-in, reads your current capacity, and composes an adaptive movement session to match — gentle regulation when you're overloaded, progressive strength when you're activated. No guilt, no streaks, just the right amount of movement for today.

## How it works

1. **Check in.** One tap on a mood tile ("Running on empty / A bit low / Steady / Buzzing") maps you to one of four capacity states: `overloaded`, `recovering`, `regulated`, or `activated`. Logging alone counts; a session is offered, never forced.
2. **Get a session.** A pure session composer builds a sequence of exercise blocks (e.g. _regulate → mobilize → strengthen → downshift_) tuned to that state and how recently you've done each exercise.
3. **Move, guided.** The session player walks you block by block with timed targets and spoken cues (`expo-speech`).
4. **Reflect & adapt.** A post-session rating feeds per-exercise stats so future sessions get more personal over time.

## Features

- No accounts: first launch → short onboarding (asks your name) → Home
- All data on the device (AsyncStorage repository in `src/services/db`); "Erase all my data" in Profile
- One-tap mood check-in → state classification
- This-week-vs-last card
- Adaptive session composer (state → exercise blocks), unit-tested as a pure function
- Guided session player with timed blocks and voice cues
- Session overview and post-session completion / rating
- Journey view of past sessions
- Premium paywall (Stripe-ready placeholder)
- Product analytics via PostHog (optional)
- Gentle local notifications
- Works fully offline (there is nothing to sync)

## Quickstart

```bash
npm install
npx expo start          # or: npm run go  (forces Expo Go)
```

Press `i` for iOS Simulator, `a` for an Android emulator, or scan the QR code with the Expo Go app.

> Requires the Expo SDK 57 toolchain (React Native 0.86, React 19.2). Node version is pinned in `.nvmrc`.

## Data & privacy

There is no backend. The exercise library ships in the app ([src/data/exercises.ts](src/data/exercises.ts)) and everything you log is stored on the device — see [DATABASE.md](DATABASE.md). Uninstalling the app deletes your data; device backups include it. The former Supabase schema is archived at [docs/archive/supabase-schema.sql](docs/archive/supabase-schema.sql) for a possible future server (e.g. small circles).

## Environment variables

| Key | Required | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_POSTHOG_API_KEY` | no | Enables PostHog product analytics. Telemetry is a no-op when unset. |
| `EXPO_PUBLIC_POSTHOG_HOST` | no | PostHog host. Defaults to `https://us.i.posthog.com`. |

## Running the project

```bash
npm start            # opens Expo dev tools
npm run ios          # iOS simulator
npm run android      # Android emulator / device
npm run web          # web preview
npm test             # Jest unit + component tests
npm run typecheck    # TypeScript type-only check
```

## Building for Android and iOS

Use [EAS Build](https://docs.expo.dev/build/introduction/) for production binaries:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios
eas build --platform android
```

For a local Android APK:

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

For local iOS (macOS required):

```bash
npx expo prebuild --platform ios
cd ios && pod install
# Open the .xcworkspace in Xcode and Archive
```

## Project structure

```
movekind-mvp/
├── App.tsx
├── app.json
├── global.css                  # NativeWind v4 entry
├── tailwind.config.js
├── src/
│   ├── components/             # UI primitives + session UI
│   │   ├── home/               # MoodPicker, LoggedPanel, WeekView
│   │   ├── SessionOverview.tsx
│   │   ├── SessionPlayer.tsx
│   │   ├── SessionComplete.tsx
│   │   └── Paywall.tsx
│   ├── data/exercises.ts       # Bundled exercise library (stable ids)
│   ├── domain/
│   │   ├── sessions/composer.ts   # Pure session composer (unit-tested)
│   │   ├── sessions/applyRating.ts # Per-exercise stats update on rating
│   │   ├── checkin/moods.ts       # Mood tiles → energy → capacity state
│   │   └── insights/weekCompare.ts # This week vs last
│   ├── screens/
│   │   ├── onboarding/         # First launch (name + preferences)
│   │   └── main/               # Home, Journey, Profile
│   ├── hooks/                  # useBehavioralProfile, useToast
│   ├── services/              # db (local repository), telemetry, notifications, premium
│   ├── store/                  # Zustand stores (profile, session, settings)
│   ├── utils/                  # date, format
│   ├── constants/              # colors, copy
│   ├── types/                  # shared TypeScript types
│   └── navigation/             # RootNavigator, TabNavigator
└── __tests__/                  # Unit + component tests
```

## Code quality

- Strict TypeScript (`tsconfig.json`)
- The session composer (`src/domain/sessions/composer.ts`) is a pure, dependency-free function with unit tests in `__tests__/composer.test.ts`
- Zustand stores avoid React-specific imports and are independently testable
- Components are split by responsibility; no monolithic screens

## Premium

Premium is a flag on the local profile (`useProfileStore`). `src/services/premium.ts` `startCheckout()` is a stub; until real billing is wired, the paywall offers a beta self-upgrade. The plan is App Store / Google Play billing (e.g. RevenueCat), which needs no server of our own. Pricing decision: see [ROADMAP.md](ROADMAP.md).

## License

MIT
