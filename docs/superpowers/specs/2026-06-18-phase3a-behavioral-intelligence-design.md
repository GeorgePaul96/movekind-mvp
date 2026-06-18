# Phase 3A (Spec A) — Behavioral Intelligence Engine + Home Surface

**Date:** 2026-06-18
**Status:** Approved design, not yet implemented
**Supersedes:** the original Phase 3A-1 design, which targeted the now-deleted
activity-logging app (`Activity[]` / `Reflection[]` / `Intention[]`). This spec re-derives
the behavioral layer against the current **session-based** schema.

## Context

MoveKind's emotional core: **"We help people return."** The behavioral layer reads a user's
history and surfaces psychologically intelligent, anti-guilt signals (gaps, rhythm, recovery,
wins) — never streaks, never shame.

The app was rewritten from activity-logging to an adaptive guided-session model
(commit `2234dbb`). Available data is now:

- `sessions` — `created_at`, `state` (`overloaded|recovering|regulated|activated`),
  `status` (`generated|started|completed|abandoned`)
- `check_ins` — `energy_score` (1–5), `sleep_quality` (`good|fair|poor|null`), `created_at`
- `post_ratings` — `rating_delta` (−1..2), `notes`, `created_at`

No subjective stress/soreness/motivation inputs exist, and there are no intentions/goals.
**Decision: recovery is inferred from behavioral + check-in data only. No schema changes.**

## Scope

**In scope (Spec A):**
1. Pure computation engine in `src/domain/behavioral/`.
2. A data-fetch hook `useBehavioralProfile()`.
3. A `BehavioralBanner` surfaced on `HomeScreen` (one dominant message + one insight).

**Out of scope (future Spec B / later sub-projects):** dedicated behavioral-insights view,
charts, adaptive notifications (3A-3), intention continuity (3A-4).

## Architecture

Approach: **small focused pure functions + a thin orchestrator** (mirrors the existing
`src/domain/sessions/composer.ts` pattern — the most valuable tested code in the repo).

```
src/domain/behavioral/
  types.ts        # GapProfile, RhythmStability, RecoveryState, SelfEfficacyWin, BehavioralProfile
  gaps.ts         # computeGapProfile(sessions, now)
  rhythm.ts       # computeRhythm(sessions, now)
  recovery.ts     # computeRecovery(sessions, checkIns, gaps, rhythm, now)
  wins.ts         # detectWins(sessions, checkIns, gaps, rhythm)
  index.ts        # computeBehavioralProfile(...) orchestrator + re-exports

src/hooks/useBehavioralProfile.ts   # fetch history + memoized compute → { profile, loading }
src/components/BehavioralBanner.tsx  # dominant message + one insight
# HomeScreen.tsx renders <BehavioralBanner /> above the check-in CTA
__tests__/behavioral.test.ts         # unit tests for the pure functions
```

**Dependency rule:** `src/domain/behavioral/**` imports only from `src/types`. No React, no
Supabase, no I/O. All data is passed in. This keeps it unit-testable in isolation.

## Data model

```ts
interface GapProfile {
  hasHistory: boolean;
  lastGapDays: number;          // whole days from the most recent completed session to `now`
  avgGapDays: number;
  gapHistory: number[];         // last 5 gaps, oldest → newest
  trend: 'shrinking' | 'stable' | 'growing' | 'insufficient_data';
  observation: string | null;
}

interface RhythmStability {
  weeklyVariance: number;
  avgWeeklySessions: number;
  trajectory: 'stabilizing' | 'stable' | 'fragmenting' | 'rebuilding' | 'insufficient_data';
  observation: string | null;
}

type RecoverySignal =
  | 'collapse' | 'spiral' | 'burnout_risk' | 'returning' | 'stable' | 'thriving';

interface RecoveryState {
  signal: RecoverySignal;
  isMotivationalCollapse: boolean;
  isAvoidanceSpiral: boolean;
  isBurnoutRisk: boolean;
  reEntryReadiness: 'high' | 'medium' | 'low';
}

type WinType =
  | 'faster_return'
  | 'difficult_week_log'      // completed a session from an `overloaded` check-in
  | 'gap_shrinking'
  | 'rhythm_stabilizing';
// NOTE: `intention_kept` from the original design is DROPPED — no intentions exist.

interface SelfEfficacyWin {
  type: WinType;
  observation: string;        // always present (hybrid copy: data + human-readable line)
}

interface BehavioralProfile {
  gaps: GapProfile;
  rhythm: RhythmStability;
  recovery: RecoveryState;
  wins: SelfEfficacyWin[];     // max 3, most recent first
}

function computeBehavioralProfile(
  sessions: Session[],         // completed + abandoned, newest or oldest order normalized internally
  checkIns: CheckIn[],
  ratings: PostRating[],
  now?: Date,
): BehavioralProfile
```

## Signal definitions

**Gap** = inactivity > **3 days** between consecutive sessions (unchanged from original).
Gaps are computed from **completed** sessions' `created_at`.

### GapProfile
- `gapHistory`: the last 5 inter-session gaps (in days), oldest → newest.
- `trend`: compare recent gaps to earlier ones — `shrinking` if decreasing, `growing` if
  increasing, `stable` if roughly flat, `insufficient_data` if fewer than 3 gaps.

### RhythmStability
- Bucket sessions into ISO weeks over the fetched window; `avgWeeklySessions` = mean,
  `weeklyVariance` = variance of weekly counts.
- `trajectory`: `stabilizing` (variance trending down), `stable` (consistently low variance),
  `fragmenting` (variance trending up / frequency dropping), `rebuilding` (resuming after a
  gap), `insufficient_data` (< 2 weeks of history).

### RecoveryState (behavioral inference only)
| Field | Rule |
|---|---|
| `isMotivationalCollapse` | last gap > 10 days **AND** latest `check_in.energy_score ≤ 2` |
| `isAvoidanceSpiral` | ≥ 2 consecutive `abandoned` sessions (no completion between) **AND** current gap > 7 days |
| `isBurnoutRisk` | ≥ 3 recent check-ins with `energy_score ≤ 2` **AND** declining session frequency, OR sustained poor `sleep_quality` alongside low energy |
| `reEntryReadiness` | after a gap: `high` if latest check-in energy ≥ 4 & sleep good; `low` if energy ≤ 2 or sleep poor; else `medium` |
| `signal` | priority order: `collapse` (isMotivationalCollapse) → `spiral` (isAvoidanceSpiral) → `burnout_risk` → `returning` (a session within ~2 days following a > 3-day gap) → `thriving` (regular rhythm AND avg recent `rating_delta` > 0) → `stable` (default with history). No history → `returning` framing for first-timers. |

### Wins (max 3, most recent first)
| Win | Condition |
|---|---|
| `faster_return` | most recent gap < `avgGapDays` (and history exists) |
| `difficult_week_log` | a completed session whose linked check-in mapped to `overloaded` |
| `gap_shrinking` | `gaps.trend === 'shrinking'` |
| `rhythm_stabilizing` | `rhythm.trajectory` is `stabilizing` or `stable` |

Each win carries an always-present `observation` string. Wins are ordered by recency of the
underlying event.

## Data hook

`useBehavioralProfile()`:
- On mount (authenticated), fetches for the current user:
  - `sessions` where `status in ('completed','abandoned')`, `created_at >= now - 90 days`,
    ordered, **capped at 200 rows**.
  - `check_ins` and `post_ratings` over the same window.
- Memoizes `computeBehavioralProfile(sessions, checkIns, ratings)` (recompute only when inputs change).
- Returns `{ profile, loading }`. On fetch error → `profile` with `hasHistory: false`
  (graceful empty state), `loading: false`.
- Read-only; performs no writes. Follows the existing service/query patterns in `sessionStore.ts`.

## Home surface — `BehavioralBanner`

- **Dominant message:** the most recent win's `observation`.
  **Fallback when `wins` is empty:** recovery-signal copy —
  - `returning` / no history → gentle "welcome back" / "glad you're here"
  - `collapse` / `spiral` / `burnout_risk` → soft, non-judgmental re-entry nudge
  - `thriving` → quiet celebration
  - `stable` → calm acknowledgement
- **One insight line:** a `recovery` or `rhythm` observation (whichever is most relevant).
- **Anti-guilt rules (non-negotiable):** never display streaks, counts-as-pressure, or
  language that punishes gaps. A long gap renders as a welcome-back, never a failure.
- **Styling:** colors only from `src/constants/colors.ts` (`sageDark` #3A6B4A for accessible
  active text). All user-facing strings added to `src/constants/copy.ts`.
- Renders above the existing check-in CTA on `HomeScreen`. The CTA remains the single action.
- Renders nothing (or a minimal welcome) while `loading` or when there is no meaningful signal.

## Error handling

- Pure functions never throw on empty/partial input: empty arrays → `hasHistory: false`,
  `insufficient_data` trends, `signal: 'returning'`, `wins: []`.
- Hook swallows fetch errors and degrades to the empty profile (consistent with the app's
  best-effort `services/*` patterns).
- Banner has a safe empty render path.

## Testing

`__tests__/behavioral.test.ts` (Jest, like `composer.test.ts`), covering:
- No history → empty/insufficient profile, no throw.
- Gap math: known timestamps → expected `gapHistory`, `avgGapDays`, `trend`.
- Rhythm: weekly bucketing + variance + each trajectory.
- Recovery: each boolean flag's threshold, and `signal` priority ordering.
- Wins: each win condition fires; `intention_kept` never appears; max 3 enforced; recency order.

Component-level: a light render test that `BehavioralBanner` shows the win message when a win
exists and the recovery fallback when none does.

## Conventions & guardrails

- Import via `@/` alias. Pure layer depends only on `@/types`.
- No changes to `composer.ts`, the schema, or existing store behavior.
- `ENGINE_VERSION` is unaffected (no change to session composition).
- Verify with `npm run typecheck` and `npm test`.

## Open follow-ups (not this spec)
- Spec B: dedicated behavioral-insights view + charts.
- 3A-3: feed `RecoveryState` into adaptive notification copy.
- Tuning thresholds (10-day collapse, 7-day spiral, 3-day gap) against real usage data.
