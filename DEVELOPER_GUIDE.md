# DEVELOPER_GUIDE.md

Practical how-tos. For product framing and build/EAS instructions see [README.md](README.md).

## Setup

```bash
npm install
cp .env.example .env       # fill EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY
# In Supabase SQL editor: paste & run supabase/schema.sql
npx expo start
```

Node version is pinned in `.nvmrc`. Requires the Expo SDK 54 toolchain (RN 0.81 / React 19).

## Verification (run before claiming done)

```bash
npm run typecheck   # tsc --noEmit — strict; must pass
npm test            # Jest unit + component
```

There is no linter/build to run locally. The composer has the most valuable tests; add to
`__tests__/composer.test.ts` whenever you touch composition logic.

## Common tasks

### Add an exercise
1. Append an `insert ... values (...)` row to the seed block in
   [supabase/schema.sql](supabase/schema.sql) (category must be one of
   `regulate|mobilize|strengthen|move|downshift`; `base_difficulty` 1–3; `cues` is a text[]).
2. Re-run that insert in the Supabase SQL editor (`ON CONFLICT DO NOTHING`).
3. No code change needed — the library is fetched at check-in time.

### Change how sessions are composed
- Edit [src/domain/sessions/composer.ts](src/domain/sessions/composer.ts) (keep it **pure**).
- Update/extend [__tests__/composer.test.ts](__tests__/composer.test.ts).
- If output semantics change, **bump `ENGINE_VERSION`** in
  [src/store/sessionStore.ts](src/store/sessionStore.ts).

### Add a DB column / table
Follow the checklist in [DATABASE.md](DATABASE.md): `schema.sql` → `src/types/index.ts` →
queries (see [API_MAP.md](API_MAP.md)) → re-run SQL. Add an RLS policy for any new table.

### Add a screen
Create under `src/screens/**`, register it in the relevant navigator
(`src/navigation/`), and add its param type to `src/navigation/types.ts`.

### Wire Stripe (premium)
`src/services/premium.ts` is a stub. Replace `startCheckout()` with a call to a Supabase
Edge Function that creates a Stripe Checkout session; have its webhook set
`profiles.is_premium`. `isPremium()` already reads that column.

## Conventions recap
- Import from `@/…` (alias to `src/`).
- Colors only from [src/constants/colors.ts](src/constants/colors.ts); copy from
  [src/constants/copy.ts](src/constants/copy.ts).
- Async/Supabase logic in `store/` or `services/`, never in `domain/` or components.

## AI-first workflow (keep Claude cheap & focused)

Read [CLAUDE.md](CLAUDE.md) first, then open only the files the task names below. Don't scan `src/**`.

| Task | Open only |
|---|---|
| **Bug fix** | Reproduce/locate via the doc map → the owning store/service/component + its test. Use `systematic-debugging`. |
| **Feature** | `CLAUDE.md` + `ARCHITECTURE.md` → the one layer it lives in. New domain logic ⇒ `composer`-style pure module + test first (TDD). |
| **Refactor** | `PROJECT_MAP.md` to find all call sites; change behavior-preserving only; `typecheck` + `test`. |
| **Security audit** | `DATABASE.md` (RLS policies), `services/supabase.ts`, `authStore.ts` (note the debug log), env handling. |
| **Architecture review** | `ARCHITECTURE.md`; verify the dependency rule (domain imports nothing but types). |

**Hard rule:** never read `package-lock.json` or `node_modules/**` (see `.claudeignore`).
Prefer `Grep`/`Glob` (which honor ignores) over reading whole files.
