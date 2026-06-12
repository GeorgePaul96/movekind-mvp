# MoveKind

A calm, kind movement app that meets your nervous system where it is. Built with React Native, Expo, TypeScript, Supabase, NativeWind, and Zustand.

Instead of asking you to grind through a fixed workout, MoveKind starts with a short check-in, reads your current capacity, and composes an adaptive movement session to match — gentle regulation when you're overloaded, progressive strength when you're activated. No guilt, no streaks, just the right amount of movement for today.

## How it works

1. **Check in.** A quick energy/sleep check-in maps you to one of four capacity states: `overloaded`, `recovering`, `regulated`, or `activated`.
2. **Get a session.** A pure session composer builds a sequence of exercise blocks (e.g. _regulate → mobilize → strengthen → downshift_) tuned to that state and how recently you've done each exercise.
3. **Move, guided.** The session player walks you block by block with timed targets and spoken cues (`expo-speech`).
4. **Reflect & adapt.** A post-session rating feeds per-exercise stats so future sessions get more personal over time.

## Features

- Email / password authentication with persisted sessions (Supabase)
- Onboarding flow for new users
- Capacity check-in → state classification
- Adaptive session composer (state → exercise blocks), unit-tested as a pure function
- Guided session player with timed blocks and voice cues
- Session overview and post-session completion / rating
- Journey view of past sessions
- Premium paywall (Stripe-ready placeholder)
- Product analytics via PostHog (optional)
- Gentle local notifications
- Offline-first cache via AsyncStorage

## Quickstart

```bash
npm install
cp .env.example .env
# Fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
npx expo start
```

Press `i` for iOS Simulator, `a` for an Android emulator, or scan the QR code with the Expo Go app.

> Requires the Expo SDK 54 toolchain (React Native 0.81, React 19). Node version is pinned in `.nvmrc`.

## Supabase setup

1. Create a project at https://supabase.com.
2. In the SQL editor, paste and run `supabase/schema.sql`. This creates all tables (profiles, check-ins, exercises, sessions, session blocks, post-ratings, user exercise stats), indexes, row-level security policies, and the exercise seed library.
3. Copy your project URL and anon key into `.env`.

When a new user signs up, a `profile` row is created automatically by the `handle_new_user` trigger.

## Environment variables

| Key | Required | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase anon public key |
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
├── supabase/
│   └── schema.sql              # Tables, RLS, policies, exercise seed
├── src/
│   ├── components/             # UI primitives + session UI
│   │   ├── CheckInFlow.tsx
│   │   ├── SessionOverview.tsx
│   │   ├── SessionPlayer.tsx
│   │   ├── SessionComplete.tsx
│   │   └── Paywall.tsx
│   ├── domain/
│   │   └── sessions/composer.ts   # Pure session composer (unit-tested)
│   ├── screens/
│   │   ├── auth/               # Onboarding, Sign in, Sign up
│   │   └── main/               # Home, Journey, Profile
│   ├── hooks/                  # useBootstrapData, useToast
│   ├── services/              # supabase, telemetry, notifications, premium, profile, cache
│   ├── store/                  # Zustand stores (auth, session, settings)
│   ├── utils/                  # date, format
│   ├── constants/              # colors, copy
│   ├── types/                  # shared TypeScript types
│   └── navigation/             # RootNavigator, AuthStack, TabNavigator
└── __tests__/                  # Unit + component tests
```

## Code quality

- Strict TypeScript (`tsconfig.json`)
- The session composer (`src/domain/sessions/composer.ts`) is a pure, dependency-free function with unit tests in `__tests__/composer.test.ts`
- Zustand stores avoid React-specific imports and are independently testable
- Components are split by responsibility; no monolithic screens

## Premium (Stripe)

`src/services/premium.ts` defines the contract used by the paywall and `ProfileScreen`. It returns a stub today. To wire Stripe:

1. Add `@stripe/stripe-react-native` to dependencies.
2. Replace the body of `startCheckout()` with a call to a Supabase Edge Function that creates a Stripe Checkout session.
3. Update `isPremium()` to read from `profiles.is_premium` (already present in the schema).

## License

MIT
