# 3A-4 — Self-Trust via Follow-Through

**Date:** 2026-06-21
**Status:** Approved design, not yet implemented
**Builds on:** the Phase 3A behavioral engine
([2026-06-18-phase3a-behavioral-intelligence-design.md](2026-06-18-phase3a-behavioral-intelligence-design.md))
and Spec B's JourneyScreen insights
([2026-06-21-spec-b-behavioral-insights-design.md](2026-06-21-spec-b-behavioral-insights-design.md)),
both merged to `main`.

## Context

The original 3A-4 ("Intention Continuity + Self-Trust") was designed against the deleted
activity-logging app, around user-set `Intention[]` records that do not exist in the current
session-based app. The current app has **no intention/goal-setting feature**, so the spec is
re-derived around the data we do have.

The closest existing signal to "intention + continuity" is **follow-through**: a check-in
generates a session (`generated`) the user then either **completes** or **abandons**. The rate
at which started sessions are completed is a self-trust signal — *"when you start, you finish."*
3A-4 computes that and surfaces it longitudinally, in the anti-guilt frame: **starting always
counts; low completion is never shamed.**

## Scope

**In scope:**
1. A pure `computeFollowThrough(sessions)` function + `FollowThrough` type, added to the engine.
2. `followThrough` added to `BehavioralProfile` and computed in `computeBehavioralProfile`.
3. A "Self-Trust" `Card` on `JourneyScreen`, driven by the existing `useBehavioralProfile()` hook.

**Out of scope:** an actual intention-setting feature (would need schema + UI), HomeScreen banner
changes, any follow-through "win" type, any schema change, any `ENGINE_VERSION` change.

## Engine change (pure, additive)

New file `src/domain/behavioral/followThrough.ts`:

```ts
import type { Session } from '@/types';
import type { FollowThrough } from './types';

export function computeFollowThrough(sessions: Session[]): FollowThrough
```

`FollowThrough` (added to `src/domain/behavioral/types.ts`):

```ts
export interface FollowThrough {
  completed: number;
  abandoned: number;
  total: number;            // terminal sessions = completed + abandoned
  completionRate: number;   // completed / total, 0 when total === 0 (rounded to 2 dp)
  hasHistory: boolean;      // total > 0
  trend: 'building' | 'steady' | 'wavering' | 'insufficient_data';
  observation: string | null;
}
```

`BehavioralProfile` gains `followThrough: FollowThrough`; `computeBehavioralProfile` calls
`computeFollowThrough(sessions)` and includes it.

The `observation` string is built inside the function, consistent with how `gaps.ts`/`rhythm.ts`
embed their observations (the engine, not `copy.ts`, owns these).

### Logic

- Terminal sessions = those with `status === 'completed'` or `status === 'abandoned'`.
  `completed`/`abandoned` are the respective counts; `total = completed + abandoned`.
- `completionRate = total === 0 ? 0 : round(completed / total, 2)`.
- `hasHistory = total > 0`.
- **trend** (longitudinal "continuity"): sort terminal sessions oldest→newest; if `total < 4` →
  `insufficient_data`. Else split by count into earlier half / recent half; compare each half's
  completion rate with tolerance `0.15`: recent `>` earlier + tol → `building`; recent `<`
  earlier − tol → `wavering`; else `steady`.
- **observation** (always anti-guilt; `null` only when `!hasHistory`), by `completionRate` band,
  with a `building`-trend nuance:
  - `>= 0.8`: `"You finish what you start — about {pct}% of the sessions you begin."`
  - `>= 0.5`: `"You complete around {pct}% of the sessions you start. That's real follow-through."`
  - `< 0.5`: `"Starting counts too — every session you begin builds trust ({pct}% completed so far)."`
  - if `trend === 'building'`, append `" And it's been climbing lately."`
  - `{pct}` = `Math.round(completionRate * 100)`.

## UI — "Self-Trust" card on JourneyScreen

Reuses `const { profile } = useBehavioralProfile();` (already on the screen). New `Card` placed
among the behavioral sections (after "Recent Wins"):

- **Has history** (`profile.followThrough.hasHistory`): a percentage stat
  (`{pct}% completed`) reusing the existing summary-box style, plus the `observation` line, plus
  a small "{completed} of {total} started sessions finished" subline.
- **Empty** (no profile or `!hasHistory`): gentle copy — `"Your follow-through shows here once
  you've finished a few sessions."`
- Colors only from `@/constants/colors`; the stat uses `sageDark` for the accessible value text.

No new `copy.ts` entries are required (observation comes from the engine; the section title and
empty line are inline UI labels, consistent with the other Journey sections).

## Data flow

```
JourneyScreen → useBehavioralProfile() → profile
   └─ profile.followThrough.{completionRate, observation, completed, total, hasHistory}
        → "Self-Trust" Card
computeBehavioralProfile(sessions, checkIns, ratings)
   └─ computeFollowThrough(sessions) → followThrough
```

## Error / empty handling

- `computeFollowThrough([])` → `{ completed: 0, abandoned: 0, total: 0, completionRate: 0,
  hasHistory: false, trend: 'insufficient_data', observation: null }`; never throws.
- The card guards on `profile && profile.followThrough.hasHistory`; null profile → empty copy.

## Testing

- **Engine:** extend `__tests__/behavioral.test.ts` — `computeFollowThrough`:
  - empty → no history, `insufficient_data`, `observation === null`;
  - known mix (e.g. 4 completed / 1 abandoned) → `completed:4, abandoned:1, total:5,
    completionRate:0.8, hasHistory:true`, observation non-null;
  - a `building` fixture (earlier half mostly abandoned, recent half mostly completed, total ≥ 4)
    → `trend: 'building'`.
  - Orchestrator test: assert `computeBehavioralProfile(...)` output has a `followThrough` object.
- **Ripple:** the inline `BehavioralProfile` literal in `__tests__/BehavioralBanner.test.tsx`
  gains a `followThrough` field (else typecheck fails). Any `BehavioralProfile` fixture must
  include it.
- **Screen:** `JourneyScreen` does network I/O and is not unit-tested (consistent with prior
  phases); verified via full suite + `npm run typecheck` + documented manual checks (new user →
  empty copy; account with mixed completed/abandoned → the percentage + observation).

## Conventions & guardrails

- Pure layer stays pure: `followThrough.ts` imports only `@/types` + sibling `./types`.
- Do not touch the existing JourneyScreen sections, the dead query at `JourneyScreen.tsx:65`, or
  `ENGINE_VERSION`.
- Verify with `npm run typecheck` and `npm test`.

## Open follow-ups (not this spec)
- A real intention-setting feature (set an intention at check-in; track follow-through against it)
  — separate, larger project needing schema + UI.
- The previously logged cleanup: move `fetchBehavioralProfile` from `hooks/` to `services/`.
