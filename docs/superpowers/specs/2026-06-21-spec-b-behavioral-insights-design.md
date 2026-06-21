# Spec B — Behavioral Insights on JourneyScreen

**Date:** 2026-06-21
**Status:** Approved design, not yet implemented
**Builds on:** the Phase 3A behavioral engine
([2026-06-18-phase3a-behavioral-intelligence-design.md](2026-06-18-phase3a-behavioral-intelligence-design.md)),
which is merged to `main`.

## Context

Phase 3A shipped a pure behavioral-intelligence engine (`src/domain/behavioral/`) that
computes gaps, rhythm, recovery, and wins from session history, plus a `useBehavioralProfile()`
hook and a Home Screen banner. Spec B surfaces those signals **over time** in the existing
`JourneyScreen` ("Your State Journey"), so a user can see their return rhythm, not just today's
nudge. Emotional core unchanged: **"We help people return."** No streaks, no shame.

`JourneyScreen` already renders two sections with their own ad-hoc Supabase queries:
a "Nervous System States Distribution" breakdown and a "Personal Playbook." Those work and
read different data than the engine, so this spec **leaves them intact** and **adds** new
behavioral sections alongside them.

The repo's `BarChart` is a dependency-free pure-RN component (not Victory Native); Spec B reuses it.

## Scope

**In scope:**
1. One additive change to the pure engine: expose the weekly-count series from `RhythmStability`.
2. Four new presentational sections in `JourneyScreen`, driven by `useBehavioralProfile()`.

**Out of scope:** the existing State Distribution / Personal Playbook sections (including the
known dead/broken query line at `JourneyScreen.tsx:65` — leave it), Victory Native, notifications
(3A-3), any schema change.

## Engine change (pure, additive)

`rhythm.ts` already computes a `counts` array (weekly session counts, oldest→newest) internally
but discards it. Expose it so the chart can render it without duplicating the bucketing logic.

`src/domain/behavioral/types.ts` — add one field to `RhythmStability`:

```ts
export interface RhythmStability {
  weeklyVariance: number;
  avgWeeklySessions: number;
  weeklyCounts: number[];          // NEW: weekly session counts, oldest → newest (≤ 8 entries)
  trajectory: 'stabilizing' | 'stable' | 'fragmenting' | 'rebuilding' | 'insufficient_data';
  observation: string | null;
}
```

`src/domain/behavioral/rhythm.ts` — return `weeklyCounts: counts` in both the empty-history
branch (`[]`) and the main return.

**Ripple (must update in the same task):**
- The `rhythmProfile` test factory in `__tests__/behavioral.test.ts` gains `weeklyCounts: []`
  in its defaults.
- No change to `computeRecovery`/`detectWins` signatures — they receive the whole `RhythmStability`
  and ignore the new field.

This is the only logic change. Everything else is presentation.

## New JourneyScreen sections

`JourneyScreen` calls `const { profile } = useBehavioralProfile();` (same hook 3A-1 added — no new
fetching). It renders these four `Card` sections. When `profile` is null or a section's data is
empty/`insufficient_data`, that section shows a gentle empty line instead of a broken chart.

1. **Rhythm over time** — `BarChart` of `profile.rhythm.weeklyCounts` (one bar per recent week,
   label e.g. `W1…Wn`), with `profile.rhythm.observation` beneath. Empty/insufficient → "Your
   weekly rhythm will appear here as you return."

2. **Return rhythm (gaps)** — `BarChart` of `profile.gaps.gapHistory` (last 5 gaps, in days),
   `unit="days between sessions"`, with `profile.gaps.observation` beneath. Anti-guilt framing:
   never labels a gap a failure. No history → "We'll show the rhythm of your returns here."

3. **Where you are now** — a recovery summary card showing copy for `profile.recovery.signal`
   and a line for `reEntryReadiness`. Reuses `BEHAVIORAL_FALLBACK[signal].message` from
   `copy.ts` (single source of truth for signal copy). Adds a small readiness label map in
   `copy.ts` (`RE_ENTRY_READINESS: Record<'high'|'medium'|'low', string>`).

4. **Recent wins** — lists `profile.wins` (each `win.observation`). Empty → omit the section
   entirely (no "you have no wins" message — that would violate anti-guilt).

**Styling:** colors only from `@/constants/colors`; all new strings in `@/constants/copy`;
`@/` alias in source. Sections use the existing `Card` + `styles` idiom already in `JourneyScreen`.

## Data flow

```
JourneyScreen
  ├─ existing ad-hoc queries → State Distribution, Personal Playbook   (unchanged)
  └─ useBehavioralProfile() → profile
       ├─ rhythm.weeklyCounts → BarChart (Rhythm over time)
       ├─ gaps.gapHistory     → BarChart (Return rhythm)
       ├─ recovery.signal/readiness → copy → Where you are now
       └─ wins[]              → Recent wins list
```

## Error / empty handling

- The engine never throws on empty input (established in 3A-1); `weeklyCounts` is `[]` for
  no-history.
- Each new section guards its own data: empty array or `insufficient_data` trajectory →
  gentle copy, no chart. Null `profile` (hook still loading or errored) → all four sections
  render their empty state. No spinner gate is added for the behavioral sections — they fill in
  when the hook resolves, exactly like the Home banner.

## Testing

- **Engine:** extend `__tests__/behavioral.test.ts` — assert `computeRhythm` returns the
  expected `weeklyCounts` for the existing "steady 2/week across 4 weeks" fixture
  (`[2,2,2,2]`) and `[]` for empty input. Update the `rhythmProfile` factory default and the
  orchestrator assembly test if it inspects rhythm shape.
- **Screen:** `JourneyScreen` does network I/O and is not unit-tested (consistent with 3A-1's
  hook). Verification = full suite green + `npm run typecheck`, plus documented manual checks
  (new user shows empty states; an account with history shows the rhythm/gap charts and a
  recovery line).

## Conventions & guardrails

- Pure layer stays pure: the `rhythm.ts` change adds no imports, no I/O.
- No change to `ENGINE_VERSION` (session composition is untouched).
- Do not modify or "fix" the existing Journey queries or the dead line at `JourneyScreen.tsx:65`.
- Verify with `npm run typecheck` and `npm test`.

## Open follow-ups (not this spec)
- 3A-3: feed `RecoveryState` into adaptive notification copy.
- Optional later: replace the ad-hoc State Distribution / Playbook queries with engine-derived
  equivalents to unify Journey's data sources.
