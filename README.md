# MoveKind

A calm self-care tracker with a garden that grows because of you. Built with React Native, Expo, TypeScript and Zustand. **Local-first:** no account, no backend; everything you log stays on your phone.

MoveKind doesn't tell you how to move. It collects the everyday care you already spread across several apps (water, the workouts you did anywhere, how you feel) and turns it into a living garden, then tells you in plain words what your activity is changing. No streaks, no targets, no guilt: the garden only grows or rests.

## How it works

1. **Log in one or two taps.** A glass of water, a workout (what and roughly how long), and a once-a-day mood check-in. Steps arrive automatically in the next build.
2. **Watch the garden respond.** Water fills the stream, steps grow the grass, workouts grow the tree (birds, blossom, fruit, a second tree), and every mood plants a flower. Away for a few days? The garden rests under the moon and wakes when you're back. Nothing wilts.
3. **See what's changing.** The Changes tab compares this week with the same stretch of last week in plain sentences, shows your garden a month ago next to today, and lays out your mood flowers week by week.

## Features

- No accounts: first launch → optional name → "how your garden grows" → Garden
- Garden home: stream, grass, tree and flowers drawn in code (react-native-svg), gentle motion that respects Reduce Motion
- One-tap water (with undo), two-tap workout log (edit / delete), one-tap mood check-in
- Changes tab: kind weekly sentences, then-and-now garden, mood flowerbed
- Optional 9am reminder, off by default; permission asked only when you turn it on
- All data on the device (AsyncStorage repository in `src/services/db`); "Erase all my data" in Me
- Anonymous product analytics via PostHog (optional): only `app_opened {day_index}` and `logged {kind}`, never values
- Works fully offline (there is nothing to sync)

## Quickstart

```bash
npm install
npx expo start          # or: npm run go  (forces Expo Go)
```

Press `i` for iOS Simulator, `a` for an Android emulator, or scan the QR code with the Expo Go app.

> Requires the Expo SDK 58 toolchain (React Native 0.88, React 19.3). Node version is pinned in `.nvmrc`.

## Data & privacy

There is no backend. Everything you log is stored on the device; see [DATABASE.md](DATABASE.md). Uninstalling the app deletes your data; device backups include it. Analytics (only when a PostHog key is set) carry no health values: no glass counts, minutes, steps or moods.

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
├── src/
│   ├── components/
│   │   ├── garden/            # Garden (SVG scene), QuickActions, WorkoutSheet
│   │   ├── home/MoodPicker.tsx
│   │   └── ActionTile, Button, Chip, MoodTile, Card, Header, Screen
│   ├── domain/
│   │   ├── garden/garden.ts   # gardenState(): logs → garden (pure, unit-tested)
│   │   ├── garden/changes.ts  # weeklyChanges(), flowersByWeek()
│   │   ├── garden/days.ts     # local-day helpers
│   │   └── checkin/moods.ts   # mood tiles → energy → mood
│   ├── screens/
│   │   ├── onboarding/        # name + how the garden grows
│   │   └── main/              # Garden, Changes, Me (ProfileScreen)
│   ├── services/              # db (local repository), telemetry, appOpens, notifications
│   ├── store/                 # gardenStore, profileStore, settingsStore
│   ├── constants/             # colors (incl. gardenColors), copy
│   ├── types/                 # shared TypeScript types
│   └── navigation/            # RootNavigator, TabNavigator
└── __tests__/                 # Unit + component tests
```

## Code quality

- Strict TypeScript
- The garden and the Changes sentences are pure functions with unit tests (`__tests__/garden.test.ts`, `__tests__/changes.test.ts`)
- Contrast and "no em dashes" are enforced by tests

## License

MIT
