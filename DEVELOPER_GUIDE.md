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

There is no linter/build to run locally. The composer has the most valuable tests; add to
`__tests__/composer.test.ts` whenever you touch composition logic.

## Common tasks

### Add an exercise
1. Add an entry to [src/data/exercises.ts](src/data/exercises.ts) with the **next free stable id**
   in its category (e.g. `ex-regulate-7`) — never renumber existing ids (stats are keyed by them).
   `category` is one of `regulate|mobilize|strengthen|move|downshift`; `base_difficulty` 1–3.
2. Update the count in [__tests__/exercises.test.ts](__tests__/exercises.test.ts).

### Change how sessions are composed
- Edit [src/domain/sessions/composer.ts](src/domain/sessions/composer.ts) (keep it **pure**).
- Update/extend [__tests__/composer.test.ts](__tests__/composer.test.ts).
- If output semantics change, **bump `ENGINE_VERSION`** in
  [src/store/sessionStore.ts](src/store/sessionStore.ts).

### Add a field or table to the data model
Change [src/services/db/](src/services/db/index.ts) + `src/types/index.ts` + [DATABASE.md](DATABASE.md)
together. Rows already on people's phones lack the new field — make it optional or default it on read.
Add a test in [__tests__/db.test.ts](__tests__/db.test.ts).

### Add a screen
Create under `src/screens/**`, register it in the relevant navigator
(`src/navigation/`), and add its param type to `src/navigation/types.ts`.

### Wire real purchases (premium)
`src/services/premium.ts` `startCheckout()` is a stub. Use App Store / Google Play billing
(e.g. RevenueCat): on a successful purchase or restore, call `useProfileStore.getState().setPremium(true)`.
No server of our own is required.

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
| **Feature** | `CLAUDE.md` + `ARCHITECTURE.md` → the one layer it lives in. New domain logic ⇒ `composer`-style pure module + test first (TDD). |
| **Refactor** | `PROJECT_MAP.md` to find all call sites; change behavior-preserving only; `typecheck` + `test`. |
| **Security audit** | `DATABASE.md` (on-device storage), `services/telemetryPrivacy.ts` (what leaves the phone), env handling (`EXPO_PUBLIC_*` ships inside the app). |
| **Architecture review** | `ARCHITECTURE.md`; verify the dependency rule (domain imports nothing but types). |

**Hard rule:** never read `package-lock.json` or `node_modules/**` (see `.claudeignore`).
Prefer `Grep`/`Glob` (which honor ignores) over reading whole files.
