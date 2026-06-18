# Phase 3A Behavioral Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pure, tested behavioral-intelligence engine that reads a user's session history and surfaces anti-guilt "return" signals (gaps, rhythm, recovery, wins), plus a Home Screen banner that consumes it.

**Architecture:** Small focused pure functions in `src/domain/behavioral/` (mirroring `src/domain/sessions/composer.ts`), composed by a single `computeBehavioralProfile()` orchestrator. A `useBehavioralProfile()` hook fetches recent history from Supabase and memoizes the computation. A `BehavioralBanner` component renders one dominant message (most recent win, falling back to recovery-signal copy) plus one insight line on `HomeScreen`.

**Tech Stack:** TypeScript (strict), React Native / Expo, Zustand-adjacent (hook only), Supabase JS client, Jest + @testing-library/react-native.

## Global Constraints

- **Pure layer purity:** `src/domain/behavioral/**` imports only from `@/types`. No React, no Supabase, no I/O, no `Date.now()` side effects except via the injectable `now` parameter (default `new Date()`).
- **No schema changes.** Recovery is inferred from behavioral + check-in data only.
- **Anti-guilt:** never render streaks, gap-shaming, or pressure language. A long gap is a welcome-back, never a failure.
- **Colors only from `@/constants/colors`** (`sageDark` `#3A6B4A` for accessible active text). User-facing strings go in `@/constants/copy`.
- **Gap definition:** inactivity > 3 days between consecutive completed sessions.
- **Wins:** max 3, most recent first. `intention_kept` is dropped (no intentions exist).
- **Import alias:** source uses `@/...`; test files use relative `../src/...` (matches `__tests__/composer.test.ts`).
- **Verify** with `npm run typecheck` and `npm test`.

## File Structure

- Create `src/domain/behavioral/types.ts` — all behavioral interfaces + `RecoverySignal`, `WinType` unions.
- Create `src/domain/behavioral/gaps.ts` — `computeGapProfile(sessions, now)`.
- Create `src/domain/behavioral/rhythm.ts` — `computeRhythm(sessions, now)`.
- Create `src/domain/behavioral/recovery.ts` — `computeRecovery(sessions, checkIns, ratings, gaps, rhythm)`.
- Create `src/domain/behavioral/wins.ts` — `detectWins(sessions, gaps, rhythm, now)`.
- Create `src/domain/behavioral/index.ts` — `computeBehavioralProfile(...)` + re-exports.
- Create `src/hooks/useBehavioralProfile.ts` — fetch + memoized compute.
- Create `src/components/BehavioralBanner.tsx` — UI surface.
- Modify `src/constants/copy.ts` — add `BEHAVIORAL_FALLBACK`.
- Modify `src/screens/main/HomeScreen.tsx` — render the banner above the check-in CTA.
- Create `__tests__/behavioral.test.ts` — unit tests for the pure layer (Tasks 1–5 append here).
- Create `__tests__/BehavioralBanner.test.tsx` — render test.

---

### Task 1: Types + Gap profile

**Files:**
- Create: `src/domain/behavioral/types.ts`
- Create: `src/domain/behavioral/gaps.ts`
- Test: `__tests__/behavioral.test.ts`

**Interfaces:**
- Produces: the full type module (below) and `computeGapProfile(sessions: Session[], now?: Date): GapProfile`.

- [ ] **Step 1: Create the types module**

`src/domain/behavioral/types.ts`:

```ts
export interface GapProfile {
  hasHistory: boolean;
  lastGapDays: number;
  avgGapDays: number;
  gapHistory: number[];          // last 5 inter-session intervals (days), oldest → newest
  trend: 'shrinking' | 'stable' | 'growing' | 'insufficient_data';
  observation: string | null;
}

export interface RhythmStability {
  weeklyVariance: number;
  avgWeeklySessions: number;
  trajectory: 'stabilizing' | 'stable' | 'fragmenting' | 'rebuilding' | 'insufficient_data';
  observation: string | null;
}

export type RecoverySignal =
  | 'collapse' | 'spiral' | 'burnout_risk' | 'returning' | 'stable' | 'thriving';

export interface RecoveryState {
  signal: RecoverySignal;
  isMotivationalCollapse: boolean;
  isAvoidanceSpiral: boolean;
  isBurnoutRisk: boolean;
  reEntryReadiness: 'high' | 'medium' | 'low';
}

export type WinType =
  | 'faster_return'
  | 'difficult_week_log'
  | 'gap_shrinking'
  | 'rhythm_stabilizing';

export interface SelfEfficacyWin {
  type: WinType;
  observation: string;
}

export interface BehavioralProfile {
  gaps: GapProfile;
  rhythm: RhythmStability;
  recovery: RecoveryState;
  wins: SelfEfficacyWin[];
}
```

- [ ] **Step 2: Write the failing test (with shared factories)**

Create `__tests__/behavioral.test.ts`:

```ts
import type { Session, CheckIn, PostRating } from '../src/types';
import type { GapProfile, RhythmStability } from '../src/domain/behavioral/types';
import { computeGapProfile } from '../src/domain/behavioral/gaps';

const DAY = 86_400_000;
const NOW = new Date('2026-06-18T12:00:00.000Z');
const daysAgo = (n: number): string => new Date(NOW.getTime() - n * DAY).toISOString();

let _id = 0;
const uid = () => `id${_id++}`;

function session(overrides: Partial<Session> = {}): Session {
  return {
    id: uid(), user_id: 'u1', check_in_id: null, state: 'regulated',
    status: 'completed', engine_version: 'v2.3', created_at: daysAgo(0), ...overrides,
  };
}
function checkIn(overrides: Partial<CheckIn> = {}): CheckIn {
  return {
    id: uid(), user_id: 'u1', energy_score: 3, sleep_quality: 'fair',
    engine_version: 'v2.3', created_at: daysAgo(0), ...overrides,
  };
}
function rating(overrides: Partial<PostRating> = {}): PostRating {
  return { id: uid(), session_id: 's1', rating_delta: 1, notes: null, created_at: daysAgo(0), ...overrides };
}
function gapProfile(o: Partial<GapProfile> = {}): GapProfile {
  return { hasHistory: true, lastGapDays: 2, avgGapDays: 3, gapHistory: [3, 3], trend: 'stable', observation: null, ...o };
}
function rhythmProfile(o: Partial<RhythmStability> = {}): RhythmStability {
  return { weeklyVariance: 0, avgWeeklySessions: 2, trajectory: 'stable', observation: null, ...o };
}

describe('computeGapProfile', () => {
  test('no completed sessions → no history', () => {
    const g = computeGapProfile([], NOW);
    expect(g.hasHistory).toBe(false);
    expect(g.trend).toBe('insufficient_data');
    expect(g.gapHistory).toEqual([]);
  });

  test('computes intervals, average, last gap, and a shrinking trend', () => {
    const sessions = [
      session({ created_at: daysAgo(40) }),
      session({ created_at: daysAgo(30) }),
      session({ created_at: daysAgo(22) }),
      session({ created_at: daysAgo(16) }),
      session({ created_at: daysAgo(12) }),
    ];
    const g = computeGapProfile(sessions, NOW);
    expect(g.hasHistory).toBe(true);
    expect(g.gapHistory).toEqual([10, 8, 6, 4]);
    expect(g.avgGapDays).toBe(7);
    expect(g.lastGapDays).toBe(12);
    expect(g.trend).toBe('shrinking');
  });

  test('ignores abandoned sessions', () => {
    const sessions = [
      session({ created_at: daysAgo(10), status: 'completed' }),
      session({ created_at: daysAgo(5), status: 'abandoned' }),
    ];
    const g = computeGapProfile(sessions, NOW);
    expect(g.gapHistory).toEqual([]); // only one completed session → no intervals
    expect(g.lastGapDays).toBe(10);
  });
});

// Factories above are reused by later tasks in this file.
export { session, checkIn, rating, gapProfile, rhythmProfile, daysAgo, NOW };
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- behavioral`
Expected: FAIL — `Cannot find module '../src/domain/behavioral/gaps'`.

- [ ] **Step 4: Implement `gaps.ts`**

`src/domain/behavioral/gaps.ts`:

```ts
import type { Session } from '@/types';
import type { GapProfile } from './types';

const DAY_MS = 86_400_000;

function daysBetween(earlier: number, later: number): number {
  return Math.max(0, Math.floor((later - earlier) / DAY_MS));
}

export function computeGapProfile(sessions: Session[], now: Date = new Date()): GapProfile {
  const completed = sessions
    .filter((s) => s.status === 'completed')
    .map((s) => new Date(s.created_at).getTime())
    .sort((a, b) => a - b);

  if (completed.length === 0) {
    return { hasHistory: false, lastGapDays: 0, avgGapDays: 0, gapHistory: [], trend: 'insufficient_data', observation: null };
  }

  const intervals: number[] = [];
  for (let i = 1; i < completed.length; i++) {
    intervals.push(daysBetween(completed[i - 1]!, completed[i]!));
  }

  const gapHistory = intervals.slice(-5);
  const avgGapDays = intervals.length
    ? Math.round((intervals.reduce((a, b) => a + b, 0) / intervals.length) * 10) / 10
    : 0;
  const lastGapDays = daysBetween(completed[completed.length - 1]!, now.getTime());

  let trend: GapProfile['trend'] = 'insufficient_data';
  let observation: string | null = null;

  if (intervals.length >= 3) {
    const half = Math.floor(intervals.length / 2);
    const earlier = intervals.slice(0, half);
    const recent = intervals.slice(intervals.length - half);
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const earlierAvg = avg(earlier);
    const recentAvg = avg(recent);
    const tolerance = Math.max(1, earlierAvg * 0.15);

    if (recentAvg < earlierAvg - tolerance) {
      trend = 'shrinking';
      observation = 'Your gaps between sessions are shrinking.';
    } else if (recentAvg > earlierAvg + tolerance) {
      trend = 'growing';
      observation = 'Your gaps between sessions have been growing — no judgment, just noticing.';
    } else {
      trend = 'stable';
      observation = 'Your rhythm between sessions is holding steady.';
    }
  }

  return { hasHistory: true, lastGapDays, avgGapDays, gapHistory, trend, observation };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- behavioral`
Expected: PASS (3 tests in `computeGapProfile`).

- [ ] **Step 6: Commit**

```bash
git add src/domain/behavioral/types.ts src/domain/behavioral/gaps.ts __tests__/behavioral.test.ts
git commit -m "feat(behavioral): gap profile computation + types"
```

---

### Task 2: Rhythm stability

**Files:**
- Create: `src/domain/behavioral/rhythm.ts`
- Test: `__tests__/behavioral.test.ts` (append)

**Interfaces:**
- Consumes: factories `session`, `daysAgo`, `NOW` from Task 1's test file.
- Produces: `computeRhythm(sessions: Session[], now?: Date): RhythmStability`.

- [ ] **Step 1: Append the failing test**

Add to `__tests__/behavioral.test.ts` (add the import at the top alongside the others):

```ts
import { computeRhythm } from '../src/domain/behavioral/rhythm';
```

```ts
describe('computeRhythm', () => {
  test('no sessions → insufficient_data', () => {
    const r = computeRhythm([], NOW);
    expect(r.trajectory).toBe('insufficient_data');
    expect(r.avgWeeklySessions).toBe(0);
  });

  test('steady 2/week across 4 weeks → stable, zero variance', () => {
    const sessions = [1, 3, 8, 10, 15, 17, 22, 24].map((d) => session({ created_at: daysAgo(d) }));
    const r = computeRhythm(sessions, NOW);
    expect(r.avgWeeklySessions).toBe(2);
    expect(r.weeklyVariance).toBe(0);
    expect(r.trajectory).toBe('stable');
  });

  test('activity after an empty week → rebuilding', () => {
    const sessions = [1, 20, 22].map((d) => session({ created_at: daysAgo(d) }));
    const r = computeRhythm(sessions, NOW);
    expect(r.trajectory).toBe('rebuilding');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- behavioral`
Expected: FAIL — `Cannot find module '../src/domain/behavioral/rhythm'`.

- [ ] **Step 3: Implement `rhythm.ts`**

`src/domain/behavioral/rhythm.ts`:

```ts
import type { Session } from '@/types';
import type { RhythmStability } from './types';

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;
const WEEKS_WINDOW = 8;

export function computeRhythm(sessions: Session[], now: Date = new Date()): RhythmStability {
  const completed = sessions
    .filter((s) => s.status === 'completed')
    .map((s) => new Date(s.created_at).getTime())
    .sort((a, b) => a - b);

  if (completed.length === 0) {
    return { weeklyVariance: 0, avgWeeklySessions: 0, trajectory: 'insufficient_data', observation: null };
  }

  const nowMs = now.getTime();
  const firstMs = completed[0]!;
  const weeksSpan = Math.min(WEEKS_WINDOW, Math.floor((nowMs - firstMs) / WEEK_MS) + 1);
  const counts: number[] = new Array(Math.max(1, weeksSpan)).fill(0);

  for (const t of completed) {
    const weeksAgo = Math.floor((nowMs - t) / WEEK_MS); // 0 = current week
    if (weeksAgo < counts.length) counts[counts.length - 1 - weeksAgo] += 1; // newest at end
  }

  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  const weeklyVariance = Math.round((counts.reduce((a, c) => a + (c - mean) ** 2, 0) / counts.length) * 100) / 100;
  const avgWeeklySessions = Math.round(mean * 10) / 10;

  let trajectory: RhythmStability['trajectory'] = 'insufficient_data';
  let observation: string | null = null;

  if (counts.length >= 2) {
    const n = counts.length;
    const lastWeek = counts[n - 1]!;
    const prevWeek = counts[n - 2]!;
    const half = Math.floor(n / 2);
    const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
    const firstHalfAvg = avg(counts.slice(0, half));
    const secondHalfAvg = avg(counts.slice(half));

    if (prevWeek === 0 && lastWeek > 0) {
      trajectory = 'rebuilding';
      observation = "You're rebuilding your rhythm. Welcome back.";
    } else if (weeklyVariance <= 0.5) {
      trajectory = 'stable';
      observation = 'Your weekly rhythm is steady.';
    } else if (secondHalfAvg > firstHalfAvg) {
      trajectory = 'stabilizing';
      observation = 'Your rhythm is becoming more consistent.';
    } else if (secondHalfAvg < firstHalfAvg) {
      trajectory = 'fragmenting';
      observation = "Your rhythm has loosened lately — that's okay.";
    } else {
      trajectory = 'stable';
      observation = 'Your weekly rhythm is steady.';
    }
  }

  return { weeklyVariance, avgWeeklySessions, trajectory, observation };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- behavioral`
Expected: PASS (all `computeGapProfile` + `computeRhythm` tests).

- [ ] **Step 5: Commit**

```bash
git add src/domain/behavioral/rhythm.ts __tests__/behavioral.test.ts
git commit -m "feat(behavioral): weekly rhythm stability computation"
```

---

### Task 3: Recovery state

**Files:**
- Create: `src/domain/behavioral/recovery.ts`
- Test: `__tests__/behavioral.test.ts` (append)

**Interfaces:**
- Consumes: factories `session`, `checkIn`, `rating`, `gapProfile`, `rhythmProfile`, `daysAgo` from Task 1.
- Produces: `computeRecovery(sessions: Session[], checkIns: CheckIn[], ratings: PostRating[], gaps: GapProfile, rhythm: RhythmStability): RecoveryState`.

- [ ] **Step 1: Append the failing test**

Add import at top: `import { computeRecovery } from '../src/domain/behavioral/recovery';`

```ts
describe('computeRecovery', () => {
  test('long gap + low energy → collapse', () => {
    const r = computeRecovery([], [checkIn({ energy_score: 1 })], [], gapProfile({ lastGapDays: 12 }), rhythmProfile());
    expect(r.isMotivationalCollapse).toBe(true);
    expect(r.signal).toBe('collapse');
  });

  test('two consecutive abandons + gap > 7 → spiral', () => {
    const sessions = [
      session({ created_at: daysAgo(2), status: 'abandoned' }),
      session({ created_at: daysAgo(4), status: 'abandoned' }),
      session({ created_at: daysAgo(20), status: 'completed' }),
    ];
    const r = computeRecovery(sessions, [checkIn({ energy_score: 3 })], [], gapProfile({ lastGapDays: 8 }), rhythmProfile());
    expect(r.isAvoidanceSpiral).toBe(true);
    expect(r.signal).toBe('spiral');
  });

  test('no history → returning', () => {
    const r = computeRecovery([], [], [], gapProfile({ hasHistory: false }), rhythmProfile({ trajectory: 'insufficient_data' }));
    expect(r.signal).toBe('returning');
  });

  test('steady rhythm + positive ratings → thriving', () => {
    const r = computeRecovery(
      [], [checkIn({ energy_score: 4, sleep_quality: 'good' })], [rating({ rating_delta: 2 }), rating({ rating_delta: 1 })],
      gapProfile({ lastGapDays: 3, trend: 'stable' }),
      rhythmProfile({ trajectory: 'stable', avgWeeklySessions: 3 }),
    );
    expect(r.signal).toBe('thriving');
    expect(r.reEntryReadiness).toBe('high');
  });

  test('repeated low energy + fragmenting → burnout_risk', () => {
    const lows = [checkIn({ energy_score: 2 }), checkIn({ energy_score: 1 }), checkIn({ energy_score: 2 })];
    const r = computeRecovery([], lows, [], gapProfile({ lastGapDays: 4 }), rhythmProfile({ trajectory: 'fragmenting' }));
    expect(r.isBurnoutRisk).toBe(true);
    expect(r.signal).toBe('burnout_risk');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- behavioral`
Expected: FAIL — `Cannot find module '../src/domain/behavioral/recovery'`.

- [ ] **Step 3: Implement `recovery.ts`**

`src/domain/behavioral/recovery.ts`:

```ts
import type { Session, CheckIn, PostRating } from '@/types';
import type { GapProfile, RhythmStability, RecoveryState } from './types';

export function computeRecovery(
  sessions: Session[],
  checkIns: CheckIn[],
  ratings: PostRating[],
  gaps: GapProfile,
  rhythm: RhythmStability,
): RecoveryState {
  const byNewest = <T extends { created_at: string }>(xs: T[]) =>
    [...xs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const checkInsDesc = byNewest(checkIns);
  const latest = checkInsDesc[0] ?? null;
  const recentCheckIns = checkInsDesc.slice(0, 5);
  const lowEnergyCount = recentCheckIns.filter((c) => c.energy_score <= 2).length;
  const poorSleepCount = recentCheckIns.filter((c) => c.sleep_quality === 'poor').length;

  // Consecutive abandoned sessions among the most recent, before any completion.
  let consecutiveAbandoned = 0;
  for (const s of byNewest(sessions)) {
    if (s.status === 'abandoned') consecutiveAbandoned++;
    else if (s.status === 'completed') break;
  }

  const isMotivationalCollapse = gaps.lastGapDays > 10 && latest != null && latest.energy_score <= 2;
  const isAvoidanceSpiral = consecutiveAbandoned >= 2 && gaps.lastGapDays > 7;
  const isBurnoutRisk = lowEnergyCount >= 3 && (rhythm.trajectory === 'fragmenting' || poorSleepCount >= 2);

  let reEntryReadiness: RecoveryState['reEntryReadiness'] = 'medium';
  if (latest) {
    if (latest.energy_score >= 4 && latest.sleep_quality === 'good') reEntryReadiness = 'high';
    else if (latest.energy_score <= 2 || latest.sleep_quality === 'poor') reEntryReadiness = 'low';
  }

  const recentRatings = byNewest(ratings).slice(0, 5);
  const avgRatingDelta = recentRatings.length
    ? recentRatings.reduce((a, r) => a + r.rating_delta, 0) / recentRatings.length
    : 0;

  const lastInterval = gaps.gapHistory.length ? gaps.gapHistory[gaps.gapHistory.length - 1]! : 0;
  const justReturned = lastInterval > 3 && gaps.lastGapDays <= 2;

  let signal: RecoveryState['signal'];
  if (isMotivationalCollapse) signal = 'collapse';
  else if (isAvoidanceSpiral) signal = 'spiral';
  else if (isBurnoutRisk) signal = 'burnout_risk';
  else if (!gaps.hasHistory || justReturned) signal = 'returning';
  else if (
    (rhythm.trajectory === 'stable' || rhythm.trajectory === 'stabilizing') &&
    rhythm.avgWeeklySessions >= 2 &&
    avgRatingDelta > 0
  ) signal = 'thriving';
  else signal = 'stable';

  return { signal, isMotivationalCollapse, isAvoidanceSpiral, isBurnoutRisk, reEntryReadiness };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- behavioral`
Expected: PASS (all prior + 5 `computeRecovery` tests).

- [ ] **Step 5: Commit**

```bash
git add src/domain/behavioral/recovery.ts __tests__/behavioral.test.ts
git commit -m "feat(behavioral): behavioral recovery-state inference"
```

---

### Task 4: Self-efficacy wins

**Files:**
- Create: `src/domain/behavioral/wins.ts`
- Test: `__tests__/behavioral.test.ts` (append)

**Interfaces:**
- Consumes: factories `session`, `gapProfile`, `rhythmProfile`, `daysAgo`, `NOW` from Task 1.
- Produces: `detectWins(sessions: Session[], gaps: GapProfile, rhythm: RhythmStability, now?: Date): SelfEfficacyWin[]`.

- [ ] **Step 1: Append the failing test**

Add import: `import { detectWins } from '../src/domain/behavioral/wins';`

```ts
describe('detectWins', () => {
  test('most recent gap below average → faster_return', () => {
    const wins = detectWins(
      [session({ created_at: daysAgo(1) })],
      gapProfile({ avgGapDays: 7, gapHistory: [9, 8, 4] }),
      rhythmProfile({ trajectory: 'fragmenting' }),
      NOW,
    );
    expect(wins.some((w) => w.type === 'faster_return')).toBe(true);
  });

  test('completed an overloaded session recently → difficult_week_log', () => {
    const wins = detectWins(
      [session({ created_at: daysAgo(3), state: 'overloaded', status: 'completed' })],
      gapProfile({ trend: 'stable' }),
      rhythmProfile({ trajectory: 'fragmenting' }),
      NOW,
    );
    expect(wins.some((w) => w.type === 'difficult_week_log')).toBe(true);
  });

  test('caps at 3 wins, most recent first', () => {
    const wins = detectWins(
      [session({ created_at: daysAgo(2), state: 'overloaded' })],
      gapProfile({ avgGapDays: 7, gapHistory: [9, 4], trend: 'shrinking' }),
      rhythmProfile({ trajectory: 'stabilizing' }),
      NOW,
    );
    expect(wins.length).toBeLessThanOrEqual(3);
  });

  test('no signals → no wins', () => {
    const wins = detectWins([], gapProfile({ hasHistory: false, gapHistory: [], avgGapDays: 0, trend: 'insufficient_data' }), rhythmProfile({ trajectory: 'fragmenting' }), NOW);
    expect(wins).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- behavioral`
Expected: FAIL — `Cannot find module '../src/domain/behavioral/wins'`.

- [ ] **Step 3: Implement `wins.ts`**

`src/domain/behavioral/wins.ts`:

```ts
import type { Session } from '@/types';
import type { GapProfile, RhythmStability, SelfEfficacyWin } from './types';

const DAY_MS = 86_400_000;
const RECENT_WINDOW_DAYS = 14;

interface DatedWin extends SelfEfficacyWin {
  at: number; // event epoch ms, for recency ordering
}

export function detectWins(
  sessions: Session[],
  gaps: GapProfile,
  rhythm: RhythmStability,
  now: Date = new Date(),
): SelfEfficacyWin[] {
  const nowMs = now.getTime();
  const completed = sessions
    .filter((s) => s.status === 'completed')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const lastCompletedMs = completed.length
    ? new Date(completed[completed.length - 1]!.created_at).getTime()
    : 0;

  const wins: DatedWin[] = [];
  const lastInterval = gaps.gapHistory.length ? gaps.gapHistory[gaps.gapHistory.length - 1]! : null;

  if (gaps.hasHistory && lastInterval != null && gaps.avgGapDays > 0 && lastInterval < gaps.avgGapDays) {
    wins.push({ type: 'faster_return', observation: 'You came back faster than your usual rhythm. That counts.', at: lastCompletedMs });
  }

  const recentOverloaded = completed
    .filter((s) => s.state === 'overloaded')
    .filter((s) => nowMs - new Date(s.created_at).getTime() <= RECENT_WINDOW_DAYS * DAY_MS);
  if (recentOverloaded.length) {
    const at = new Date(recentOverloaded[recentOverloaded.length - 1]!.created_at).getTime();
    wins.push({ type: 'difficult_week_log', observation: "You showed up for movement even on an overloaded day. That's real strength.", at });
  }

  if (gaps.trend === 'shrinking') {
    wins.push({ type: 'gap_shrinking', observation: "The space between your sessions is shrinking — you're returning more easily.", at: lastCompletedMs });
  }

  if (rhythm.trajectory === 'stabilizing' || rhythm.trajectory === 'stable') {
    wins.push({ type: 'rhythm_stabilizing', observation: 'Your weekly rhythm is finding its footing.', at: lastCompletedMs });
  }

  return wins
    .sort((a, b) => b.at - a.at)
    .slice(0, 3)
    .map(({ at, ...win }) => win);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- behavioral`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/behavioral/wins.ts __tests__/behavioral.test.ts
git commit -m "feat(behavioral): self-efficacy win detection"
```

---

### Task 5: Orchestrator

**Files:**
- Create: `src/domain/behavioral/index.ts`
- Test: `__tests__/behavioral.test.ts` (append)

**Interfaces:**
- Consumes: all four compute functions; factories from Task 1.
- Produces: `computeBehavioralProfile(sessions, checkIns, ratings, now?): BehavioralProfile`, and re-exports of all types/functions.

- [ ] **Step 1: Append the failing test**

Add import: `import { computeBehavioralProfile } from '../src/domain/behavioral';`

```ts
describe('computeBehavioralProfile', () => {
  test('assembles all four sub-profiles', () => {
    const sessions = [1, 8, 15, 22].map((d) => session({ created_at: daysAgo(d) }));
    const profile = computeBehavioralProfile(sessions, [checkIn()], [rating()], NOW);
    expect(profile).toHaveProperty('gaps');
    expect(profile).toHaveProperty('rhythm');
    expect(profile).toHaveProperty('recovery');
    expect(Array.isArray(profile.wins)).toBe(true);
    expect(profile.wins.length).toBeLessThanOrEqual(3);
  });

  test('empty inputs never throw and report no history', () => {
    const profile = computeBehavioralProfile([], [], [], NOW);
    expect(profile.gaps.hasHistory).toBe(false);
    expect(profile.recovery.signal).toBe('returning');
    expect(profile.wins).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- behavioral`
Expected: FAIL — `Cannot find module '../src/domain/behavioral'`.

- [ ] **Step 3: Implement `index.ts`**

`src/domain/behavioral/index.ts`:

```ts
import type { Session, CheckIn, PostRating } from '@/types';
import type { BehavioralProfile } from './types';
import { computeGapProfile } from './gaps';
import { computeRhythm } from './rhythm';
import { computeRecovery } from './recovery';
import { detectWins } from './wins';

export * from './types';
export { computeGapProfile } from './gaps';
export { computeRhythm } from './rhythm';
export { computeRecovery } from './recovery';
export { detectWins } from './wins';

export function computeBehavioralProfile(
  sessions: Session[],
  checkIns: CheckIn[],
  ratings: PostRating[],
  now: Date = new Date(),
): BehavioralProfile {
  const gaps = computeGapProfile(sessions, now);
  const rhythm = computeRhythm(sessions, now);
  const recovery = computeRecovery(sessions, checkIns, ratings, gaps, rhythm);
  const wins = detectWins(sessions, gaps, rhythm, now);
  return { gaps, rhythm, recovery, wins };
}
```

- [ ] **Step 4: Run test + full suite + typecheck**

Run: `npm test -- behavioral`
Expected: PASS (all behavioral tests).
Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/domain/behavioral/index.ts __tests__/behavioral.test.ts
git commit -m "feat(behavioral): computeBehavioralProfile orchestrator"
```

---

### Task 6: Copy + BehavioralBanner component

**Files:**
- Modify: `src/constants/copy.ts` (append `BEHAVIORAL_FALLBACK`)
- Create: `src/components/BehavioralBanner.tsx`
- Test: `__tests__/BehavioralBanner.test.tsx`

**Interfaces:**
- Consumes: `BehavioralProfile` from `@/domain/behavioral`; `Card` from `@/components/Card`; `colors`.
- Produces: `BehavioralBanner({ profile }: { profile: BehavioralProfile | null })`; `BEHAVIORAL_FALLBACK: Record<RecoverySignal, { message: string }>`.

- [ ] **Step 1: Add fallback copy**

Add this import at the **very top** of `src/constants/copy.ts` (before the existing `export const QUOTES`):

```ts
import type { RecoverySignal } from '@/domain/behavioral/types';
```

Then append the constant at the **end** of `src/constants/copy.ts`:

```ts
export const BEHAVIORAL_FALLBACK: Record<RecoverySignal, { message: string }> = {
  returning: { message: "Glad you're here. Whenever you're ready, we'll meet you where you are." },
  collapse: { message: "It's been a little while — and that's completely okay. One gentle check-in is enough." },
  spiral: { message: 'No pressure today. Even opening the app is a step. We keep it light.' },
  burnout_risk: { message: 'Your body might be asking for rest. A short, soft session is more than enough.' },
  thriving: { message: "You've found a beautiful rhythm. Keep listening to your body." },
  stable: { message: "Steady and kind. You're showing up for yourself." },
};
```

- [ ] **Step 2: Write the failing render test**

Create `__tests__/BehavioralBanner.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { BehavioralBanner } from '../src/components/BehavioralBanner';
import type { BehavioralProfile } from '../src/domain/behavioral';

const base: BehavioralProfile = {
  gaps: { hasHistory: true, lastGapDays: 2, avgGapDays: 3, gapHistory: [3, 2], trend: 'shrinking', observation: 'Your gaps between sessions are shrinking.' },
  rhythm: { weeklyVariance: 0, avgWeeklySessions: 2, trajectory: 'stable', observation: 'Your weekly rhythm is steady.' },
  recovery: { signal: 'stable', isMotivationalCollapse: false, isAvoidanceSpiral: false, isBurnoutRisk: false, reEntryReadiness: 'medium' },
  wins: [{ type: 'gap_shrinking', observation: 'The space between your sessions is shrinking — you\'re returning more easily.' }],
};

describe('BehavioralBanner', () => {
  test('renders the top win as the dominant message', () => {
    const { getByText } = render(<BehavioralBanner profile={base} />);
    expect(getByText(/space between your sessions is shrinking/i)).toBeTruthy();
  });

  test('falls back to recovery-signal copy when there are no wins', () => {
    const noWins: BehavioralProfile = { ...base, wins: [], recovery: { ...base.recovery, signal: 'returning' } };
    const { getByText } = render(<BehavioralBanner profile={noWins} />);
    expect(getByText(/Glad you're here/i)).toBeTruthy();
  });

  test('renders nothing when profile is null', () => {
    const { toJSON } = render(<BehavioralBanner profile={null} />);
    expect(toJSON()).toBeNull();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- BehavioralBanner`
Expected: FAIL — `Cannot find module '../src/components/BehavioralBanner'`.

- [ ] **Step 4: Implement `BehavioralBanner.tsx`**

`src/components/BehavioralBanner.tsx`:

```tsx
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Card } from '@/components/Card';
import { colors } from '@/constants/colors';
import { BEHAVIORAL_FALLBACK } from '@/constants/copy';
import type { BehavioralProfile } from '@/domain/behavioral';

export function BehavioralBanner({ profile }: { profile: BehavioralProfile | null }) {
  if (!profile) return null;

  const topWin = profile.wins[0] ?? null;
  const message = topWin ? topWin.observation : BEHAVIORAL_FALLBACK[profile.recovery.signal].message;
  const insight = profile.gaps.observation ?? profile.rhythm.observation ?? null;

  return (
    <Card style={styles.card} testID="behavioral-banner">
      <Text style={styles.message}>{message}</Text>
      {insight ? <Text style={styles.insight}>{insight}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.sageLight,
    borderColor: colors.sageMid,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  message: { fontSize: 15, fontWeight: '600', color: colors.sageDark, lineHeight: 20 },
  insight: { fontSize: 12, color: colors.muted, marginTop: 6, lineHeight: 16 },
});
```

> Note: confirm `Card` accepts a `style` prop and renders children. `HomeScreen.tsx` already uses `<Card style={...}>...children...</Card>`, so this matches the existing contract.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- BehavioralBanner`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/constants/copy.ts src/components/BehavioralBanner.tsx __tests__/BehavioralBanner.test.tsx
git commit -m "feat(behavioral): fallback copy + BehavioralBanner component"
```

---

### Task 7: Data hook + Home Screen wiring

**Files:**
- Create: `src/hooks/useBehavioralProfile.ts`
- Modify: `src/screens/main/HomeScreen.tsx`

**Interfaces:**
- Consumes: `computeBehavioralProfile`, `BehavioralProfile` from `@/domain/behavioral`; `supabase`; `BehavioralBanner`.
- Produces: `useBehavioralProfile(): { profile: BehavioralProfile | null; loading: boolean }`.

- [ ] **Step 1: Implement the hook**

`src/hooks/useBehavioralProfile.ts`:

```ts
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/services/supabase';
import { computeBehavioralProfile, type BehavioralProfile } from '@/domain/behavioral';
import type { Session, CheckIn, PostRating } from '@/types';

const WINDOW_DAYS = 90;
const MAX_ROWS = 200;

export function useBehavioralProfile(): { profile: BehavioralProfile | null; loading: boolean } {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [ratings, setRatings] = useState<PostRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (active) setLoading(false);
          return;
        }
        const sinceIso = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();
        const [sessRes, ciRes, prRes] = await Promise.all([
          supabase.from('sessions').select('*').eq('user_id', user.id)
            .in('status', ['completed', 'abandoned']).gte('created_at', sinceIso)
            .order('created_at', { ascending: false }).limit(MAX_ROWS),
          supabase.from('check_ins').select('*').eq('user_id', user.id)
            .gte('created_at', sinceIso).order('created_at', { ascending: false }).limit(MAX_ROWS),
          // post_ratings has no user_id column; RLS scopes rows to the user's own sessions.
          supabase.from('post_ratings').select('*')
            .gte('created_at', sinceIso).order('created_at', { ascending: false }).limit(MAX_ROWS),
        ]);
        if (!active) return;
        setSessions((sessRes.data as Session[]) ?? []);
        setCheckIns((ciRes.data as CheckIn[]) ?? []);
        setRatings((prRes.data as PostRating[]) ?? []);
      } catch {
        // graceful empty state — leave arrays empty
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const profile = useMemo(
    () => computeBehavioralProfile(sessions, checkIns, ratings),
    [sessions, checkIns, ratings],
  );

  return { profile, loading };
}
```

- [ ] **Step 2: Wire the banner into HomeScreen**

In `src/screens/main/HomeScreen.tsx`:

Add imports near the other component imports (after line 15):

```tsx
import { BehavioralBanner } from '@/components/BehavioralBanner';
import { useBehavioralProfile } from '@/hooks/useBehavioralProfile';
```

Add the hook call inside the component, after the existing `loading` selector (after line 27):

```tsx
  const { profile: behavioralProfile } = useBehavioralProfile();
```

Replace the "no check-in yet" branch (currently lines 63-65):

```tsx
    if (!currentCheckIn) {
      return <CheckInFlow />;
    }
```

with:

```tsx
    if (!currentCheckIn) {
      return (
        <View style={{ gap: 12 }}>
          <BehavioralBanner profile={behavioralProfile} />
          <CheckInFlow />
        </View>
      );
    }
```

- [ ] **Step 3: Run the full suite + typecheck**

Run: `npm test`
Expected: PASS (existing + behavioral + banner suites).
Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 4: Manual verification (documented, no code)**

The hook performs network I/O so it isn't unit-tested. Verify behavior manually:
- New account / no history → banner shows the gentle "Glad you're here" welcome above the check-in.
- Account with completed sessions whose gaps are shrinking → banner leads with the "space between your sessions is shrinking" win.
Note this in the commit body.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useBehavioralProfile.ts src/screens/main/HomeScreen.tsx
git commit -m "feat(behavioral): useBehavioralProfile hook + Home Screen banner

Banner renders above the check-in CTA for the no-check-in-yet state.
Manually verified: empty-history welcome and gap-shrinking win surfaces."
```

---

## Notes for the implementer

- Run all behavioral tests with `npm test -- behavioral` and the banner test with `npm test -- BehavioralBanner` for fast feedback; run the full `npm test` before the final commit.
- Keep `src/domain/behavioral/**` free of React/Supabase imports — the unit tests depend on it staying pure.
- If `npm test -- behavioral` fails to resolve `@/types` inside the behavioral source files, confirm `babel-plugin-module-resolver` is active (it is, via `babel.config.js`); the existing `composer.ts` uses the same `@/types` import successfully.
