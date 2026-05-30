# 3A-1 Behavioral Intelligence Layer — Design Spec

## Goal

Build a client-side behavioral intelligence layer that transforms raw activity, reflection, and intention data into structured, confidence-aware behavioral signals. The layer is the foundation for Phase 3A: home screen depth (3A-2), adaptive accountability (3A-3), and intention continuity (3A-4).

Optimized for 12+ month relevance. Not an onboarding metrics engine. Not a wellness score system.

---

## Strategic Context

MoveKind's differentiation is no longer copy tone or anti-streak branding. It is behavioral pattern recognition: understanding whether someone is anchored to movement, drifting from it, or rebuilding their relationship with it after a gap.

The behavioral intelligence layer surfaces observations — not achievements, not scores, not evaluations. A user who has been away for 30 days and just returned is not "failing." A user who keeps coming back after every gap, even long ones, is demonstrating something important. The system should see and name that.

---

## Architecture

### Single entry point

```ts
computeBehavioralProfile(
  activities: Activity[],
  reflections: Reflection[],
  intentions: Intention[],
  now?: Date,         // injectable for testing
): BehavioralProfile
```

Located in: `src/utils/behavioralProfile.ts`

### Five domains

| Domain | Durability | Role |
|--------|-----------|------|
| `returnReliability` | Enduring | First-class signal — do they keep coming back? |
| `rhythm` | Enduring | Consistency quality over time |
| `recovery` | Enduring | Current behavioral state |
| `moments` | Enduring | Specific observations surfaced to the user |
| `gaps` | Early-stage | Return speed and gap trend — secondary as history grows |

`gaps` is present and useful. It is not the primary signal. As a user's history accumulates, `returnReliability` carries more weight and `gaps` trend matters less.

### Internal sub-functions (each independently exported for testing)

```ts
computeGapProfile(activities, now)            → GapProfile
computeRhythmStability(activities, now)       → RhythmStability
computeRecoveryState(activities, reflections, intentions, now) → RecoveryState
computeReturnReliability(activities, gaps, now) → ReturnReliability
detectBehavioralMoments(activities, reflections, intentions, gaps, rhythm, returnReliability) → BehavioralMoment[]
```

`computeBehavioralProfile` composes these in order. Each sub-function is pure and independently testable.

### Extension point for future domains

`BehavioralProfile` is designed so new domains can be added as optional fields without refactoring existing consumers. Each domain is computed by its own sub-function and composed at the top level. Adding a future `bodyPattern?: BodyPattern` domain means:
1. Write `computeBodyPattern(activities, reflections)` in the same file
2. Add `bodyPattern?: BodyPattern` to `BehavioralProfile`
3. Call it in `computeBehavioralProfile`

No existing consumer breaks. No restructuring required.

---

## Named Constants

All thresholds are calibrated estimates, not psychological truths. They are tunable as real usage data accumulates.

```ts
// Gap detection
export const GAP_DEFINITION_DAYS = 3;           // inactivity > N days = a gap
export const GAP_HISTORY_SIZE = 5;              // completed gaps retained for trend

// RecoveryState thresholds
export const EXTENDED_ABSENCE_DAYS = 10;         // isExtendedAbsence trigger
export const PATTERN_DISRUPTED_GAP_DAYS = 7;    // gap condition for isPatternDisrupted
export const CONSECUTIVE_UNMET_THRESHOLD = 2;   // unmet intentions for isPatternDisrupted
export const HIGH_STRESS_GAP_DAYS = 5;          // gap condition for isHighStressSignal
export const HIGH_STRESS_THRESHOLD = 7;         // user-reported stress (1–10)
export const HIGH_SORENESS_THRESHOLD = 7;       // user-reported soreness (1–10)

// Trend sensitivity
export const TREND_SHRINKING_FACTOR = 0.8;      // lastGap < avg × 0.8 → 'shrinking'
export const TREND_GROWING_FACTOR = 1.2;        // lastGap > avg × 1.2 → 'growing'
export const FASTER_RETURN_FACTOR = 0.8;        // moment trigger: faster_return

// Rhythm stability
export const RHYTHM_WINDOW_WEEKS = 8;           // computation window
export const STABILIZING_VARIANCE_FACTOR = 0.7; // secondHalf < firstHalf × N → 'stabilizing'
export const FRAGMENTING_VARIANCE_FACTOR = 1.3; // secondHalf > firstHalf × N → 'fragmenting'
export const STABLE_VARIANCE_MAX = 1.5;         // variance ceiling for 'stable'
export const STABLE_AVG_SESSIONS_MIN = 0.5;     // sessions/week floor for 'stable'

// ReturnReliability
export const ANCHORED_AVG_GAP_MAX = 5;          // avgGapDays ≤ N → candidate for 'anchored'
export const ANCHORED_ACTIVE_RATIO_MIN = 0.8;   // activeMonths/tracked ≥ N → 'anchored'
export const RESILIENT_ACTIVE_RATIO_MIN = 0.5;  // activeMonths/tracked ≥ N → 'resilient'
export const INTERMITTENT_ACTIVE_RATIO_MIN = 0.3;
export const FRAGMENTED_AVG_GAP_MIN = 20;       // avgGapDays ≥ N → candidate for 'fragmented'
export const FRAGMENTED_GAP_COUNT_MIN = 3;      // minimum gaps for fragmented label

// Moments
export const MAX_MOMENTS = 3;                   // cap on returned BehavioralMoments
export const DIFFICULT_WEEK_ENERGY_MAX = 4;     // energy/motivation ≤ N → difficult week
```

---

## Data Model

```ts
type Confidence = 'low' | 'medium' | 'high';

// ─── Gap Profile ──────────────────────────────────────────────────────────────
// Early-stage signal. Useful during first 6-12 months of usage.
// Consumers should check confidence before surfacing to user.

interface GapProfile {
  hasHistory: boolean;
  lastGapDays: number;            // days since last activity (open gap, may be ongoing)
  avgGapDays: number;             // mean of gapHistory
  gapHistory: number[];           // last 5 completed gaps, oldest→newest
  trend: 'shrinking' | 'stable' | 'growing' | 'insufficient_data';
  observation: string | null;     // factual, non-congratulatory. null if nothing notable.
  confidence: Confidence;
}

// ─── Rhythm Stability ─────────────────────────────────────────────────────────
// How consistent is the movement pattern over 8 weeks?

interface RhythmStability {
  weeklyVariance: number;         // population variance of sessions/week over RHYTHM_WINDOW_WEEKS
  avgWeeklySessions: number;      // mean sessions/week in window
  trajectory:
    | 'stabilizing'               // variance decreasing, pattern converging
    | 'stable'                    // low variance, consistent presence
    | 'fragmenting'               // variance increasing, pattern breaking up
    | 'rebuilding'                // variance decreasing but from high baseline
    | 'insufficient_data';
  observation: string | null;
  confidence: Confidence;
}

// ─── Recovery State ───────────────────────────────────────────────────────────
// Current behavioral state. Observational only — no psychological diagnosis.
// isHighStressSignal uses user-reported reflection data (user told us).
// isExtendedAbsence and isPatternDisrupted use only behavioral data (activity/intention logs).

interface RecoveryState {
  signal:
    | 'extended_absence'          // gap > EXTENDED_ABSENCE_DAYS, no reflection interpretation
    | 'pattern_disruption'        // consecutive unmet intentions + gap
    | 'high_stress_signal'        // user-reported high stress + soreness + gap
    | 'returning'                 // gap 4–10 days, returning window
    | 'stable'                    // active, no significant signals
    | 'thriving';                 // consistent recent activity, high rhythm

  isExtendedAbsence: boolean;     // purely behavioral: gap > threshold
  isPatternDisrupted: boolean;    // behavioral: consecutive unmet + gap
  isHighStressSignal: boolean;    // uses user-reported reflection data

  reEntryReadiness: 'high' | 'medium' | 'low';
  confidence: Confidence;
}

// ─── Return Reliability ───────────────────────────────────────────────────────
// Enduring first-class signal. Gets richer with time.
// Answers: does this person keep coming back to movement?

interface ReturnReliability {
  label:
    | 'anchored'                  // rarely disconnects, consistently present
    | 'resilient'                 // gaps exist but consistently returns — core MoveKind user
    | 'intermittent'              // irregular presence, no strong pattern
    | 'fragmented'                // frequent long gaps, sparse engagement
    | 'insufficient_data';        // too few gaps to assess

  gapCount: number;               // total completed gaps in history
  longestGapDays: number;         // longest completed gap
  activeMonths: number;           // trailing 12 months with ≥ 1 logged activity
  confidence: Confidence;
}

// ─── Behavioral Moments ───────────────────────────────────────────────────────
// What the system noticed. Observational, not celebratory.
// observation is always present — moments only exist if there's something specific to say.

type MomentType =
  | 'faster_return'               // returned faster than personal average gap
  | 'staying_connected'           // logged activity during a low-energy week
  | 'intention_followed'          // followed through on a set intention
  | 'gaps_narrowing'              // gap trend 'shrinking' with sufficient history
  | 'rhythm_rebuilding'           // rhythm trajectory is 'stabilizing'
  | 'return_after_long_gap'       // returned after an unusually long gap
  | 'reliable_returner';          // returnReliability is 'resilient' with medium+ confidence

interface BehavioralMoment {
  type: MomentType;
  observation: string;            // factual, concise, non-congratulatory
}

// ─── Top-Level ────────────────────────────────────────────────────────────────

export interface BehavioralProfile {
  gaps: GapProfile;
  rhythm: RhythmStability;
  recovery: RecoveryState;
  returnReliability: ReturnReliability;
  moments: BehavioralMoment[];    // max MAX_MOMENTS, priority-ordered

  // Future domains — add as optional fields here:
  // bodyPattern?: BodyPattern;
}
```

---

## Computation Logic

### computeGapProfile

```
1. Sort activities by performed_at ascending.
2. Find consecutive pairs where differenceInDays > GAP_DEFINITION_DAYS.
   → Each qualifying span is a "completed gap" if followed by an activity.
3. gapHistory = last GAP_HISTORY_SIZE completed gaps (oldest→newest).
4. lastGapDays = differenceInDays(now, lastActivity.performed_at).
5. avgGapDays = mean(gapHistory), 0 if empty.

trend:
  requires gapHistory.length ≥ 2; else 'insufficient_data'
  last completed gap < avgGapDays × TREND_SHRINKING_FACTOR → 'shrinking'
  last completed gap > avgGapDays × TREND_GROWING_FACTOR  → 'growing'
  otherwise → 'stable'

observation:
  fires only when trend === 'shrinking' AND lastGapDays < avgGapDays × FASTER_RETURN_FACTOR:
  → "Back in {lastGapDays} days — {avgGapDays} is your usual."
  No observation for 'growing' — RecoveryState handles that signal.
  Null otherwise.

confidence:
  gapHistory.length === 0 → 'low'
  gapHistory.length 1–2   → 'low'
  gapHistory.length 3–4   → 'medium'
  gapHistory.length ≥ 5   → 'high'
```

### computeRhythmStability

```
1. Compute sessions per week for last RHYTHM_WINDOW_WEEKS weeks (oldest→newest).
2. weeklyVariance = population variance of that array.
3. avgWeeklySessions = mean of that array.
4. Split into firstHalf (weeks 1–4) and secondHalf (weeks 5–8).
5. Compute variance of each half independently.

trajectory:
  activeWeeks (weeks with count > 0) < 2 → 'insufficient_data'
  secondVariance < firstVariance × STABILIZING_VARIANCE_FACTOR
    AND weeklyVariance < STABLE_VARIANCE_MAX → 'stabilizing'
  weeklyVariance < STABLE_VARIANCE_MAX
    AND avgWeeklySessions ≥ STABLE_AVG_SESSIONS_MIN → 'stable'
  secondVariance > firstVariance × FRAGMENTING_VARIANCE_FACTOR → 'fragmenting'
  secondVariance < firstVariance
    AND secondHalf has at least 1 active week → 'rebuilding'
  otherwise → 'insufficient_data'

observation:
  'stabilizing' → "More consistent across recent weeks than the month before."
  'stable'      → "Consistent week-to-week. Weeks like these compound."
  null otherwise.

confidence:
  activeWeeks < 2 → 'low'
  activeWeeks 2–4 → 'medium'
  activeWeeks ≥ 5 → 'high'
```

### computeRecoveryState

```
daysSinceLast = differenceInDays(now, activities[0].performed_at)
             = 999 if no activities

latestReflection = reflections sorted by week_start descending, first entry
wellnessData = parseWellness(latestReflection.notes) — may be null

isExtendedAbsence:
  daysSinceLast > EXTENDED_ABSENCE_DAYS

isPatternDisrupted:
  last CONSECUTIVE_UNMET_THRESHOLD intentions (with non-null met) all have met === false
  AND daysSinceLast > PATTERN_DISRUPTED_GAP_DAYS

isHighStressSignal:
  wellnessData !== null
  AND wellnessData.stress ≥ HIGH_STRESS_THRESHOLD
  AND wellnessData.soreness ≥ HIGH_SORENESS_THRESHOLD
  AND daysSinceLast > HIGH_STRESS_GAP_DAYS

signal (first match wins):
  isExtendedAbsence → 'extended_absence'
  isPatternDisrupted → 'pattern_disruption'
  isHighStressSignal → 'high_stress_signal'
  daysSinceLast in [4, 10] → 'returning'
  avgWeeklySessions > 2 AND daysSinceLast < 4 → 'thriving'
  otherwise → 'stable'

reEntryReadiness:
  isExtendedAbsence OR isPatternDisrupted → 'low'
  isHighStressSignal OR daysSinceLast > 7 → 'medium'
  otherwise → 'high'

confidence:
  no reflection data OR latestReflection.week_start < 3 weeks ago → 'low'
  recent reflection + daysSinceLast < 7 → 'high'
  otherwise → 'medium'
```

Note: `isPatternDisrupted` only fires when there are at least `CONSECUTIVE_UNMET_THRESHOLD` intentions with non-null `met`. No intentions = no signal, not a false positive.

### computeReturnReliability

```
1. Compute all completed gaps from activities (same gap-detection as computeGapProfile).
2. gapCount = completed gaps total.
3. longestGapDays = max of all completed gaps (0 if none).
4. trackedMonths = months between first activity and now (clamped to 12).
5. activeMonths = count of calendar months (trailing 12) with ≥ 1 activity.
6. activeRatio = activeMonths / max(trackedMonths, 1).

label:
  gapCount < 2 → 'insufficient_data'

  avgGapDays ≤ ANCHORED_AVG_GAP_MAX
    AND activeRatio ≥ ANCHORED_ACTIVE_RATIO_MIN → 'anchored'

  gapCount ≥ 2
    AND gaps.trend in ('shrinking', 'stable')
    AND activeRatio ≥ RESILIENT_ACTIVE_RATIO_MIN → 'resilient'

  activeRatio ≥ INTERMITTENT_ACTIVE_RATIO_MIN → 'intermittent'

  (gapCount ≥ FRAGMENTED_GAP_COUNT_MIN AND avgGapDays ≥ FRAGMENTED_AVG_GAP_MIN)
    OR activeRatio < INTERMITTENT_ACTIVE_RATIO_MIN → 'fragmented'

confidence:
  gapCount < 2 → 'low'
  gapCount 2–4 → 'medium'
  gapCount ≥ 5 → 'high'
```

`returnReliability` uses `gaps.avgGapDays` and `gaps.trend` passed from `computeGapProfile` — the gap detection runs once and is shared.

### detectBehavioralMoments

Evaluated in priority order. First `MAX_MOMENTS` that match are returned.

```
1. reliable_returner (highest priority — most enduring signal)
   returnReliability.label === 'resilient'
   AND returnReliability.confidence in ('medium', 'high')
   → "You've returned after every extended gap. That pattern is harder to build than it looks."

2. faster_return
   gapHistory.length ≥ 2
   AND last completed gap < avgGapDays × FASTER_RETURN_FACTOR
   AND gaps.confidence !== 'low'
   → "Back in {N} days — {avg} is your usual gap."

3. staying_connected
   latestReflection.energy ≤ DIFFICULT_WEEK_ENERGY_MAX
     OR wellness.motivation ≤ DIFFICULT_WEEK_ENERGY_MAX
   AND ≥ 1 activity logged during that reflection week
   → "You stayed connected during a low-energy week."

4. intention_followed
   most recent intention with met === true exists
   → "You followed through: '{description}'."
   description capped at 40 chars: description.slice(0, 40) + (description.length > 40 ? '…' : '')

5. gaps_narrowing
   gaps.trend === 'shrinking'
   AND gapHistory.length ≥ 3
   AND gaps.confidence !== 'low'
   → "The time between your sessions is getting shorter."

6. rhythm_rebuilding
   rhythm.trajectory === 'stabilizing'
   AND rhythm.confidence !== 'low'
   → "More consistent recently than a month ago."

7. return_after_long_gap (lowest priority — least nuanced)
   daysSinceLast was > EXTENDED_ABSENCE_DAYS (recovery.isExtendedAbsence was true last cycle)
   AND now daysSinceLast < GAP_DEFINITION_DAYS (just returned)
   → "Back after an extended gap. The return is the move."
```

`return_after_long_gap` requires comparing current vs prior state. Implementation note: detect it by checking if the most recent completed gap in `gapHistory` > `EXTENDED_ABSENCE_DAYS` AND `lastGapDays` < `GAP_DEFINITION_DAYS`.

---

## Confidence and Consumer Behavior

Consumers (3A-2 home screen, 3A-3 notifications) must respect confidence levels:

| Confidence | Consumer behavior |
|-----------|------------------|
| `low` | Do not surface the signal in UI. Use internally for state detection only. |
| `medium` | Surface hedged — directional, not declarative. ("Your rhythm seems to be settling.") |
| `high` | Surface directly. ("Your rhythm is more consistent than last month.") |

The `gaps` domain is an exception: its observations already fire only on `medium`/`high` confidence (gapHistory.length ≥ 3). No further gating needed.

---

## Integration

`computeBehavioralProfile` is a pure function. It is consumed in HomeScreen via a `useMemo`:

```ts
const behavioralProfile = useMemo(
  () => computeBehavioralProfile(activities, reflections, intentions),
  [activities, reflections, intentions],
);
```

This follows the same pattern as `computeMovementState` and `computeRhythmScore` already in HomeScreen. No new hooks, no new stores.

---

## Copy Principles

All `observation` strings must be:
- **Factual** — state what happened, not what it means emotionally
- **Concise** — one sentence maximum
- **Non-congratulatory** — "Back in 8 days." not "Amazing comeback!"
- **Non-diagnostic** — "Extended gap." not "You've lost momentum."
- **Present the data** — numbers when available ("8 days", "your usual 14")

---

## Non-Goals

This spec does NOT include:
- Any UI changes (that is 3A-2)
- Notification logic (that is 3A-3)
- Supabase reads or writes
- New Zustand stores
- Any component rendering
- Schema changes

`behavioralProfile.ts` is a pure utility. No side effects, no imports from stores or services.

---

## Files

| File | Action |
|------|--------|
| `src/utils/behavioralProfile.ts` | Create — all computation logic and types |
| `__tests__/behavioralProfile.test.ts` | Create — unit tests for all sub-functions |

No other files change in 3A-1.
