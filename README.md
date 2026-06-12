# MoveKind

A calm, kind movement-tracking mobile app. Built with React Native, Expo, TypeScript, Supabase, NativeWind, Zustand, React Navigation, and Victory Native charts.

MoveKind treats movement the way a wise coach would: no guilt, no streak-shaming, just gentle progress and reflection.

## Features

- Email / password authentication with persisted sessions (Supabase)
- Activity logging with type, duration, effort, and mood
- Weekly reflection questionnaire
- Computed analytics: Consistency, Strength, Endurance, Recovery, Overall scores
- Visual progress dashboard (4-week minutes, energy trend, recovery trend)
- AI coach insights (OpenAI when configured, kind fallback when not)
- Offline-first data cache via AsyncStorage
- Gentle local notifications
- Stripe-ready premium placeholders

## Quickstart

```bash
npm install
cp .env.example .env
# Fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (OpenAI is optional)
npx expo start
```

Press `i` for iOS Simulator, `a` for an Android emulator, or scan the QR code with the Expo Go app.

## Supabase setup

1. Create a project at https://supabase.com.
2. In the SQL editor, paste and run `supabase/schema.sql`. This creates all tables, indexes, row-level security policies, and seed data.
3. Copy your project URL and anon key into `.env`.

The schema includes a demo seed block. When a new user signs up, a `profile` row is created automatically by the `handle_new_user` trigger. To seed an existing user with sample activities, run the helper at the bottom of `schema.sql` after replacing the `:user_id` placeholder.

## Environment variables

| Key | Required | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase anon public key |
| `EXPO_PUBLIC_OPENAI_API_KEY` | no | Enables real GPT-based coaching. Mock used otherwise. |

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
├── package.json
├── tsconfig.json
├── babel.config.js
├── tailwind.config.js
├── .env.example
├── supabase/
│   └── schema.sql           # Tables, RLS, policies, seed
├── src/
│   ├── components/          # Reusable UI primitives + cards
│   ├── screens/
│   │   ├── auth/            # Sign in & sign up
│   │   └── main/            # Home, Log, Progress, Reflect, Profile
│   ├── hooks/               # useActivities, useReflections, useScores
│   ├── services/            # supabase, activities, reflections, ai, notifications
│   ├── store/               # Zustand stores
│   ├── utils/               # analytics, date, format
│   ├── constants/           # colors, copy, activity types
│   ├── types/               # shared TypeScript types
│   └── navigation/          # RootNavigator, AuthStack, TabNavigator
└── __tests__/               # Unit + component tests
```

## Code quality

- Strict TypeScript (`tsconfig.json`)
- Zustand stores are unit-testable and avoid React-specific imports
- Analytics scoring (`src/utils/analytics.ts`) is pure and fully unit-tested
- Components are split by responsibility; no monolithic screens

## Premium (Stripe)

`src/services/premium.ts` defines the contract used by `ProfileScreen`. It returns a stub today. To wire Stripe:

1. Add `@stripe/stripe-react-native` to dependencies.
2. Replace the body of `startCheckout()` with a call to your Supabase Edge Function that creates a Stripe Checkout session.
3. Update `isPremium()` to read from `profiles.is_premium` (already present in the schema).

## License

MIT
