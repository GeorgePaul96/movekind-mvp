# Local-First Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Supabase with on-device storage so MoveKind runs fully without a server and without accounts.

**Architecture:** A typed repository (`src/services/db/`) over AsyncStorage JSON tables is the only data access path. The exercise library becomes code; the stats trigger becomes a pure domain function. Auth is removed; a profile store holds the local profile.

**Tech Stack:** Expo SDK 57 · React Native 0.86 · TypeScript 6 · Zustand · AsyncStorage · Jest.

**Spec:** `docs/superpowers/specs/2026-10-15-local-first-design.md`

## Global Constraints

- All data access goes through `src/services/db` — no other module touches AsyncStorage for app data (settingsStore keeps its own key).
- `src/domain/**` stays pure (no AsyncStorage, no React).
- Exercise ids are stable strings `ex-<category>-<n>`; never regenerate them.
- `ENGINE_VERSION` stays `v3.0` (composition unchanged).
- User-facing copy in `src/constants/copy.ts`; banned UI words: attunement, capacity, nervous system, parasympathetic, somatic, Safe Harbor.
- Verify each task with `npm run typecheck` and `npm test`. Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Two writes to the same table at the same moment (e.g. block complete + skip) — both rows must survive. → Task 3 test "concurrent inserts".
2. Stored JSON is corrupt or from an older shape — app must still launch with an empty table, not crash. → Task 3 test "corrupt data".
3. Existing installs: settings say onboarded but no profile doc exists — profile is created on first read with a stable id that stays the same afterwards. → Task 3 test "profile id stable".
4. A check-in from yesterday must not count as today's after midnight. → Task 5 test "yesterday is not today".
5. "Erase all my data" must leave nothing behind and return to onboarding. → Task 4 test "eraseAll".

---

### Task 1: Exercise library in code

**Files:** Create `src/data/exercises.ts`; Test `__tests__/exercises.test.ts`

**Interfaces:** Produces `EXERCISES: Exercise[]`, `exerciseById(id: string): Exercise | undefined`.

- [ ] **Step 1: Failing test** — `__tests__/exercises.test.ts`

```ts
import { EXERCISES, exerciseById } from '../src/data/exercises';

describe('exercise library', () => {
  it('has 30 exercises, 6 per category', () => {
    expect(EXERCISES).toHaveLength(30);
    for (const c of ['regulate', 'mobilize', 'strengthen', 'move', 'downshift']) {
      expect(EXERCISES.filter((e) => e.category === c)).toHaveLength(6);
    }
  });
  it('uses unique, stable ids', () => {
    const ids = EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(30);
    for (const id of ids) expect(id).toMatch(/^ex-(regulate|mobilize|strengthen|move|downshift)-[1-6]$/);
  });
  it('every exercise has cues and no jargon in its name', () => {
    for (const e of EXERCISES) {
      expect(e.cues.length).toBeGreaterThan(0);
      expect(e.name).not.toMatch(/somatic|attunement|nervous system/i);
    }
  });
  it('looks exercises up by id', () => {
    expect(exerciseById('ex-regulate-1')?.name).toBe('Box Breathing');
    expect(exerciseById('nope')).toBeUndefined();
  });
});
```

- [ ] **Step 2:** `npx jest __tests__/exercises.test.ts` → FAIL (module missing).
- [ ] **Step 3:** Generate `src/data/exercises.ts` from the `insert into public.exercises` block of `supabase/schema.sql` (30 rows, same order): id `ex-<category>-<index within category, 1-based>`, `created_at: '2026-01-01T00:00:00.000Z'`, `is_premium: false`; rename `Standing Somatic Shake` → `Standing Shake-Out`. Export `EXERCISES` and `exerciseById = (id) => EXERCISES.find((e) => e.id === id)`.
- [ ] **Step 4:** Test → PASS; typecheck.
- [ ] **Step 5: Commit** — `feat(data): exercise library in code with stable ids`

---

### Task 2: Stats update as a pure function

**Files:** Create `src/domain/sessions/applyRating.ts`; Test `__tests__/applyRating.test.ts`

**Interfaces:** Produces `applyRating(stats: UserExerciseStats[], exerciseIds: string[], ratingDelta: number, now: Date, userId: string): UserExerciseStats[]` (returns a new array; input untouched).

- [ ] **Step 1: Failing test**

```ts
import { applyRating } from '../src/domain/sessions/applyRating';

const NOW = new Date('2026-10-15T10:00:00.000Z');

describe('applyRating (port of sync_user_exercise_stats)', () => {
  it('creates a stat for a first-time exercise', () => {
    const out = applyRating([], ['a'], 2, NOW, 'u');
    expect(out).toEqual([expect.objectContaining({
      user_id: 'u', exercise_id: 'a', times_completed: 1, average_energy_delta: 2,
      last_completed_at: NOW.toISOString(),
    })]);
  });
  it('updates a running average for a known exercise', () => {
    const first = applyRating([], ['a'], 2, NOW, 'u');
    const second = applyRating(first, ['a'], -1, NOW, 'u');
    expect(second[0]).toMatchObject({ times_completed: 2, average_energy_delta: 0.5 });
  });
  it('handles several exercises and leaves others alone', () => {
    const base = applyRating([], ['a', 'b'], 1, NOW, 'u');
    const out = applyRating(base, ['b'], 3, NOW, 'u');
    expect(out.find((s) => s.exercise_id === 'a')).toMatchObject({ times_completed: 1, average_energy_delta: 1 });
    expect(out.find((s) => s.exercise_id === 'b')).toMatchObject({ times_completed: 2, average_energy_delta: 2 });
  });
  it('does not mutate its input', () => {
    const base = applyRating([], ['a'], 1, NOW, 'u');
    const snapshot = JSON.stringify(base);
    applyRating(base, ['a'], 2, NOW, 'u');
    expect(JSON.stringify(base)).toBe(snapshot);
  });
  it('counts a repeated exercise in one session once per occurrence, like the trigger loop', () => {
    const out = applyRating([], ['a', 'a'], 2, NOW, 'u');
    expect(out[0]).toMatchObject({ times_completed: 2, average_energy_delta: 2 });
  });
});
```

- [ ] **Step 2:** FAIL (module missing).
- [ ] **Step 3: Implement**

```ts
import type { UserExerciseStats } from '@/types';

/**
 * Pure port of the former Postgres trigger `sync_user_exercise_stats()`.
 * For every completed exercise in a rated session: first time → n=1, avg=delta;
 * otherwise avg = (avg·n + delta)/(n+1), n+1. Returns a new array.
 */
export function applyRating(
  stats: UserExerciseStats[],
  exerciseIds: string[],
  ratingDelta: number,
  now: Date,
  userId: string,
): UserExerciseStats[] {
  const byId = new Map(stats.map((s) => [s.exercise_id, { ...s }]));
  for (const exerciseId of exerciseIds) {
    const cur = byId.get(exerciseId);
    if (!cur) {
      byId.set(exerciseId, {
        id: `stat-${exerciseId}`,
        user_id: userId,
        exercise_id: exerciseId,
        times_completed: 1,
        average_energy_delta: ratingDelta,
        average_session_completion_rate: 0,
        last_completed_at: now.toISOString(),
      });
    } else {
      const n = cur.times_completed;
      cur.average_energy_delta = (cur.average_energy_delta * n + ratingDelta) / (n + 1);
      cur.times_completed = n + 1;
      cur.last_completed_at = now.toISOString();
    }
  }
  return [...byId.values()];
}
```

- [ ] **Step 4:** PASS; typecheck. **Step 5: Commit** — `feat(domain): applyRating — stats trigger as a pure function`

---

### Task 3: Local repository

**Files:** Create `src/services/db/table.ts`, `src/services/db/index.ts`; Modify `src/types/index.ts` (`SessionBlock.created_at?: string`); Test `__tests__/db.test.ts`

**Interfaces (produced):**
- `createTable<T extends { id: string }>(key)` → `{ all(): Promise<T[]>; insertMany(rows: T[]): Promise<T[]>; insert(row: T): Promise<T>; update(id, patch: Partial<T>): Promise<T | null>; replaceAll(rows: T[]): Promise<void>; clear(): Promise<void> }`; `__resetDbCacheForTests()`.
- `db` with:
  - `profile.get(): Promise<Profile>` (creates `{ id: newId(), name: null, is_premium: false, created_at }` on first read), `profile.update(patch): Promise<Profile>`
  - `checkIns.add(input: { energy_score; sleep_quality; intention; engine_version }): Promise<CheckIn>`, `checkIns.update(id, patch): Promise<CheckIn | null>`, `checkIns.since(iso): Promise<CheckIn[]>` (newest first), `checkIns.all()`
  - `sessions.add(input: { check_in_id; state; engine_version; status }): Promise<Session>`, `sessions.update(id, patch)`, `sessions.latestActive(): Promise<Session | null>` (newest `generated|started`), `sessions.list(opts?: { since?: string; statuses?: Session['status'][] }): Promise<Session[]>` (newest first), `sessions.countCompleted(sinceIso?): Promise<number>`
  - `blocks.addMany(sessionId, rows: { exercise_id; block_order; target_duration }[]): Promise<BlockWithExercise[]>`, `blocks.update(id, patch)`, `blocks.forSession(id): Promise<BlockWithExercise[]>` (by block_order), `blocks.recentCompletedExerciseIds(limit): Promise<string[]>` (newest first), `blocks.secondsBySession(): Promise<Record<string, number>>`
  - `ratings.add(input: { session_id; rating_delta; notes }): Promise<PostRating>` — also runs `applyRating` over that session's completed blocks and saves stats
  - `ratings.list(sinceIso?)`, `stats.all(): Promise<UserExerciseStats[]>`, `exercises.all(): Exercise[]`, `eraseAll(): Promise<void>`
  - `type BlockWithExercise = SessionBlock & { exercise: Exercise }`

- [ ] **Step 1: Failing test** — `__tests__/db.test.ts`

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, __resetDbCacheForTests } from '../src/services/db';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetDbCacheForTests();
});

const ci = (energy = 4) => ({ energy_score: energy, sleep_quality: null, intention: null, engine_version: 'v3.0' });

describe('local repository', () => {
  it('persists across an app restart (cache reset)', async () => {
    const saved = await db.checkIns.add(ci());
    __resetDbCacheForTests();
    expect(await db.checkIns.all()).toEqual([saved]);
  });

  it('concurrent inserts never lose rows', async () => {
    await Promise.all([db.checkIns.add(ci(1)), db.checkIns.add(ci(2)), db.checkIns.add(ci(5))]);
    __resetDbCacheForTests();
    expect(await db.checkIns.all()).toHaveLength(3);
  });

  it('survives corrupt stored data with an empty table', async () => {
    await AsyncStorage.setItem('@movekind/db/check_ins', '{not json');
    expect(await db.checkIns.all()).toEqual([]);
  });

  it('profile id is created once and stays stable', async () => {
    const a = await db.profile.get();
    __resetDbCacheForTests();
    const b = await db.profile.get();
    expect(b.id).toBe(a.id);
    expect(b).toMatchObject({ name: null, is_premium: false });
  });

  it('updates a row by id', async () => {
    const row = await db.checkIns.add(ci());
    await db.checkIns.update(row.id, { sleep_quality: 'poor' });
    expect((await db.checkIns.all())[0]?.sleep_quality).toBe('poor');
  });

  it('joins blocks to the exercise library and finds the active session', async () => {
    const s = await db.sessions.add({ check_in_id: null, state: 'regulated', engine_version: 'v3.0', status: 'generated' });
    const blocks = await db.blocks.addMany(s.id, [{ exercise_id: 'ex-regulate-1', block_order: 0, target_duration: 60 }]);
    expect(blocks[0]?.exercise.name).toBe('Box Breathing');
    expect((await db.sessions.latestActive())?.id).toBe(s.id);
  });

  it('a rating updates per-exercise stats for completed blocks only', async () => {
    const s = await db.sessions.add({ check_in_id: null, state: 'regulated', engine_version: 'v3.0', status: 'started' });
    const [b1, b2] = await db.blocks.addMany(s.id, [
      { exercise_id: 'ex-regulate-1', block_order: 0, target_duration: 60 },
      { exercise_id: 'ex-move-1', block_order: 1, target_duration: 60 },
    ]);
    await db.blocks.update(b1!.id, { status: 'completed', actual_duration: 60 });
    await db.blocks.update(b2!.id, { status: 'skipped' });
    await db.ratings.add({ session_id: s.id, rating_delta: 2, notes: null });
    const stats = await db.stats.all();
    expect(stats).toEqual([expect.objectContaining({ exercise_id: 'ex-regulate-1', times_completed: 1, average_energy_delta: 2 })]);
  });

  it('eraseAll removes everything, including the profile', async () => {
    const before = await db.profile.get();
    await db.checkIns.add(ci());
    await db.eraseAll();
    __resetDbCacheForTests();
    expect(await db.checkIns.all()).toEqual([]);
    expect((await db.profile.get()).id).not.toBe(before.id);
  });
});
```

- [ ] **Step 2:** FAIL (module missing).
- [ ] **Step 3: Implement `table.ts`** — keys `@movekind/db/<name>`; `load()` reads once, parses inside try/catch (invalid or non-array → `[]`), caches; every mutation runs through a per-table promise chain (`queue = queue.then(op)`) so read-modify-write is serialized; writes `JSON.stringify(rows)`. A module-level registry lets `__resetDbCacheForTests()` drop all caches.
- [ ] **Step 4: Implement `index.ts`** — `newId()` = `` `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}` ``; tables `check_ins`, `sessions`, `session_blocks`, `post_ratings`, `user_exercise_stats`; profile doc stored at `@movekind/db/profile` through the same serialized pattern; `user_id` = profile id; `created_at` = `new Date().toISOString()`; blocks joined with `exerciseById` (rows whose exercise no longer exists are dropped); `ratings.add` → insert rating, load the session's completed blocks, `stats.replaceAll(applyRating(stats, ids, delta, new Date(), userId))`; `eraseAll` clears every table and the profile doc.
- [ ] **Step 5:** PASS; typecheck. **Commit** — `feat(db): local repository over AsyncStorage`

---

### Task 4: No accounts — profile store, onboarding name, navigation

**Files:** Create `src/store/profileStore.ts`, `__tests__/profileStore.test.ts`; Modify `src/navigation/RootNavigator.tsx`, `src/navigation/types.ts`, `src/screens/auth/OnboardingScreen.tsx` (move to `src/screens/onboarding/OnboardingScreen.tsx`), `App.tsx`, `src/store/settingsStore.ts` (add `reset()`); Delete `src/store/authStore.ts`, `src/navigation/AuthStack.tsx`, `src/screens/auth/SignInScreen.tsx`, `src/screens/auth/SignUpScreen.tsx`.

**Interfaces:** Produces `useProfileStore` with `{ profile: Profile | null; hydrate(): Promise<void>; setName(name: string): Promise<void>; setPremium(v: boolean): Promise<void>; eraseAll(): Promise<void> }`. `eraseAll` → `db.eraseAll()`, `useSettingsStore.getState().reset()`, `telemetry.reset()`, re-hydrate. `useSettingsStore.reset()` writes `DEFAULTS` (onboarded false).

- [ ] **Step 1: Failing test** — hydrate creates a profile; `setName` trims and persists (empty → null); `setPremium(true)` persists; `eraseAll` returns `onboarded` to false, gives a new profile id, and leaves no check-ins.
- [ ] **Step 2:** FAIL. **Step 3:** Implement the store. RootNavigator: `onboarded ? Main : Onboarding` (no session gate). Onboarding: add step 0 "What should we call you?" (TextInput, optional, "Skip" link) before the existing four steps (progress /5); on finish `setName(name)` then `completeOnboarding(answers)`; remove all Supabase code. App.tsx: hydrate settings + profile, `telemetry.identify(profile.id)`, `initNotifications()`; drop outbox + url-polyfill import. Copy for the name step in `copy.ts` (`ONBOARDING_COPY.nameTitle`, `.namePlaceholder`, `.skip`).
- [ ] **Step 4:** PASS + typecheck (other files still importing authStore are fixed in Tasks 5–6; if typecheck fails only on those, finish Task 5–6 before committing — commit Tasks 4–6 together if needed). **Commit** — `feat(app): no accounts — local profile, onboarding asks your name`

---

### Task 5: Session store on the repository

**Files:** Modify `src/store/sessionStore.ts`, `src/services/behavioralProfile.ts`; Rewrite `__tests__/sessionFlow.test.ts`, `__tests__/sessionStore.test.ts`; Delete `src/services/outbox.ts`, `__tests__/outbox.test.ts`.

Call mapping (every `supabase.*` in the store):

| Old | New |
|---|---|
| `supabase.auth.getUser()` guard | removed |
| stats select | `db.stats.all()` |
| today's check-in | `(await db.checkIns.since(localMidnight))[0] ?? null` |
| active session + blocks | `db.sessions.latestActive()`, `db.blocks.forSession(id)` |
| check_ins insert / update | `db.checkIns.add` / `db.checkIns.update` |
| `profiles.is_premium` | `(await db.profile.get()).is_premium` |
| exercises select | `db.exercises.all()` |
| recent completed blocks | `db.blocks.recentCompletedExerciseIds(10)` |
| sessions insert / update | `db.sessions.add` / `db.sessions.update` |
| session_blocks insert / update | `db.blocks.addMany` / `db.blocks.update` |
| post_ratings insert (+ outbox fallback) | `db.ratings.add` (no outbox) |
| completed count | `db.sessions.countCompleted()` |
| loadWeek queries | `db.checkIns.since(lastStart)`, `db.sessions.list({ since, statuses: ['completed'] })` + `db.blocks.secondsBySession()` |

`behavioralProfile.ts`: `db.sessions.list({ since, statuses: ['completed','abandoned'] })`, `db.checkIns.since(since)`, `db.ratings.list(since)`.

- [ ] **Step 1:** Rewrite `sessionFlow.test.ts` to use the real `db` over the AsyncStorage mock (mock only telemetry, notifications, behavioralProfile). Keep every existing scenario (log never paywalls; start composes regulated blocks; paywall after 5 completed when not premium — seed by `db.profile.update({ is_premium:false })` and 5 `db.sessions.add({...status:'completed'})`; complete → week view; sleep + trimmed note; blank note → null; change today updates; dismiss; loadWeek) and add **"yesterday is not today"**: a check-in stored with yesterday's `created_at` (insert via `db.checkIns.add` then `db.checkIns.update(id,{created_at: yesterdayIso})`) → `loadStatsAndHistory()` leaves `currentCheckIn` null; plus **"rating updates stats"**: complete a block, rate, `db.stats.all()` non-empty. Replace the failed-save test with: `jest.spyOn(db.checkIns,'add').mockRejectedValueOnce(new Error('disk full'))` → rejects, `currentCheckIn` null.
- [ ] **Step 2:** FAIL. **Step 3:** Implement the mapping. **Step 4:** PASS; typecheck. **Commit** — `feat(store): sessions run on the local repository; outbox removed`

---

### Task 6: Screens and components on the repository

**Files:** Modify `src/components/Paywall.tsx`, `src/components/SessionComplete.tsx`, `src/screens/main/JourneyScreen.tsx`, `src/screens/main/ProfileScreen.tsx`, `src/screens/main/HomeScreen.tsx`, `src/hooks/useBootstrapData.ts` (delete if empty), `src/services/premium.ts` (keep `startCheckout` stub only), `__tests__/HomeScreen.test.tsx`; Delete `src/services/profile.ts`, `src/services/cache.ts`.

- Paywall: insights from `db.ratings.list()` + `db.stats.all()` joined to `exerciseById`; beta upgrade → `useProfileStore.getState().setPremium(true)`.
- SessionComplete: this-week completed count → `db.sessions.countCompleted(weekStartIso)`.
- Journey: check-ins `db.checkIns.all()`; playbook `db.stats.all()` sorted by avg desc, top 3 joined to exercises; total `db.sessions.countCompleted()`; avg delta from `db.ratings.list()`; premium from `useProfileStore`.
- Profile: name from/to `useProfileStore`; remove email + Sign out; add "Erase all my data" (`Button variant="link"`) → `Alert.alert` confirm → `eraseAll()`. Copy in `PROFILE_COPY` (`eraseTitle`, `eraseBody`, `eraseConfirm`, `cancel`, `localNote: 'Everything you log stays on this phone.'`).
- Home: `name = useProfileStore(s => s.profile?.name ?? null)`.
- HomeScreen test: drop the supabase/auth mocks; seed `useProfileStore.setState({ profile: {...} })`.

- [ ] **Step 1:** Update HomeScreen test (name shows in prompt from profile store). **Step 2:** Implement all bullets. **Step 3:** `grep -rn "supabase\|authStore" src App.tsx` → no matches; typecheck; tests. **Commit** — `feat(ui): screens read the local repository; erase-my-data replaces sign-out`

---

### Task 7: Remove Supabase from the project

**Files:** Delete `src/services/supabase.ts`, `.github/workflows/supabase-keepalive.yml`; Move `supabase/schema.sql` → `docs/archive/supabase-schema.sql` (prepend a header comment: archived 2026-10-15, kept for a future circles server); Modify `package.json` (uninstall `@supabase/supabase-js`, `react-native-url-polyfill`), `src/types/env.d.ts` (drop Supabase vars), `.env.example` (PostHog only).

- [ ] **Step 1:** `npm uninstall @supabase/supabase-js react-native-url-polyfill`; apply file moves/deletes. **Step 2:** typecheck, tests, `npx expo-doctor`. **Commit** — `chore: remove Supabase — app is local-first`

---

### Task 8: Docs and full verification

**Files:** `CLAUDE.md` (tech stack, stats rule → `applyRating`, DB-change rule → `db/` + types + DATABASE.md), `DATABASE.md` (rewrite as the local data model), `API_MAP.md` (repository methods by caller), `ARCHITECTURE.md`, `PROJECT_MAP.md`, `README.md` (env vars, setup), `DEVELOPER_GUIDE.md` (no Supabase setup; how to add an exercise = edit `src/data/exercises.ts` with a new stable id), `ROADMAP.md` (local-first ✅; circles needs a server later; "Export my data" item).

- [ ] **Step 1:** Update docs. **Step 2:** typecheck; full tests; `npx expo-doctor`; start Metro `--go` and fetch Android + iOS bundles (HTTP 200). **Step 3: Commit** — `docs: local-first architecture`
