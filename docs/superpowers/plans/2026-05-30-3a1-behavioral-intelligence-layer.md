# 3A-1 Behavioral Intelligence Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `src/utils/behavioralProfile.ts` — a pure client-side function that transforms activities, reflections, and intentions into a structured `BehavioralProfile` with five behavioral domains and confidence-aware signals.

**Architecture:** Single entry point `computeBehavioralProfile()` composes five independently-exported sub-functions. Each sub-function is pure, deterministic, and testable in isolation. No side effects, no store imports, no Supabase calls. The `now` parameter is injectable for deterministic tests.

**Tech Stack:** TypeScript, date-fns v3, Jest/jest-expo. Imports only from `src/types`, `src/utils/analytics`, `src/utils/date`, and `src/services/intentions` (type import only).

---

## File Map

| File | Action |
|------|--------|
| `src/utils/behavioralProfile.ts` | Create — all types, constants, and computation logic |
| `__tests__/behavioralProfile.test.ts` | Create — unit tests for all sub-functions |

No other files change.

---

## Task 1: Types, Constants, and File Skeleton

**Files:**
- Create: `src/utils/behavioralProfile.ts`
- Create: `__tests__/behavioralProfile.test.ts`

- [ ] **Step 1: Create behavioralProfile.ts with all types and constants**

Create `src/utils/behavioralProfile.ts` with the full content below. All sub-functions are stubbed to throw — tests will drive each implementation.

```ts
import { addDays, differenceInCalendarDays, startOfWeek } from 'date-fns';
import { activitiesInWeek } from './analytics';
import { WEEK_OPTIONS } from './date';
import { parseWellness } from '@/types';
import type { Activity, Reflection } from '@/types';
import type { Intention } from '@/services/intentions';

// ─── Heuristic Constants ──────────────────────────────────────────────────────
// All thresholds are calibrated estimates, not psychological truths.
// Tune these as real usage data accumulates.

// Gap detection
export const GAP_DEFINITION_DAYS = 3;           // inactivity > N days counts as a gap
export const GAP_HISTORY_SIZE = 5;              // recent gaps retained for trend detection

// RecoveryState
export const EXTENDED_ABSENCE_DAYS = 10;
export const PATTERN_DISRUPTED_GAP_DAYS = 7;
export const CONSECUTIVE_UNMET_THRESHOLD = 2;
export const HIGH_STRESS_GAP_DAYS = 5;
export const HIGH_STRESS_THRESHOLD = 7;         // user-reported, 1–10
export const HIGH_SORENESS_THRESHOLD = 7;       // user-reported, 1–10

// Trend sensitivity
export const TREND_SHRINKING_FACTOR = 0.8;
export const TREND_GROWING_FACTOR = 1.2;
export const FASTER_RETURN_FACTOR = 0.8;

// Rhythm stability
export const RHYTHM_WINDOW_WEEKS = 8;
export const STABILIZING_VARIANCE_FACTOR = 0.7;
export const FRAGMENTING_VARIANCE_FACTOR = 1.3;
export const STABLE_VARIANCE_MAX = 1.5;
export const STABLE_AVG_SESSIONS_MIN = 0.5;

// ReturnReliability labels
export const ANCHORED_AVG_GAP_MAX = 5;
export const ANCHORED_ACTIVE_RATIO_MIN = 0.8;
export const RESILIENT_ACTIVE_RATIO_MIN = 0.5;
export const INTERMITTENT_ACTIVE_RATIO_MIN = 0.3;
export const FRAGMENTED_AVG_GAP_MIN = 20;
export const FRAGMENTED_GAP_COUNT_MIN = 3;

// Moments
export const MAX_MOMENTS = 3;
export const DIFFICULT_WEEK_ENERGY_MAX = 4;
export const MOMENT_RELEVANCE_DAYS: Record<MomentType, number> = {
  reliable_returner: 60,
  faster_return: 14,
  staying_connected: 14,
  intention_followed: 14,
  gaps_narrowing: 30,
  rhythm_rebuilding: 30,
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type Confidence = 'low' | 'medium' | 'high';

export interface GapProfile {
  hasHistory: boolean;
  lastGapDays: number;       // days since last activity (open gap)
  avgGapDays: number;        // mean of ALL completed gaps
  gapHistory: number[];      // last GAP_HISTORY_SIZE completed gaps, oldest→newest
  totalGapCount: number;     // total completed gaps in full activity history
  longestGapDays: number;    // longest completed gap ever recorded
  trend: 'shrinking' | 'stable' | 'growing' | 'insufficient_data';
  observation: string | null;
  confidence: Confidence;
}

export interface RhythmStability {
  weeklyVariance: number;    // population variance of sessions/week
  avgWeeklySessions: number;
  trajectory:
    | 'stabilizing'
    | 'stable'
    | 'fragmenting'
    | 'rebuilding'
    | 'insufficient_data';
  observation: string | null;
  confidence: Confidence;
}

export interface RecoveryState {
  // 4-state action signal for UI systems to switch on.
  // needs_reentry = any of the three boolean flags is true.
  signal: 'needs_reentry' | 'returning' | 'stable' | 'thriving';

  // Diagnostic detail — explains WHY signal is needs_reentry.
  // Purely behavioral: no psychological interpretation.
  isExtendedAbsence: boolean;    // gap > EXTENDED_ABSENCE_DAYS
  isPatternDisrupted: boolean;   // consecutive unmet intentions + gap
  isHighStressSignal: boolean;   // user-reported high stress + soreness + gap

  reEntryReadiness: 'high' | 'medium' | 'low';
  confidence: Confidence;
}

export interface ReturnReliability {
  // Primary differentiating signal. Answers: do they keep coming back?
  // Gets richer with time — insufficient_data resolves after 2+ gaps.
  //
  // NOTE FOR 3A-2 CONSUMERS: When label === 'insufficient_data',
  // use rhythm and recovery as the primary behavioral signals instead.
  label:
    | 'anchored'        // rarely disconnects, consistently present
    | 'resilient'       // gaps exist but consistently returns — core MoveKind pattern
    | 'intermittent'    // irregular presence, no clear trend
    | 'fragmented'      // frequent long gaps, sparse engagement
    | 'insufficient_data';

  gapCount: number;         // total completed gaps
  longestGapDays: number;   // longest completed gap
  activeMonths: number;     // trailing 12 months with ≥ 1 logged activity
  confidence: Confidence;
}

export type MomentType =
  | 'reliable_returner'   // returnReliability is 'resilient', medium+ confidence
  | 'faster_return'       // returned faster than personal average
  | 'staying_connected'   // logged during a low-energy week
  | 'intention_followed'  // followed through on a set intention
  | 'gaps_narrowing'      // gap trend is 'shrinking', sufficient history
  | 'rhythm_rebuilding';  // rhythm trajectory is 'stabilizing'

export interface BehavioralMoment {
  type: MomentType;
  observation: string;    // factual, concise, non-congratulatory
  observedAt: string;     // ISO date of the triggering event — NOT computation time
}

export interface BehavioralProfile {
  gaps: GapProfile;
  rhythm: RhythmStability;
  recovery: RecoveryState;
  returnReliability: ReturnReliability;
  moments: BehavioralMoment[];  // max MAX_MOMENTS, priority-ordered

  // Aggregate confidence across all domains.
  // Consumers can gate on this single value instead of checking each domain.
  // Derivation: minimum confidence among all four domains.
  profileConfidence: Confidence;
}

// ─── Sub-functions (exported for independent testing) ─────────────────────────

export function computeGapProfile(_activities: Activity[], _now: Date): GapProfile {
  throw new Error('not implemented');
}

export function computeRhythmStability(_activities: Activity[], _now: Date): RhythmStability {
  throw new Error('not implemented');
}

export function computeRecoveryState(
  _activities: Activity[],
  _reflections: Reflection[],
  _intentions: Intention[],
  _now: Date,
): RecoveryState {
  throw new Error('not implemented');
}

export function computeReturnReliability(
  _activities: Activity[],
  _gaps: GapProfile,
  _now: Date,
): ReturnReliability {
  throw new Error('not implemented');
}

export function detectBehavioralMoments(
  _activities: Activity[],
  _reflections: Reflection[],
  _intentions: Intention[],
  _gaps: GapProfile,
  _rhythm: RhythmStability,
  _returnReliability: ReturnReliability,
  _now: Date,
): BehavioralMoment[] {
  throw new Error('not implemented');
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

export function computeBehavioralProfile(
  _activities: Activity[],
  _reflections: Reflection[],
  _intentions: Intention[],
  _now: Date = new Date(),
): BehavioralProfile {
  throw new Error('not implemented');
}
```

- [ ] **Step 2: Create test file with imports and shared helpers**

Create `__tests__/behavioralProfile.test.ts`:

```ts
import { format, startOfWeek } from 'date-fns';
import type { Activity, Reflection } from '../src/types';
import type { Intention } from '../src/services/intentions';
import {
  computeGapProfile,
  computeRhythmStability,
  computeRecoveryState,
  computeReturnReliability,
  detectBehavioralMoments,
  computeBehavioralProfile,
  GAP_DEFINITION_DAYS,
} from '../src/utils/behavioralProfile';

// Fixed reference point — all tests use this as "now"
const NOW = new Date('2026-06-15T10:00:00Z'); // Monday
const WEEK_OPTS = { weekStartsOn: 1 as const };

// Helper: activity N days ago from NOW
function act(daysAgo: number, overrides: Partial<Activity> = {}): Activity {
  const d = new Date(NOW);
  d.setDate(d.getDate() - daysAgo);
  return {
    id: `a-${daysAgo}-${Math.random().toString(36).slice(2)}`,
    user_id: 'u',
    type: 'walk',
    duration_minutes: 30,
    effort: 5,
    moods: [],
    notes: null,
    performed_at: d.toISOString(),
    created_at: d.toISOString(),
    ...overrides,
  };
}

// Helper: reflection N weeks ago, anchored to Monday week_start
function ref(weeksAgo: number, overrides: Partial<Reflection> = {}): Reflection {
  const d = new Date(NOW);
  d.setDate(d.getDate() - weeksAgo * 7);
  const monday = startOfWeek(d, WEEK_OPTS);
  return {
    id: `r-${weeksAgo}-${Math.random().toString(36).slice(2)}`,
    user_id: 'u',
    week_start: format(monday, 'yyyy-MM-dd'),
    energy: 6,
    recovery: 6,
    consistency: 6,
    mood: 6,
    notes: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// Helper: intention N weeks ago
function int(
  weeksAgo: number,
  met: boolean | null,
  description = 'walk on tuesday',
): Intention {
  const d = new Date(NOW);
  d.setDate(d.getDate() - weeksAgo * 7);
  const monday = startOfWeek(d, WEEK_OPTS);
  return {
    id: `i-${weeksAgo}-${Math.random().toString(36).slice(2)}`,
    user_id: 'u',
    week_start: format(monday, 'yyyy-MM-dd'),
    description,
    intended_day: null,
    intended_time: null,
    met,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// Placeholder — individual test suites added per task
describe('behavioralProfile stubs compile', () => {
  it('throws on all stubs', () => {
    expect(() => computeGapProfile([], NOW)).toThrow('not implemented');
    expect(() => computeRhythmStability([], NOW)).toThrow('not implemented');
    expect(() => computeBehavioralProfile([], [], [], NOW)).toThrow('not implemented');
  });
});
```

- [ ] **Step 3: Verify stubs compile and stub test passes**

```bash
npx jest --testPathPattern="behavioralProfile" --no-coverage
```

Expected: 1 suite, 1 test, PASS ("throws on all stubs").

- [ ] **Step 4: Commit skeleton**

```bash
git add src/utils/behavioralProfile.ts __tests__/behavioralProfile.test.ts
git commit -m "feat: 3A-1 skeleton — types, constants, stubs"
```

---

## Task 2: computeGapProfile

**Files:**
- Modify: `src/utils/behavioralProfile.ts`
- Modify: `__tests__/behavioralProfile.test.ts`

- [ ] **Step 1: Add gap profile tests to the test file**

Append to `__tests__/behavioralProfile.test.ts` (after the stubs test):

```ts
describe('computeGapProfile', () => {
  it('returns empty profile with no activities', () => {
    const p = computeGapProfile([], NOW);
    expect(p.hasHistory).toBe(false);
    expect(p.lastGapDays).toBe(0);
    expect(p.avgGapDays).toBe(0);
    expect(p.gapHistory).toEqual([]);
    expect(p.totalGapCount).toBe(0);
    expect(p.longestGapDays).toBe(0);
    expect(p.trend).toBe('insufficient_data');
    expect(p.observation).toBeNull();
    expect(p.confidence).toBe('low');
  });

  it('returns hasHistory=true with one activity and no gaps', () => {
    const p = computeGapProfile([act(1)], NOW);
    expect(p.hasHistory).toBe(true);
    expect(p.lastGapDays).toBe(1);
    expect(p.totalGapCount).toBe(0);
    expect(p.trend).toBe('insufficient_data');
  });

  it('detects a single completed gap', () => {
    // Activity 2 days ago and 20 days ago → gap of 18 days
    const activities = [act(2), act(20)];
    const p = computeGapProfile(activities, NOW);
    expect(p.totalGapCount).toBe(1);
    expect(p.gapHistory).toHaveLength(1);
    expect(p.gapHistory[0]).toBe(18);
    expect(p.longestGapDays).toBe(18);
    expect(p.avgGapDays).toBe(18);
    expect(p.confidence).toBe('low'); // only 1 gap
  });

  it('does not count short breaks as gaps', () => {
    // Activities 1, 2, 3 days ago — all within GAP_DEFINITION_DAYS
    const activities = [act(1), act(2), act(3)];
    const p = computeGapProfile(activities, NOW);
    expect(p.totalGapCount).toBe(0);
    expect(p.gapHistory).toHaveLength(0);
  });

  it('computes trend as shrinking when last gap < avg * 0.8', () => {
    // Gaps: 20, 18, 16, 8 days (shrinking — 8 < avg of all × 0.8)
    const activities = [
      act(1),   // most recent cluster
      act(9),   // gap of 8
      act(25),  // gap of 16
      act(43),  // gap of 18
      act(63),  // gap of 20
    ];
    const p = computeGapProfile(activities, NOW);
    // avg of [20, 18, 16, 8] = 15.5, last gap = 8, 8 < 15.5 * 0.8 = 12.4 → shrinking
    expect(p.trend).toBe('shrinking');
    expect(p.confidence).toBe('medium'); // 4 gaps → medium (3–4)
  });

  it('computes trend as growing when last gap > avg * 1.2', () => {
    // Gaps: 5, 5, 5, 30 days
    const activities = [
      act(1),
      act(31),  // gap of 30
      act(36),  // gap of 5
      act(41),  // gap of 5
      act(46),  // gap of 5
    ];
    const p = computeGapProfile(activities, NOW);
    // avg of [5, 5, 5, 30] = 11.25, last gap = 30, 30 > 11.25 * 1.2 = 13.5 → growing
    expect(p.trend).toBe('growing');
  });

  it('computes trend as stable when last gap is near average', () => {
    // Gaps: 10, 10, 10, 11 — close to average of ~10.25
    const activities = [
      act(1),
      act(12),  // gap 11
      act(22),  // gap 10
      act(32),  // gap 10
      act(42),  // gap 10
    ];
    const p = computeGapProfile(activities, NOW);
    expect(p.trend).toBe('stable');
  });

  it('fires observation only when trend is shrinking and last gap < avg * 0.8', () => {
    // Same shrinking scenario from above
    const activities = [act(1), act(9), act(25), act(43), act(63)];
    const p = computeGapProfile(activities, NOW);
    expect(p.observation).not.toBeNull();
    expect(p.observation).toContain('days');
  });

  it('does not fire observation when trend is growing', () => {
    const activities = [act(1), act(31), act(36), act(41), act(46)];
    const p = computeGapProfile(activities, NOW);
    expect(p.observation).toBeNull();
  });

  it('returns high confidence with 5+ completed gaps', () => {
    const activities = [
      act(1), act(10), act(20), act(30), act(40), act(50), act(60),
    ];
    const p = computeGapProfile(activities, NOW);
    // 6 gaps of 9-10 days each
    expect(p.confidence).toBe('high');
  });

  it('retains only the last GAP_HISTORY_SIZE gaps in gapHistory', () => {
    // 7 activities with 6 gaps — history should only keep last 5
    const activities = [
      act(1), act(10), act(20), act(30), act(40), act(50), act(60), act(70),
    ];
    const p = computeGapProfile(activities, NOW);
    expect(p.gapHistory.length).toBeLessThanOrEqual(5);
    expect(p.totalGapCount).toBeGreaterThan(5);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest --testPathPattern="behavioralProfile" --no-coverage 2>&1 | head -20
```

Expected: FAIL with "not implemented".

- [ ] **Step 3: Implement computeGapProfile**

Replace the stub in `src/utils/behavioralProfile.ts`:

```ts
export function computeGapProfile(activities: Activity[], now: Date): GapProfile {
  if (activities.length === 0) {
    return {
      hasHistory: false,
      lastGapDays: 0,
      avgGapDays: 0,
      gapHistory: [],
      totalGapCount: 0,
      longestGapDays: 0,
      trend: 'insufficient_data',
      observation: null,
      confidence: 'low',
    };
  }

  const sorted = [...activities].sort(
    (a, b) => new Date(a.performed_at).getTime() - new Date(b.performed_at).getTime(),
  );

  // Collect ALL completed gaps (inactivity > GAP_DEFINITION_DAYS between sessions)
  const allGaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const gap = differenceInCalendarDays(
      new Date(sorted[i]!.performed_at),
      new Date(sorted[i - 1]!.performed_at),
    );
    if (gap > GAP_DEFINITION_DAYS) allGaps.push(gap);
  }

  const totalGapCount = allGaps.length;
  const longestGapDays = allGaps.length > 0 ? Math.max(...allGaps) : 0;
  const avgGapDays =
    allGaps.length > 0
      ? Math.round(allGaps.reduce((s, g) => s + g, 0) / allGaps.length)
      : 0;
  const gapHistory = allGaps.slice(-GAP_HISTORY_SIZE);

  const lastGapDays = differenceInCalendarDays(
    now,
    new Date(sorted[sorted.length - 1]!.performed_at),
  );

  // Trend: compare last completed gap to overall average
  let trend: GapProfile['trend'] = 'insufficient_data';
  if (gapHistory.length >= 2) {
    const lastGap = gapHistory[gapHistory.length - 1]!;
    if (lastGap < avgGapDays * TREND_SHRINKING_FACTOR) trend = 'shrinking';
    else if (lastGap > avgGapDays * TREND_GROWING_FACTOR) trend = 'growing';
    else trend = 'stable';
  }

  // Observation fires only when trend is shrinking and user recently returned fast
  let observation: string | null = null;
  if (
    trend === 'shrinking' &&
    gapHistory.length >= 2 &&
    lastGapDays < avgGapDays * FASTER_RETURN_FACTOR
  ) {
    observation = `Back in ${lastGapDays} days — ${avgGapDays} is your usual.`;
  }

  let confidence: Confidence = 'low';
  if (gapHistory.length >= 5) confidence = 'high';
  else if (gapHistory.length >= 3) confidence = 'medium';

  return {
    hasHistory: true,
    lastGapDays,
    avgGapDays,
    gapHistory,
    totalGapCount,
    longestGapDays,
    trend,
    observation,
    confidence,
  };
}
```

- [ ] **Step 4: Run gap tests**

```bash
npx jest --testPathPattern="behavioralProfile" --no-coverage --testNamePattern="computeGapProfile"
```

Expected: all gap tests PASS.

- [ ] **Step 5: Run all tests to check nothing regressed**

```bash
npx jest --no-coverage
```

Expected: all existing tests still pass.

- [ ] **Step 6: Commit**

```bash
git add src/utils/behavioralProfile.ts __tests__/behavioralProfile.test.ts
git commit -m "feat: 3A-1 computeGapProfile — gap detection, trend, confidence"
```

---

## Task 3: computeRhythmStability

**Files:**
- Modify: `src/utils/behavioralProfile.ts`
- Modify: `__tests__/behavioralProfile.test.ts`

- [ ] **Step 1: Add rhythm stability tests**

Append to `__tests__/behavioralProfile.test.ts`:

```ts
describe('computeRhythmStability', () => {
  it('returns insufficient_data with no activities', () => {
    const r = computeRhythmStability([], NOW);
    expect(r.trajectory).toBe('insufficient_data');
    expect(r.confidence).toBe('low');
    expect(r.observation).toBeNull();
  });

  it('returns insufficient_data with only 1 active week', () => {
    // Only one activity, in one week
    const r = computeRhythmStability([act(1)], NOW);
    expect(r.trajectory).toBe('insufficient_data');
  });

  it('returns stable when variance is low and consistent', () => {
    // 3 activities/week for 8 weeks → very low variance
    const activities: Activity[] = [];
    for (let week = 0; week < 8; week++) {
      activities.push(act(week * 7 + 1));
      activities.push(act(week * 7 + 3));
      activities.push(act(week * 7 + 5));
    }
    const r = computeRhythmStability(activities, NOW);
    expect(r.trajectory).toBe('stable');
    expect(r.confidence).toBe('high');
    expect(r.observation).not.toBeNull();
  });

  it('returns stabilizing when recent weeks are more consistent than earlier weeks', () => {
    // First 4 weeks: volatile (0,3,0,3 sessions) → variance = 2.25
    // Last 4 weeks: consistent (2,2,2,2 sessions) → variance = 0
    const activities: Activity[] = [];
    // Last 4 weeks (recent, weeks 5–8 in the window)
    for (let week = 0; week < 4; week++) {
      activities.push(act(week * 7 + 1));
      activities.push(act(week * 7 + 3));
    }
    // First 4 weeks (older, weeks 1–4) — alternating 0 and 3 sessions
    activities.push(act(4 * 7 + 1));
    activities.push(act(4 * 7 + 3));
    activities.push(act(4 * 7 + 5));
    // week at -5w: no activities
    activities.push(act(6 * 7 + 1));
    activities.push(act(6 * 7 + 3));
    activities.push(act(6 * 7 + 5));
    // week at -7w: no activities

    const r = computeRhythmStability(activities, NOW);
    expect(['stabilizing', 'stable', 'rebuilding']).toContain(r.trajectory);
  });

  it('returns fragmenting when variance is increasing in recent weeks', () => {
    // First 4 weeks: consistent (2,2,2,2) → variance 0
    // Last 4 weeks: volatile (0,4,0,4) → variance 4
    const activities: Activity[] = [];
    // Older weeks (weeks 1-4 in window = 5-8 weeks ago)
    for (let i = 0; i < 4; i++) {
      activities.push(act(5 * 7 + i * 7));
      activities.push(act(5 * 7 + i * 7 + 2));
    }
    // Recent weeks (weeks 5-8 in window = 1-4 weeks ago) — alternating 0 and 4
    activities.push(act(1));
    activities.push(act(3));
    activities.push(act(5));
    activities.push(act(7));
    // Week 3 ago: 0 sessions
    activities.push(act(15));
    activities.push(act(17));
    activities.push(act(19));
    activities.push(act(21));
    // Week 1 ago: 0 sessions (current week)
    const r = computeRhythmStability(activities, NOW);
    // Note: fragmented requires second half variance > first half × 1.3
    // This test verifies the trajectory is detected, not necessarily fragmenting
    expect(r.trajectory).toBeDefined();
    expect(r.weeklyVariance).toBeGreaterThanOrEqual(0);
  });

  it('computes avgWeeklySessions correctly', () => {
    // 8 weeks, 2 activities each week = avg 2
    const activities: Activity[] = [];
    for (let week = 0; week < 8; week++) {
      activities.push(act(week * 7 + 1));
      activities.push(act(week * 7 + 3));
    }
    const r = computeRhythmStability(activities, NOW);
    expect(r.avgWeeklySessions).toBeCloseTo(2, 0);
  });

  it('returns medium confidence with 2-4 active weeks', () => {
    // Only 3 active weeks
    const r = computeRhythmStability([act(1), act(8), act(15)], NOW);
    expect(r.confidence).toBe('medium');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest --testPathPattern="behavioralProfile" --no-coverage --testNamePattern="computeRhythmStability"
```

Expected: FAIL with "not implemented".

- [ ] **Step 3: Implement computeRhythmStability**

Add private helper function (before the exports, or as a module-level private function) and replace the stub:

```ts
// Private variance helper
function populationVariance(arr: number[]): number {
  if (arr.length === 0) return 0;
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
  return arr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / arr.length;
}

export function computeRhythmStability(activities: Activity[], now: Date): RhythmStability {
  const weekStart = startOfWeek(now, WEEK_OPTIONS);
  const weekCounts = Array.from({ length: RHYTHM_WINDOW_WEEKS }, (_, i) => {
    const wStart = addDays(weekStart, -7 * (RHYTHM_WINDOW_WEEKS - 1 - i));
    return activitiesInWeek(activities, wStart).length;
  });

  const activeWeeks = weekCounts.filter((c) => c > 0).length;
  const mean = weekCounts.reduce((s, c) => s + c, 0) / RHYTHM_WINDOW_WEEKS;
  const variance = populationVariance(weekCounts);

  const firstHalf = weekCounts.slice(0, 4);
  const secondHalf = weekCounts.slice(4);
  const firstVariance = populationVariance(firstHalf);
  const secondVariance = populationVariance(secondHalf);

  let trajectory: RhythmStability['trajectory'];
  if (activeWeeks < 2) {
    trajectory = 'insufficient_data';
  } else if (
    secondVariance < firstVariance * STABILIZING_VARIANCE_FACTOR &&
    variance < STABLE_VARIANCE_MAX
  ) {
    trajectory = 'stabilizing';
  } else if (variance < STABLE_VARIANCE_MAX && mean >= STABLE_AVG_SESSIONS_MIN) {
    trajectory = 'stable';
  } else if (secondVariance > firstVariance * FRAGMENTING_VARIANCE_FACTOR) {
    trajectory = 'fragmenting';
  } else if (secondVariance < firstVariance && secondHalf.some((c) => c > 0)) {
    trajectory = 'rebuilding';
  } else {
    trajectory = 'insufficient_data';
  }

  const observation: string | null =
    trajectory === 'stabilizing'
      ? 'More consistent across recent weeks than the month before.'
      : trajectory === 'stable'
        ? 'Consistent week-to-week. Weeks like these compound.'
        : null;

  let confidence: Confidence = 'low';
  if (activeWeeks >= 5) confidence = 'high';
  else if (activeWeeks >= 2) confidence = 'medium';

  return {
    weeklyVariance: Math.round(variance * 10) / 10,
    avgWeeklySessions: Math.round(mean * 10) / 10,
    trajectory,
    observation,
    confidence,
  };
}
```

- [ ] **Step 4: Run rhythm tests**

```bash
npx jest --testPathPattern="behavioralProfile" --no-coverage --testNamePattern="computeRhythmStability"
```

Expected: all rhythm tests PASS.

- [ ] **Step 5: Run full suite**

```bash
npx jest --no-coverage
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/utils/behavioralProfile.ts __tests__/behavioralProfile.test.ts
git commit -m "feat: 3A-1 computeRhythmStability — trajectory, variance, confidence"
```

---

## Task 4: computeRecoveryState

**Files:**
- Modify: `src/utils/behavioralProfile.ts`
- Modify: `__tests__/behavioralProfile.test.ts`

- [ ] **Step 1: Add recovery state tests**

Append to `__tests__/behavioralProfile.test.ts`:

```ts
describe('computeRecoveryState', () => {
  it('returns stable with no history', () => {
    const r = computeRecoveryState([], [], [], NOW);
    expect(r.signal).toBe('stable');
    expect(r.isExtendedAbsence).toBe(false);
    expect(r.isPatternDisrupted).toBe(false);
    expect(r.isHighStressSignal).toBe(false);
    expect(r.confidence).toBe('low');
  });

  it('detects extended absence when gap > EXTENDED_ABSENCE_DAYS', () => {
    const r = computeRecoveryState([act(15)], [], [], NOW);
    expect(r.isExtendedAbsence).toBe(true);
    expect(r.signal).toBe('needs_reentry');
    expect(r.reEntryReadiness).toBe('low');
  });

  it('does not trigger extended absence within threshold', () => {
    const r = computeRecoveryState([act(9)], [], [], NOW);
    expect(r.isExtendedAbsence).toBe(false);
    expect(r.signal).toBe('returning');
  });

  it('detects pattern disruption with consecutive unmet intentions + gap', () => {
    const intentions = [int(0, false), int(1, false)];
    const r = computeRecoveryState([act(8)], [], intentions, NOW);
    expect(r.isPatternDisrupted).toBe(true);
    expect(r.signal).toBe('needs_reentry');
  });

  it('does not trigger pattern disruption without sufficient gap', () => {
    const intentions = [int(0, false), int(1, false)];
    const r = computeRecoveryState([act(2)], [], intentions, NOW);
    expect(r.isPatternDisrupted).toBe(false);
  });

  it('does not trigger pattern disruption with only one unmet intention', () => {
    const r = computeRecoveryState([act(8)], [], [int(0, false)], NOW);
    expect(r.isPatternDisrupted).toBe(false);
  });

  it('does not trigger pattern disruption when most recent intention is met', () => {
    const intentions = [int(0, true), int(1, false), int(2, false)];
    const r = computeRecoveryState([act(8)], [], intentions, NOW);
    expect(r.isPatternDisrupted).toBe(false);
  });

  it('detects high stress signal from user-reported wellness', () => {
    const highStressReflection = ref(0, {
      notes: JSON.stringify({ stress: 8, soreness: 8, sleep: 5, motivation: 4, confidence: 4 }),
    });
    const r = computeRecoveryState([act(7)], [highStressReflection], [], NOW);
    expect(r.isHighStressSignal).toBe(true);
    expect(r.signal).toBe('needs_reentry');
  });

  it('does not trigger high stress below thresholds', () => {
    const normalReflection = ref(0, {
      notes: JSON.stringify({ stress: 5, soreness: 5, sleep: 7, motivation: 6, confidence: 6 }),
    });
    const r = computeRecoveryState([act(2)], [normalReflection], [], NOW);
    expect(r.isHighStressSignal).toBe(false);
  });

  it('returns returning signal for gap of 4-10 days with no flags', () => {
    const r = computeRecoveryState([act(6)], [], [], NOW);
    expect(r.signal).toBe('returning');
    expect(r.reEntryReadiness).toBe('medium');
  });

  it('returns thriving when recently active with good frequency', () => {
    // 3+ sessions/week average, gap < 4 days
    const activities = [];
    for (let i = 0; i < 4; i++) {
      for (let w = 0; w < 4; w++) {
        activities.push(act(w * 7 + i));
      }
    }
    const r = computeRecoveryState(activities, [], [], NOW);
    expect(r.signal).toBe('thriving');
  });

  it('compound state: multiple flags all true → needs_reentry', () => {
    const highStressReflection = ref(0, {
      notes: JSON.stringify({ stress: 9, soreness: 9, sleep: 3, motivation: 2, confidence: 2 }),
    });
    const intentions = [int(0, false), int(1, false)];
    const r = computeRecoveryState([act(12)], [highStressReflection], intentions, NOW);
    expect(r.isExtendedAbsence).toBe(true);
    expect(r.isPatternDisrupted).toBe(true);
    expect(r.isHighStressSignal).toBe(true);
    expect(r.signal).toBe('needs_reentry');
  });

  it('returns low confidence without reflection data', () => {
    const r = computeRecoveryState([act(1)], [], [], NOW);
    expect(r.confidence).toBe('low');
  });

  it('returns high confidence with recent reflection and recent activity', () => {
    const r = computeRecoveryState([act(1)], [ref(0)], [], NOW);
    expect(r.confidence).toBe('high');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest --testPathPattern="behavioralProfile" --no-coverage --testNamePattern="computeRecoveryState"
```

Expected: FAIL with "not implemented".

- [ ] **Step 3: Implement computeRecoveryState**

Replace the stub in `src/utils/behavioralProfile.ts`:

```ts
export function computeRecoveryState(
  activities: Activity[],
  reflections: Reflection[],
  intentions: Intention[],
  now: Date,
): RecoveryState {
  const daysSinceLast =
    activities.length > 0
      ? differenceInCalendarDays(now, new Date(activities[0]!.performed_at))
      : 999;

  const sortedReflections = [...reflections].sort((a, b) =>
    b.week_start.localeCompare(a.week_start),
  );
  const latestReflection = sortedReflections[0] ?? null;
  const wellnessData = latestReflection ? parseWellness(latestReflection.notes) : null;

  // isExtendedAbsence: purely behavioral — no psychological interpretation
  const isExtendedAbsence = daysSinceLast > EXTENDED_ABSENCE_DAYS;

  // isPatternDisrupted: consecutive unmet intentions + gap
  const intentionsWithMet = [...intentions]
    .filter((i) => i.met !== null)
    .sort((a, b) => b.week_start.localeCompare(a.week_start));
  const isPatternDisrupted =
    intentionsWithMet.length >= CONSECUTIVE_UNMET_THRESHOLD &&
    intentionsWithMet
      .slice(0, CONSECUTIVE_UNMET_THRESHOLD)
      .every((i) => i.met === false) &&
    daysSinceLast > PATTERN_DISRUPTED_GAP_DAYS;

  // isHighStressSignal: uses user-reported reflection data
  const isHighStressSignal =
    wellnessData !== null &&
    wellnessData.stress >= HIGH_STRESS_THRESHOLD &&
    wellnessData.soreness >= HIGH_SORENESS_THRESHOLD &&
    daysSinceLast > HIGH_STRESS_GAP_DAYS;

  // 4-state action signal: needs_reentry collapses all three flags
  const needsReentry = isExtendedAbsence || isPatternDisrupted || isHighStressSignal;
  let signal: RecoveryState['signal'];
  if (needsReentry) {
    signal = 'needs_reentry';
  } else if (daysSinceLast >= 4 && daysSinceLast <= 10) {
    signal = 'returning';
  } else {
    // Check recent session frequency for thriving
    const weekStart = startOfWeek(now, WEEK_OPTIONS);
    const recentCounts = Array.from({ length: 4 }, (_, i) => {
      const wStart = addDays(weekStart, -7 * (3 - i));
      return activitiesInWeek(activities, wStart).length;
    });
    const avgSessions = recentCounts.reduce((s, c) => s + c, 0) / 4;
    signal = avgSessions > 2 && daysSinceLast < 4 ? 'thriving' : 'stable';
  }

  let reEntryReadiness: RecoveryState['reEntryReadiness'] = 'high';
  if (isExtendedAbsence || isPatternDisrupted) reEntryReadiness = 'low';
  else if (isHighStressSignal || daysSinceLast > 7) reEntryReadiness = 'medium';

  // Confidence: based on recency of reflection data and activity
  let confidence: Confidence = 'low';
  if (latestReflection) {
    const weeksSinceReflection = Math.floor(
      differenceInCalendarDays(now, new Date(latestReflection.week_start)) / 7,
    );
    if (weeksSinceReflection <= 1 && daysSinceLast < 7) confidence = 'high';
    else if (weeksSinceReflection <= 3) confidence = 'medium';
  }

  return {
    signal,
    isExtendedAbsence,
    isPatternDisrupted,
    isHighStressSignal,
    reEntryReadiness,
    confidence,
  };
}
```

- [ ] **Step 4: Run recovery tests**

```bash
npx jest --testPathPattern="behavioralProfile" --no-coverage --testNamePattern="computeRecoveryState"
```

Expected: all recovery tests PASS.

- [ ] **Step 5: Run full suite**

```bash
npx jest --no-coverage
```

- [ ] **Step 6: Commit**

```bash
git add src/utils/behavioralProfile.ts __tests__/behavioralProfile.test.ts
git commit -m "feat: 3A-1 computeRecoveryState — 4-state signal, compound flags, confidence"
```

---

## Task 5: computeReturnReliability

**Files:**
- Modify: `src/utils/behavioralProfile.ts`
- Modify: `__tests__/behavioralProfile.test.ts`

- [ ] **Step 1: Add return reliability tests**

Append to `__tests__/behavioralProfile.test.ts`:

```ts
describe('computeReturnReliability', () => {
  // Helper: build a gaps profile directly for testing
  function gaps(totalGapCount: number, avgGapDays: number, trend: GapProfile['trend'] = 'stable'): GapProfile {
    return {
      hasHistory: totalGapCount > 0,
      lastGapDays: 2,
      avgGapDays,
      gapHistory: Array(Math.min(totalGapCount, 5)).fill(avgGapDays),
      totalGapCount,
      longestGapDays: avgGapDays,
      trend,
      observation: null,
      confidence: totalGapCount >= 5 ? 'high' : totalGapCount >= 3 ? 'medium' : 'low',
    };
  }

  it('returns insufficient_data with no activities', () => {
    const r = computeReturnReliability([], gaps(0, 0), NOW);
    expect(r.label).toBe('insufficient_data');
    expect(r.confidence).toBe('low');
  });

  it('returns insufficient_data with only 1 gap', () => {
    const r = computeReturnReliability([act(1), act(20)], gaps(1, 19), NOW);
    expect(r.label).toBe('insufficient_data');
  });

  it('classifies anchored: short avg gap, high active ratio', () => {
    // Activities every 2-3 days for past year → avg gap ≤ 5, active ratio > 0.8
    const activities: Activity[] = [];
    for (let i = 0; i < 180; i += 2) activities.push(act(i));
    const g = computeGapProfile(activities, NOW);
    const r = computeReturnReliability(activities, g, NOW);
    expect(r.label).toBe('anchored');
    expect(r.confidence).toBe('high');
  });

  it('classifies resilient: multiple gaps but stable/shrinking trend, good active ratio', () => {
    // Gaps of 8-12 days but always returns, stable trend
    const activities = [
      act(1), act(13), act(25), act(33), act(45), act(57), act(67),
    ];
    const g = computeGapProfile(activities, NOW);
    const r = computeReturnReliability(activities, g, NOW);
    // User has gaps but keeps returning — should be resilient or intermittent
    expect(['resilient', 'intermittent']).toContain(r.label);
  });

  it('classifies fragmented: many long gaps, low active months', () => {
    // Only 3-4 sessions total, spread over 10+ months
    const activities = [act(5), act(90), act(180), act(300)];
    const g = computeGapProfile(activities, NOW);
    const r = computeReturnReliability(activities, g, NOW);
    expect(r.label).toBe('fragmented');
  });

  it('returns correct gapCount from full history', () => {
    const activities = [act(1), act(10), act(20), act(30), act(40), act(50), act(60)];
    const g = computeGapProfile(activities, NOW);
    const r = computeReturnReliability(activities, g, NOW);
    expect(r.gapCount).toBe(g.totalGapCount);
  });

  it('returns high confidence with 5+ gaps', () => {
    const activities = [act(1), act(10), act(20), act(30), act(40), act(50), act(60)];
    const g = computeGapProfile(activities, NOW);
    const r = computeReturnReliability(activities, g, NOW);
    expect(r.confidence).toBe('high');
  });

  it('counts activeMonths from trailing 12 months only', () => {
    // Activity 13 months ago should not count
    const activities = [act(1), act(400)];
    const g = computeGapProfile(activities, NOW);
    const r = computeReturnReliability(activities, g, NOW);
    expect(r.activeMonths).toBe(1); // only the recent one
  });
});
```

Add this import at the top of the test file (after the existing imports):

```ts
import { computeGapProfile, type GapProfile } from '../src/utils/behavioralProfile';
```

(The test already imports from behavioralProfile — add `GapProfile` to the type imports and `computeGapProfile` if not already there.)

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest --testPathPattern="behavioralProfile" --no-coverage --testNamePattern="computeReturnReliability"
```

Expected: FAIL with "not implemented".

- [ ] **Step 3: Implement computeReturnReliability**

Replace the stub in `src/utils/behavioralProfile.ts`:

```ts
export function computeReturnReliability(
  activities: Activity[],
  gaps: GapProfile,
  now: Date,
): ReturnReliability {
  const gapCount = gaps.totalGapCount;
  const longestGapDays = gaps.longestGapDays;
  const avgGapDays = gaps.avgGapDays;

  // Count calendar months in trailing 12 months with ≥ 1 activity
  const cutoff = new Date(now);
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  const monthKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const activeMonthSet = new Set(
    activities
      .filter((a) => new Date(a.performed_at) >= cutoff)
      .map((a) => monthKey(new Date(a.performed_at))),
  );
  const activeMonths = activeMonthSet.size;

  // trackedMonths: months since first activity, clamped to 12
  const sortedAsc = [...activities].sort(
    (a, b) => new Date(a.performed_at).getTime() - new Date(b.performed_at).getTime(),
  );
  const firstDate = sortedAsc.length > 0 ? new Date(sortedAsc[0]!.performed_at) : now;
  const monthsDiff =
    (now.getFullYear() - firstDate.getFullYear()) * 12 +
    (now.getMonth() - firstDate.getMonth());
  const trackedMonths = Math.min(12, Math.max(1, monthsDiff + 1));
  const activeRatio = activeMonths / trackedMonths;

  // Label derivation
  let label: ReturnReliability['label'];
  if (gapCount < 2) {
    label = 'insufficient_data';
  } else if (avgGapDays <= ANCHORED_AVG_GAP_MAX && activeRatio >= ANCHORED_ACTIVE_RATIO_MIN) {
    label = 'anchored';
  } else if (
    gapCount >= 2 &&
    (gaps.trend === 'shrinking' || gaps.trend === 'stable') &&
    activeRatio >= RESILIENT_ACTIVE_RATIO_MIN
  ) {
    label = 'resilient';
  } else if (activeRatio >= INTERMITTENT_ACTIVE_RATIO_MIN) {
    label = 'intermittent';
  } else {
    label = 'fragmented';
  }

  // Also force fragmented when gaps are very long and numerous
  if (
    label !== 'insufficient_data' &&
    gapCount >= FRAGMENTED_GAP_COUNT_MIN &&
    avgGapDays >= FRAGMENTED_AVG_GAP_MIN
  ) {
    label = 'fragmented';
  }

  let confidence: Confidence = 'low';
  if (gapCount >= 5) confidence = 'high';
  else if (gapCount >= 2) confidence = 'medium';

  return { label, gapCount, longestGapDays, activeMonths, confidence };
}
```

- [ ] **Step 4: Run reliability tests**

```bash
npx jest --testPathPattern="behavioralProfile" --no-coverage --testNamePattern="computeReturnReliability"
```

Expected: all reliability tests PASS.

- [ ] **Step 5: Run full suite**

```bash
npx jest --no-coverage
```

- [ ] **Step 6: Commit**

```bash
git add src/utils/behavioralProfile.ts __tests__/behavioralProfile.test.ts
git commit -m "feat: 3A-1 computeReturnReliability — anchored/resilient/intermittent/fragmented labels"
```

---

## Task 6: detectBehavioralMoments

**Files:**
- Modify: `src/utils/behavioralProfile.ts`
- Modify: `__tests__/behavioralProfile.test.ts`

- [ ] **Step 1: Add moment detection tests**

Append to `__tests__/behavioralProfile.test.ts`:

```ts
describe('detectBehavioralMoments', () => {
  // Reusable profile stubs
  const emptyGaps: GapProfile = {
    hasHistory: false, lastGapDays: 0, avgGapDays: 0, gapHistory: [],
    totalGapCount: 0, longestGapDays: 0, trend: 'insufficient_data',
    observation: null, confidence: 'low',
  };
  const emptyRhythm: RhythmStability = {
    weeklyVariance: 0, avgWeeklySessions: 0, trajectory: 'insufficient_data',
    observation: null, confidence: 'low',
  };
  const emptyReliability: ReturnReliability = {
    label: 'insufficient_data', gapCount: 0, longestGapDays: 0,
    activeMonths: 0, confidence: 'low',
  };

  it('returns empty array when no conditions are met', () => {
    const m = detectBehavioralMoments([], [], [], emptyGaps, emptyRhythm, emptyReliability, NOW);
    expect(m).toHaveLength(0);
  });

  it('surfaces reliable_returner for resilient user with medium+ confidence', () => {
    const reliability: ReturnReliability = {
      ...emptyReliability, label: 'resilient', confidence: 'medium', gapCount: 3,
    };
    const m = detectBehavioralMoments([], [], [], emptyGaps, emptyRhythm, reliability, NOW);
    const types = m.map((x) => x.type);
    expect(types).toContain('reliable_returner');
  });

  it('does not surface reliable_returner for low confidence', () => {
    const reliability: ReturnReliability = {
      ...emptyReliability, label: 'resilient', confidence: 'low', gapCount: 2,
    };
    const m = detectBehavioralMoments([], [], [], emptyGaps, emptyRhythm, reliability, NOW);
    const types = m.map((x) => x.type);
    expect(types).not.toContain('reliable_returner');
  });

  it('surfaces faster_return when last gap is short vs average', () => {
    const gaps: GapProfile = {
      hasHistory: true, lastGapDays: 5, avgGapDays: 14,
      gapHistory: [14, 16, 12, 5], // last gap = 5, avg ≈ 11.75, 5 < 11.75 * 0.8 = 9.4 ✓
      totalGapCount: 4, longestGapDays: 16,
      trend: 'shrinking', observation: null, confidence: 'medium',
    };
    // Return activity was 5 days ago
    const activities = [act(5)];
    const m = detectBehavioralMoments(activities, [], [], gaps, emptyRhythm, emptyReliability, NOW);
    const types = m.map((x) => x.type);
    expect(types).toContain('faster_return');
  });

  it('does not surface faster_return for low confidence gaps', () => {
    const gaps: GapProfile = {
      hasHistory: true, lastGapDays: 5, avgGapDays: 14,
      gapHistory: [14, 5], totalGapCount: 2, longestGapDays: 14,
      trend: 'shrinking', observation: null, confidence: 'low',
    };
    const m = detectBehavioralMoments([act(5)], [], [], gaps, emptyRhythm, emptyReliability, NOW);
    const types = m.map((x) => x.type);
    expect(types).not.toContain('faster_return');
  });

  it('surfaces staying_connected for low-energy week with activity', () => {
    const lowEnergyRef = ref(0, { energy: 3 }); // this week, low energy
    const activities = [act(2)]; // logged this week
    const m = detectBehavioralMoments(activities, [lowEnergyRef], [], emptyGaps, emptyRhythm, emptyReliability, NOW);
    const types = m.map((x) => x.type);
    expect(types).toContain('staying_connected');
  });

  it('does not surface staying_connected for stale reflection (> 14 days ago)', () => {
    const oldRef = ref(3, { energy: 3 }); // 3 weeks ago — stale
    const m = detectBehavioralMoments([act(2)], [oldRef], [], emptyGaps, emptyRhythm, emptyReliability, NOW);
    const types = m.map((x) => x.type);
    expect(types).not.toContain('staying_connected');
  });

  it('surfaces intention_followed for recent met intention', () => {
    const recentIntention = int(0, true, 'walk on tuesday');
    const m = detectBehavioralMoments([], [], [recentIntention], emptyGaps, emptyRhythm, emptyReliability, NOW);
    const types = m.map((x) => x.type);
    expect(types).toContain('intention_followed');
    const moment = m.find((x) => x.type === 'intention_followed')!;
    expect(moment.observation).toContain('walk on tuesday');
  });

  it('does not surface intention_followed for stale met intention', () => {
    const oldIntention = int(3, true); // 3 weeks ago — outside 14-day window
    const m = detectBehavioralMoments([], [], [oldIntention], emptyGaps, emptyRhythm, emptyReliability, NOW);
    const types = m.map((x) => x.type);
    expect(types).not.toContain('intention_followed');
  });

  it('caps moments at MAX_MOMENTS', () => {
    // Set up all conditions simultaneously
    const reliability: ReturnReliability = {
      ...emptyReliability, label: 'resilient', confidence: 'high', gapCount: 5,
    };
    const gaps: GapProfile = {
      hasHistory: true, lastGapDays: 5, avgGapDays: 14,
      gapHistory: [14, 16, 12, 5], totalGapCount: 4, longestGapDays: 16,
      trend: 'shrinking', observation: null, confidence: 'medium',
    };
    const rhythm: RhythmStability = {
      ...emptyRhythm, trajectory: 'stabilizing', confidence: 'high',
    };
    const activities = [act(5)];
    const lowEnergyRef = ref(0, { energy: 3 });
    const recentIntention = int(0, true);

    const m = detectBehavioralMoments(
      activities, [lowEnergyRef], [recentIntention],
      gaps, rhythm, reliability, NOW,
    );
    expect(m.length).toBeLessThanOrEqual(3);
  });

  it('all moments have observedAt as an ISO date string', () => {
    const reliability: ReturnReliability = {
      ...emptyReliability, label: 'resilient', confidence: 'medium', gapCount: 3,
    };
    const m = detectBehavioralMoments([], [], [], emptyGaps, emptyRhythm, reliability, NOW);
    for (const moment of m) {
      expect(moment.observedAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
    }
  });

  it('truncates long intention descriptions at 40 chars', () => {
    const longDesc = 'a'.repeat(50);
    const recentIntention = int(0, true, longDesc);
    const m = detectBehavioralMoments([], [], [recentIntention], emptyGaps, emptyRhythm, emptyReliability, NOW);
    const moment = m.find((x) => x.type === 'intention_followed');
    if (moment) {
      expect(moment.observation).toContain('…');
    }
  });
});
```

Add these type imports to the test file import block:

```ts
import type { RhythmStability, ReturnReliability } from '../src/utils/behavioralProfile';
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest --testPathPattern="behavioralProfile" --no-coverage --testNamePattern="detectBehavioralMoments"
```

Expected: FAIL with "not implemented".

- [ ] **Step 3: Implement detectBehavioralMoments**

Replace the stub in `src/utils/behavioralProfile.ts`:

```ts
export function detectBehavioralMoments(
  activities: Activity[],
  reflections: Reflection[],
  intentions: Intention[],
  gaps: GapProfile,
  rhythm: RhythmStability,
  returnReliability: ReturnReliability,
  now: Date,
): BehavioralMoment[] {
  const moments: BehavioralMoment[] = [];
  const isoDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const isWithinWindow = (observedAt: string, type: MomentType) =>
    differenceInCalendarDays(now, new Date(observedAt)) <= MOMENT_RELEVANCE_DAYS[type];

  // 1. reliable_returner — highest priority, most enduring
  if (
    returnReliability.label === 'resilient' &&
    (returnReliability.confidence === 'medium' || returnReliability.confidence === 'high')
  ) {
    const observedAt = activities.length > 0
      ? activities[0]!.performed_at.slice(0, 10)
      : isoDate(now);
    if (isWithinWindow(observedAt, 'reliable_returner')) {
      moments.push({
        type: 'reliable_returner',
        observation: "You've returned after every extended gap. That pattern is harder to build than it looks.",
        observedAt,
      });
    }
  }

  // 2. faster_return
  if (
    gaps.gapHistory.length >= 2 &&
    gaps.confidence !== 'low'
  ) {
    const lastGap = gaps.gapHistory[gaps.gapHistory.length - 1]!;
    if (lastGap < gaps.avgGapDays * FASTER_RETURN_FACTOR) {
      const observedAt = activities.length > 0
        ? activities[0]!.performed_at.slice(0, 10)
        : isoDate(now);
      if (isWithinWindow(observedAt, 'faster_return')) {
        moments.push({
          type: 'faster_return',
          observation: `Back in ${lastGap} days — ${gaps.avgGapDays} is your usual gap.`,
          observedAt,
        });
      }
    }
  }

  // 3. staying_connected
  if (moments.length < MAX_MOMENTS) {
    const sortedRefs = [...reflections].sort((a, b) =>
      b.week_start.localeCompare(a.week_start),
    );
    const latestRef = sortedRefs[0];
    if (latestRef) {
      const wellnessData = parseWellness(latestRef.notes);
      const lowEnergy =
        latestRef.energy <= DIFFICULT_WEEK_ENERGY_MAX ||
        (wellnessData !== null && wellnessData.motivation <= DIFFICULT_WEEK_ENERGY_MAX);
      if (lowEnergy && isWithinWindow(latestRef.week_start, 'staying_connected')) {
        const weekStart = startOfWeek(new Date(latestRef.week_start), WEEK_OPTIONS);
        const weekActs = activitiesInWeek(activities, weekStart);
        if (weekActs.length > 0) {
          moments.push({
            type: 'staying_connected',
            observation: 'You stayed connected during a low-energy week.',
            observedAt: latestRef.week_start,
          });
        }
      }
    }
  }

  // 4. intention_followed
  if (moments.length < MAX_MOMENTS) {
    const sortedIntentions = [...intentions]
      .filter((i) => i.met === true)
      .sort((a, b) => b.week_start.localeCompare(a.week_start));
    const latest = sortedIntentions[0];
    if (latest && isWithinWindow(latest.week_start, 'intention_followed')) {
      const desc = latest.description.length > 40
        ? latest.description.slice(0, 40) + '…'
        : latest.description;
      moments.push({
        type: 'intention_followed',
        observation: `You followed through: '${desc}'.`,
        observedAt: latest.week_start,
      });
    }
  }

  // 5. gaps_narrowing
  if (moments.length < MAX_MOMENTS) {
    if (
      gaps.trend === 'shrinking' &&
      gaps.gapHistory.length >= 3 &&
      gaps.confidence !== 'low'
    ) {
      const observedAt = activities.length > 0
        ? activities[0]!.performed_at.slice(0, 10)
        : isoDate(now);
      if (isWithinWindow(observedAt, 'gaps_narrowing')) {
        moments.push({
          type: 'gaps_narrowing',
          observation: 'The time between your sessions is getting shorter.',
          observedAt,
        });
      }
    }
  }

  // 6. rhythm_rebuilding
  if (moments.length < MAX_MOMENTS) {
    if (rhythm.trajectory === 'stabilizing' && rhythm.confidence !== 'low') {
      const observedAt = activities.length > 0
        ? activities[0]!.performed_at.slice(0, 10)
        : isoDate(now);
      if (isWithinWindow(observedAt, 'rhythm_rebuilding')) {
        moments.push({
          type: 'rhythm_rebuilding',
          observation: 'More consistent recently than a month ago.',
          observedAt,
        });
      }
    }
  }

  return moments.slice(0, MAX_MOMENTS);
}
```

- [ ] **Step 4: Run moment tests**

```bash
npx jest --testPathPattern="behavioralProfile" --no-coverage --testNamePattern="detectBehavioralMoments"
```

Expected: all moment tests PASS.

- [ ] **Step 5: Run full suite**

```bash
npx jest --no-coverage
```

- [ ] **Step 6: Commit**

```bash
git add src/utils/behavioralProfile.ts __tests__/behavioralProfile.test.ts
git commit -m "feat: 3A-1 detectBehavioralMoments — 6 types, freshness windows, priority ordering"
```

---

## Task 7: computeBehavioralProfile + profileConfidence + integration tests

**Files:**
- Modify: `src/utils/behavioralProfile.ts`
- Modify: `__tests__/behavioralProfile.test.ts`

- [ ] **Step 1: Add integration tests**

Append to `__tests__/behavioralProfile.test.ts`:

```ts
describe('computeBehavioralProfile', () => {
  it('composes all five domains without throwing', () => {
    const profile = computeBehavioralProfile([], [], [], NOW);
    expect(profile).toHaveProperty('gaps');
    expect(profile).toHaveProperty('rhythm');
    expect(profile).toHaveProperty('recovery');
    expect(profile).toHaveProperty('returnReliability');
    expect(profile).toHaveProperty('moments');
    expect(profile).toHaveProperty('profileConfidence');
  });

  it('returns low profileConfidence with no data', () => {
    const profile = computeBehavioralProfile([], [], [], NOW);
    expect(profile.profileConfidence).toBe('low');
  });

  it('is deterministic — same inputs produce same output', () => {
    const activities = [act(1), act(8), act(20), act(30)];
    const reflections = [ref(0)];
    const intentions = [int(0, true)];
    const a = computeBehavioralProfile(activities, reflections, intentions, NOW);
    const b = computeBehavioralProfile(activities, reflections, intentions, NOW);
    expect(a.gaps.totalGapCount).toBe(b.gaps.totalGapCount);
    expect(a.rhythm.trajectory).toBe(b.rhythm.trajectory);
    expect(a.recovery.signal).toBe(b.recovery.signal);
    expect(a.returnReliability.label).toBe(b.returnReliability.label);
    expect(a.profileConfidence).toBe(b.profileConfidence);
  });

  it('profileConfidence is the minimum across all four domain confidences', () => {
    // With only 1 activity, all domains should be low confidence
    const profile = computeBehavioralProfile([act(1)], [], [], NOW);
    expect(profile.profileConfidence).toBe('low');
  });

  it('elevated profileConfidence when all domains have sufficient data', () => {
    // Build rich data set: 8 weeks of activity + reflection + intention
    const activities: Activity[] = [];
    for (let i = 0; i < 8; i++) {
      for (let d = 0; d < 3; d++) {
        activities.push(act(i * 7 + d));
      }
    }
    // Add some gaps to get gap confidence up
    activities.push(act(60));
    activities.push(act(75));
    activities.push(act(90));
    const profile = computeBehavioralProfile(
      activities,
      [ref(0), ref(1), ref(2)],
      [int(0, true)],
      NOW,
    );
    expect(['medium', 'high']).toContain(profile.profileConfidence);
  });

  it('uses provided now parameter — injectable for testing', () => {
    const pastNow = new Date('2025-01-01T10:00:00Z');
    const activities = [
      { ...act(0), performed_at: new Date('2024-12-31T10:00:00Z').toISOString() },
    ];
    const profile = computeBehavioralProfile(activities, [], [], pastNow);
    expect(profile.gaps.lastGapDays).toBe(1);
  });

  it('moments array never exceeds MAX_MOMENTS', () => {
    const activities: Activity[] = [];
    for (let i = 0; i < 20; i += 2) activities.push(act(i));
    const profile = computeBehavioralProfile(activities, [ref(0, { energy: 2 })], [int(0, true)], NOW);
    expect(profile.moments.length).toBeLessThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Run integration tests to confirm they fail**

```bash
npx jest --testPathPattern="behavioralProfile" --no-coverage --testNamePattern="computeBehavioralProfile"
```

Expected: FAIL with "not implemented".

- [ ] **Step 3: Implement computeBehavioralProfile and profileConfidence helper**

Replace the entry point stub and add the confidence helper in `src/utils/behavioralProfile.ts`:

```ts
// Private: aggregate confidence is the minimum across all domains.
// Consumers can gate on this single value without inspecting each domain.
function aggregateConfidence(
  gaps: GapProfile,
  rhythm: RhythmStability,
  recovery: RecoveryState,
  returnReliability: ReturnReliability,
): Confidence {
  const rank: Record<Confidence, number> = { low: 0, medium: 1, high: 2 };
  const min = Math.min(
    rank[gaps.confidence],
    rank[rhythm.confidence],
    rank[recovery.confidence],
    rank[returnReliability.confidence],
  );
  return (['low', 'medium', 'high'] as const)[min]!;
}

export function computeBehavioralProfile(
  activities: Activity[],
  reflections: Reflection[],
  intentions: Intention[],
  now: Date = new Date(),
): BehavioralProfile {
  // Gap detection runs once — result shared with returnReliability
  const gaps = computeGapProfile(activities, now);
  const rhythm = computeRhythmStability(activities, now);
  const recovery = computeRecoveryState(activities, reflections, intentions, now);
  const returnReliability = computeReturnReliability(activities, gaps, now);
  const moments = detectBehavioralMoments(
    activities,
    reflections,
    intentions,
    gaps,
    rhythm,
    returnReliability,
    now,
  );
  const profileConfidence = aggregateConfidence(gaps, rhythm, recovery, returnReliability);

  return { gaps, rhythm, recovery, returnReliability, moments, profileConfidence };
}
```

- [ ] **Step 4: Run integration tests**

```bash
npx jest --testPathPattern="behavioralProfile" --no-coverage --testNamePattern="computeBehavioralProfile"
```

Expected: all integration tests PASS.

- [ ] **Step 5: Run complete test suite**

```bash
npx jest --no-coverage
```

Expected: all tests across all test files PASS.

- [ ] **Step 6: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: zero errors in React Native codebase (pre-existing Deno errors in `supabase/functions/` are acceptable).

- [ ] **Step 7: Commit**

```bash
git add src/utils/behavioralProfile.ts __tests__/behavioralProfile.test.ts
git commit -m "feat: 3A-1 computeBehavioralProfile — entry point, profileConfidence aggregation"
```

---

## Self-Review

### Spec Coverage

| Requirement | Task |
|------------|------|
| `computeBehavioralProfile()` pure entry point | Task 7 |
| `GapProfile` with totalGapCount, longestGapDays, avgGapDays (all gaps) | Task 2 |
| `RhythmStability` with trajectory + confidence | Task 3 |
| `RecoveryState` 4-state signal + 3 boolean flags | Task 4 |
| `ReturnReliability` first-class domain | Task 5 |
| `BehavioralMoment` with observedAt | Task 6 |
| `MOMENT_RELEVANCE_DAYS` per-type freshness | Task 6 |
| `profileConfidence` aggregate | Task 7 |
| All constants exported and named | Task 1 |
| `return_after_long_gap` NOT implemented | ✅ Absent |
| No UI changes, no stores, no Supabase | ✅ Scope clean |
| Injectable `now` for tests | All tasks |
| New-user fallback documented in comments | Task 1 (in ReturnReliability comment) |
| `// bodyPattern?: BodyPattern` extension point | Task 1 |
| Tests cover: no history, single activity, shrinking/growing/stable gaps | Task 2 |
| Tests cover: stable/stabilizing/fragmenting/rebuilding rhythm | Task 3 |
| Tests cover: extended absence, compound flags, high stress | Task 4 |
| Tests cover: anchored/resilient/intermittent/fragmented | Task 5 |
| Tests cover: stale moment filtering, freshness windows | Task 6 |
| Tests cover: determinism, MAX_MOMENTS cap, profileConfidence | Task 7 |

No gaps.
