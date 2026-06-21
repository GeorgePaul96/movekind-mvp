# Spec B — Behavioral Insights on JourneyScreen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface the Phase 3A behavioral engine's signals over time inside the existing `JourneyScreen`, via one additive engine change plus four new presentational sections.

**Architecture:** Add a `weeklyCounts` series to the pure `RhythmStability` type (the data `rhythm.ts` already computes internally), then consume the existing `useBehavioralProfile()` hook in `JourneyScreen` to render four `Card` sections using the dependency-free `BarChart`. Existing Journey sections are untouched.

**Tech Stack:** TypeScript (strict), React Native / Expo, Jest. Reuses `useBehavioralProfile`, `BarChart`, `Card`, `colors`, `copy`.

## Global Constraints

- Pure layer purity: `src/domain/behavioral/**` imports only from `@/types` (type-only) + siblings. No React/Supabase/I/O; time only via injectable `now`. The `rhythm.ts` change adds no imports.
- No schema changes. No change to `ENGINE_VERSION`.
- Colors only from `@/constants/colors` (no hardcoded hex; `sageDark` `#3A6B4A` for accessible active text). User-facing strings in `@/constants/copy`.
- Anti-guilt: never label a gap a failure; never show a "no wins" message (omit the section instead). No streaks.
- Import alias: source uses `@/...`; test files use relative `../src/...`.
- Do NOT modify or "fix" the existing State Distribution / Personal Playbook sections or the known dead query at `JourneyScreen.tsx:65`.
- Reuse the existing dependency-free `BarChart` (`src/components/BarChart.tsx`); do NOT add Victory Native.
- Verify with `npm run typecheck` and `npm test`.

## File Structure

- Modify `src/domain/behavioral/types.ts` — add `weeklyCounts: number[]` to `RhythmStability`.
- Modify `src/domain/behavioral/rhythm.ts` — return `weeklyCounts` in both branches.
- Modify `__tests__/behavioral.test.ts` — update `rhythmProfile` factory default; add a `weeklyCounts` test.
- Modify `__tests__/BehavioralBanner.test.tsx` — add `weeklyCounts: []` to its inline `rhythm` literal (else typecheck breaks).
- Modify `src/constants/copy.ts` — add `RE_ENTRY_READINESS`.
- Modify `src/screens/main/JourneyScreen.tsx` — call the hook; render four new sections + styles.

---

### Task 1: Expose `weeklyCounts` from the rhythm engine

**Files:**
- Modify: `src/domain/behavioral/types.ts`
- Modify: `src/domain/behavioral/rhythm.ts`
- Modify: `__tests__/behavioral.test.ts` (factory default + new test)
- Modify: `__tests__/BehavioralBanner.test.tsx` (fixture field)

**Interfaces:**
- Produces: `RhythmStability` gains `weeklyCounts: number[]` (weekly session counts, oldest → newest, ≤ 8 entries). `computeRhythm(sessions, now?)` returns it.

- [ ] **Step 1: Write the failing test**

In `__tests__/behavioral.test.ts`, add this test inside the existing `describe('computeRhythm', ...)` block (after its last test, before the block's closing `});`):

```ts
  test('exposes weeklyCounts series (oldest → newest)', () => {
    expect(computeRhythm([], NOW).weeklyCounts).toEqual([]);
    const sessions = [1, 3, 8, 10, 15, 17, 22, 24].map((d) => session({ created_at: daysAgo(d) }));
    expect(computeRhythm(sessions, NOW).weeklyCounts).toEqual([2, 2, 2, 2]);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- behavioral`
Expected: FAIL — the new test fails because `weeklyCounts` is `undefined` (`undefined` is not `[]` / not `[2,2,2,2]`). All other behavioral tests still pass.

- [ ] **Step 3: Add the field to the type**

In `src/domain/behavioral/types.ts`, add `weeklyCounts` to `RhythmStability` (place it after `avgWeeklySessions`):

```ts
export interface RhythmStability {
  weeklyVariance: number;
  avgWeeklySessions: number;
  weeklyCounts: number[];
  trajectory: 'stabilizing' | 'stable' | 'fragmenting' | 'rebuilding' | 'insufficient_data';
  observation: string | null;
}
```

- [ ] **Step 4: Return it from `rhythm.ts`**

In `src/domain/behavioral/rhythm.ts`, update BOTH return statements.

Empty-history branch (currently `return { weeklyVariance: 0, avgWeeklySessions: 0, trajectory: 'insufficient_data', observation: null };`):

```ts
    return { weeklyVariance: 0, avgWeeklySessions: 0, weeklyCounts: [], trajectory: 'insufficient_data', observation: null };
```

Final return (currently `return { weeklyVariance, avgWeeklySessions, trajectory, observation };`):

```ts
  return { weeklyVariance, avgWeeklySessions, weeklyCounts: counts, trajectory, observation };
```

- [ ] **Step 5: Update the test factory and the banner test fixture**

In `__tests__/behavioral.test.ts`, update the `rhythmProfile` factory default to include the new field:

```ts
function rhythmProfile(o: Partial<RhythmStability> = {}): RhythmStability {
  return { weeklyVariance: 0, avgWeeklySessions: 2, weeklyCounts: [], trajectory: 'stable', observation: null, ...o };
}
```

In `__tests__/BehavioralBanner.test.tsx`, find the `rhythm:` object inside the `base` profile fixture and add `weeklyCounts: []` to it (any position within the object literal). For example, if it reads:

```tsx
  rhythm: { weeklyVariance: 0, avgWeeklySessions: 2, trajectory: 'stable', observation: 'Your weekly rhythm is steady.' },
```

change it to:

```tsx
  rhythm: { weeklyVariance: 0, avgWeeklySessions: 2, weeklyCounts: [], trajectory: 'stable', observation: 'Your weekly rhythm is steady.' },
```

- [ ] **Step 6: Run tests and typecheck**

Run: `npm test -- behavioral`
Expected: PASS (new `weeklyCounts` test green, all others still green).
Run: `npm test`
Expected: PASS — all 5 suites (the banner test must still pass and typecheck-compatible).
Run: `npm run typecheck`
Expected: no errors. (If `tsc` reports a missing `weeklyCounts` on some other `RhythmStability` literal, add `weeklyCounts: []` there too and re-run.)

- [ ] **Step 7: Commit**

```bash
git add src/domain/behavioral/types.ts src/domain/behavioral/rhythm.ts __tests__/behavioral.test.ts __tests__/BehavioralBanner.test.tsx
git commit -m "feat(behavioral): expose weeklyCounts series from rhythm engine"
```

---

### Task 2: Behavioral insight sections on JourneyScreen

**Files:**
- Modify: `src/constants/copy.ts` (add `RE_ENTRY_READINESS`)
- Modify: `src/screens/main/JourneyScreen.tsx` (hook + four sections + styles)

**Interfaces:**
- Consumes: `useBehavioralProfile()` → `{ profile: BehavioralProfile | null }`; `BehavioralProfile` fields `rhythm.weeklyCounts`, `rhythm.observation`, `gaps.gapHistory`, `gaps.observation`, `recovery.signal`, `recovery.reEntryReadiness`, `wins[].observation`. `BarChart` props `{ data: {label,value}[], color, highlightColor?, unit? }`. `BEHAVIORAL_FALLBACK: Record<RecoverySignal,{message:string}>` from `copy.ts`.
- Produces: `RE_ENTRY_READINESS: Record<'high'|'medium'|'low', string>`.

- [ ] **Step 1: Add the readiness copy**

Append to `src/constants/copy.ts` (the `RecoverySignal` import added in Phase 3A is already at the top of this file):

```ts
export const RE_ENTRY_READINESS: Record<'high' | 'medium' | 'low', string> = {
  high: 'Your body looks ready for a fuller session today.',
  medium: 'Meet yourself where you are — a moderate session fits today.',
  low: 'Gentle is enough today. Honor what your body is asking for.',
};
```

- [ ] **Step 2: Import the hook, chart, and copy in JourneyScreen**

In `src/screens/main/JourneyScreen.tsx`, add these imports after the existing import block (after the `import type { UserState } from '@/types';` line):

```tsx
import { BarChart } from '@/components/BarChart';
import { useBehavioralProfile } from '@/hooks/useBehavioralProfile';
import { BEHAVIORAL_FALLBACK, RE_ENTRY_READINESS } from '@/constants/copy';
```

- [ ] **Step 3: Call the hook in the component**

In `JourneyScreen`, add the hook call immediately after the existing `const user = useAuthStore((s) => s.user);` line:

```tsx
  const { profile } = useBehavioralProfile();
```

- [ ] **Step 4: Render the four sections**

In the returned JSX, insert the following block immediately BEFORE the closing `</ScrollView>` tag (i.e. after the existing "Personal Playbook" `</Card>`):

```tsx
        {/* --- Behavioral Insights (Spec B) --- */}
        <Card style={{ marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>Rhythm Over Time</Text>
          {profile && profile.rhythm.weeklyCounts.length > 0 ? (
            <View>
              <Text style={styles.sectionDesc}>Sessions per week as you return:</Text>
              <BarChart
                data={profile.rhythm.weeklyCounts.map((v, i) => ({ label: `W${i + 1}`, value: v }))}
                color={colors.sageMid}
                highlightColor={colors.sage}
                unit="sessions / week"
              />
              {profile.rhythm.observation ? (
                <Text style={styles.insightLine}>{profile.rhythm.observation}</Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.sectionDesc}>Your weekly rhythm will appear here as you return.</Text>
          )}
        </Card>

        <Card style={{ marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>Return Rhythm</Text>
          {profile && profile.gaps.gapHistory.length > 0 ? (
            <View>
              <Text style={styles.sectionDesc}>Days between your recent sessions:</Text>
              <BarChart
                data={profile.gaps.gapHistory.map((v, i) => ({ label: `${i + 1}`, value: v }))}
                color={colors.sky}
                unit="days between sessions"
              />
              {profile.gaps.observation ? (
                <Text style={styles.insightLine}>{profile.gaps.observation}</Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.sectionDesc}>We'll show the rhythm of your returns here.</Text>
          )}
        </Card>

        {profile ? (
          <Card style={{ marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>Where You Are Now</Text>
            <Text style={styles.recoveryMessage}>{BEHAVIORAL_FALLBACK[profile.recovery.signal].message}</Text>
            <Text style={styles.insightLine}>{RE_ENTRY_READINESS[profile.recovery.reEntryReadiness]}</Text>
          </Card>
        ) : null}

        {profile && profile.wins.length > 0 ? (
          <Card style={{ marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>Recent Wins</Text>
            {profile.wins.map((w, i) => (
              <View key={i} style={styles.winRow}>
                <Text style={{ fontSize: 16 }}>🌱</Text>
                <Text style={styles.winText}>{w.observation}</Text>
              </View>
            ))}
          </Card>
        ) : null}
```

- [ ] **Step 5: Add the new styles**

In the `StyleSheet.create({ ... })` at the bottom of `JourneyScreen.tsx`, add these three entries (e.g. after the existing `sectionDesc` entry):

```tsx
  insightLine: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 10,
    lineHeight: 16,
  },
  recoveryMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.sageDark,
    lineHeight: 20,
  },
  winRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  winText: {
    flex: 1,
    fontSize: 13,
    color: colors.ink,
    lineHeight: 18,
  },
```

- [ ] **Step 6: Verify typecheck and full suite**

Run: `npm run typecheck`
Expected: no errors.
Run: `npm test`
Expected: PASS — all 5 suites still green (this task adds no tests; `JourneyScreen` does network I/O and is not unit-tested, consistent with the `useBehavioralProfile` hook in Phase 3A).

- [ ] **Step 7: Manual verification (documented, no code)**

`JourneyScreen` does network I/O so it is not unit-tested. Verify manually:
- New account / no history → "Rhythm Over Time" and "Return Rhythm" show their gentle empty copy; "Where You Are Now" shows the `returning`/welcome message; "Recent Wins" is absent.
- Account with several completed sessions → "Rhythm Over Time" renders weekly bars, "Return Rhythm" renders gap bars, and any wins appear.
Note this in the commit body.

- [ ] **Step 8: Commit**

```bash
git add src/constants/copy.ts src/screens/main/JourneyScreen.tsx
git commit -m "feat(behavioral): behavioral insight sections on JourneyScreen

Adds rhythm-over-time, return-rhythm, recovery summary, and wins sections
driven by useBehavioralProfile + BarChart. Existing Journey sections
untouched. Manually verified empty-history and with-history states."
```

---

## Notes for the implementer

- Run `npm test -- behavioral` for fast engine feedback in Task 1; run full `npm test` + `npm run typecheck` before each commit.
- Keep `src/domain/behavioral/**` free of React/Supabase imports — the `rhythm.ts` change is data-only.
- Do not touch the existing Journey queries, the dead line at `JourneyScreen.tsx:65`, or `ENGINE_VERSION`.
- `BarChart` highlights the LAST bar when `highlightColor` is set — that is intentional for "Rhythm Over Time" (most recent week emphasized).
