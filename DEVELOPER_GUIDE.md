# DEVELOPER_GUIDE.md

Practical how-tos. For product framing and build/EAS instructions see [README.md](README.md).

## Setup

```bash
npm install
npx expo start             # no backend, no keys needed — data lives on the device
# optional: cp .env.example .env and set EXPO_PUBLIC_POSTHOG_API_KEY
```

Node version is pinned in `.nvmrc`. Requires the Expo SDK 57 toolchain (RN 0.86 / React 19.2).

## Verification (run before claiming done)

```bash
npm run typecheck   # tsc --noEmit — strict; must pass
npm test            # Jest unit + component
```

There is no linter/build to run locally. The garden logic has the most valuable tests; add to
`__tests__/garden.test.ts` / `__tests__/changes.test.ts` whenever you touch it.

## Common tasks

### Change what the garden shows
- Edit [src/domain/garden/garden.ts](src/domain/garden/garden.ts) (keep it **pure**: `now` is a parameter, no
  `Date.now()`), then the drawing in [Garden.tsx](src/components/garden/Garden.tsx).
- Extend [__tests__/garden.test.ts](__tests__/garden.test.ts). Keep the rules: stream and grass never
  below their floor, the tree never shrinks, every mood flower equally pretty, resting loses nothing.
- Keep `GARDEN_COPY.a11ySummary` in step (its test bans negative words).

### Change the Changes sentences
Edit [changes.ts](src/domain/garden/changes.ts) and `CHANGES_COPY`. Quieter weeks are named gently and
never state a shortfall (the test bans digits and "less / fewer / down / drop / missed" in them).

### Try real steps on Android (development build)
Expo Go can't read Android steps. Build the development app once with EAS (free account):

```bash
npm install -g eas-cli
eas login
npm run build:dev:android
```

Install the APK it links, then `npx expo start` (not `npm run go`) and open the project from the
MoveKind dev app. The phone needs Health Connect (built into Android 14+, a Play Store app before
that). iPhone steps already work in Expo Go.

### Add a field or table to the data model
Change [src/services/db/](src/services/db/index.ts) + `src/types/index.ts` + [DATABASE.md](DATABASE.md)
together. Rows already on people's phones lack the new field — make it optional or default it on read.
Add a test in [__tests__/db.test.ts](__tests__/db.test.ts).

### Add a screen
Create under `src/screens/**`, register it in the relevant navigator
(`src/navigation/`), and add its param type to `src/navigation/types.ts`.

## Conventions recap
- Import from `@/…` (alias to `src/`).
- Colors only from [src/constants/colors.ts](src/constants/colors.ts); copy from
  [src/constants/copy.ts](src/constants/copy.ts).
- Async/storage logic in `store/` or `services/` (data only via `db`), never in `domain/` or components.

## AI-first workflow (keep Claude cheap & focused)

Read [CLAUDE.md](CLAUDE.md) first, then open only the files the task names below. Don't scan `src/**`.

| Task | Open only |
|---|---|
| **Bug fix** | Reproduce/locate via the doc map → the owning store/service/component + its test. Use `systematic-debugging`. |
| **Feature** | `CLAUDE.md` + `ARCHITECTURE.md` → the one layer it lives in. New domain logic ⇒ a pure module like `garden.ts` + test first (TDD). |
| **Refactor** | `PROJECT_MAP.md` to find all call sites; change behavior-preserving only; `typecheck` + `test`. |
| **Security audit** | `DATABASE.md` (on-device storage), `services/telemetryPrivacy.ts` (what leaves the phone), env handling (`EXPO_PUBLIC_*` ships inside the app). |
| **Architecture review** | `ARCHITECTURE.md`; verify the dependency rule (domain imports nothing but types). |

**Hard rule:** never read `package-lock.json` or `node_modules/**` (see `.claudeignore`).
Prefer `Grep`/`Glob` (which honor ignores) over reading whole files.
