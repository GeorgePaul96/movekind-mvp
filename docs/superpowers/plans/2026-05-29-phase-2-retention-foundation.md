# Phase 2: Retention Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the six Phase 2 retention mechanics — Rhythm Score, Rhythm Wave, Personal Bests, 2-day rule notification, Weekly Intention, and Quick Log — that together create the daily habit loop and early identity layer.

**Architecture:** Pure utility functions hold all computation logic (fully testable without React). React components consume utilities via props. The Supabase `intentions` table requires a one-time manual SQL migration before Task 6. All six features are independent; Tasks 1–5 can be done in any order. Task 6 requires the DB migration first. Task 7 requires Task 4 (personal bests events) to exist.

**Tech Stack:** TypeScript, React Native, Zustand, Supabase, expo-notifications, date-fns, Jest (tests in `__tests__/`)

---

## File Structure

### New files
| Path | Responsibility |
|---|---|
| `src/utils/rhythmScore.ts` | 28-day rolling score computation, weekly session counts |
| `src/components/RhythmWave.tsx` | 12-week wave bar chart visualization |
| `src/utils/personalBests.ts` | Personal best computation and new-best detection |
| `src/components/PersonalBestCard.tsx` | Celebration card shown after a personal best is beaten |
| `src/hooks/useNotificationSync.ts` | Schedules 2-day rule notification reactively |
| `src/services/intentions.ts` | Supabase CRUD for the `intentions` table |
| `src/store/intentionStore.ts` | Zustand store for weekly intentions |
| `src/components/IntentionPrompt.tsx` | Intention-setting UI shown inside ReflectScreen |
| `src/components/QuickLogBar.tsx` | One-tap log bar on HomeScreen |
| `__tests__/rhythmScore.test.ts` | Unit tests for rhythm score utilities |
| `__tests__/personalBests.test.ts` | Unit tests for personal best detection |

### Modified files
| Path | What changes |
|---|---|
| `src/components/MovementStateCard.tsx` | Add compact rhythm score line at card bottom |
| `src/screens/main/ProgressScreen.tsx` | Replace rhythm card + dots with RhythmWave |
| `src/screens/main/LogScreen.tsx` | Detect personal bests post-save, show PersonalBestCard |
| `src/services/notifications.ts` | Add `scheduleOrCancelTwoDayReminder` |
| `src/navigation/TabNavigator.tsx` | Call `useNotificationSync` |
| `src/screens/main/ReflectScreen.tsx` | Add IntentionPrompt before save button |
| `src/hooks/useBootstrapData.ts` | Load current week's intention |
| `src/screens/main/HomeScreen.tsx` | Add QuickLogBar below WeekStrip |
| `supabase/schema.sql` | Append `intentions` table DDL |

---

## Task 1: Rhythm Score Utility

**Files:**
- Create: `src/utils/rhythmScore.ts`
- Create: `__tests__/rhythmScore.test.ts`

---

- [ ] **Step 1.1 — Write the failing tests**

Create `__tests__/rhythmScore.test.ts`:

```typescript
import { computeRhythmScore, weeklySessionCounts } from '../src/utils/rhythmScore';
import type { Activity } from '../src/types';

const FIXED_NOW = new Date('2025-06-04T10:00:00Z'); // Wednesday

function mkAct(daysAgo: number, overrides: Partial<Activity> = {}): Activity {
  const d = new Date(FIXED_NOW);
  d.setDate(d.getDate() - daysAgo);
  return {
    id: 'a-' + Math.random().toString(36).slice(2),
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

describe('computeRhythmScore', () => {
  it('returns 0 active days and Finding Your Way for empty activities', () => {
    const r = computeRhythmScore([], FIXED_NOW);
    expect(r.percentage).toBe(0);
    expect(r.activeDays).toBe(0);
    expect(r.label).toBe('Finding Your Way');
  });

  it('counts unique active days in the 28-day window', () => {
    const acts = Array.from({ length: 7 }, (_, i) => mkAct(i));
    const r = computeRhythmScore(acts, FIXED_NOW);
    expect(r.activeDays).toBe(7);
    expect(r.percentage).toBe(25); // 7/28 * 100 = 25
  });

  it('excludes activities older than 28 days', () => {
    const acts = [mkAct(29), mkAct(1)];
    expect(computeRhythmScore(acts, FIXED_NOW).activeDays).toBe(1);
  });

  it('counts each calendar day only once regardless of session count', () => {
    const d = new Date(FIXED_NOW);
    d.setDate(d.getDate() - 1);
    const ts = d.toISOString();
    const acts = [mkAct(0, { performed_at: ts }), mkAct(0, { performed_at: ts })];
    expect(computeRhythmScore(acts, FIXED_NOW).activeDays).toBe(1);
  });

  it('labels 25+ active days as Deep Rhythm', () => {
    const acts = Array.from({ length: 25 }, (_, i) => mkAct(i));
    expect(computeRhythmScore(acts, FIXED_NOW).label).toBe('Deep Rhythm');
  });

  it('labels 17–22 active days as Steady Rhythm', () => {
    const acts = Array.from({ length: 18 }, (_, i) => mkAct(i));
    expect(computeRhythmScore(acts, FIXED_NOW).label).toBe('Steady Rhythm');
  });

  it('labels 12–16 active days as Growing Consistency', () => {
    const acts = Array.from({ length: 13 }, (_, i) => mkAct(i));
    expect(computeRhythmScore(acts, FIXED_NOW).label).toBe('Growing Consistency');
  });
});

describe('weeklySessionCounts', () => {
  it('returns exactly N entries', () => {
    expect(weeklySessionCounts([], 12, FIXED_NOW)).toHaveLength(12);
  });

  it('marks only the last entry as current', () => {
    const weeks = weeklySessionCounts([], 12, FIXED_NOW);
    const currentCount = weeks.filter((w) => w.isCurrent).length;
    expect(currentCount).toBe(1);
    expect(weeks[11]!.isCurrent).toBe(true);
  });

  it('counts sessions correctly in a known week', () => {
    // Monday of the current week = 2025-06-02 (FIXED_NOW is Wed Jun 4)
    const acts = [
      mkAct(2),  // Jun 2 — this week
      mkAct(1),  // Jun 3 — this week
      mkAct(0),  // Jun 4 — this week
    ];
    const weeks = weeklySessionCounts(acts, 4, FIXED_NOW);
    expect(weeks[3]!.sessions).toBe(3);
  });
});
```

- [ ] **Step 1.2 — Run tests to confirm they fail**

```bash
npx jest __tests__/rhythmScore.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../src/utils/rhythmScore'`

- [ ] **Step 1.3 — Implement `src/utils/rhythmScore.ts`**

```typescript
import { subDays, startOfWeek, addDays, format } from 'date-fns';
import { WEEK_OPTIONS } from './date';
import { activitiesInWeek } from './analytics';
import type { Activity } from '@/types';

export type RhythmLabel =
  | 'Finding Your Way'
  | 'Early Rhythm'
  | 'Growing Consistency'
  | 'Steady Rhythm'
  | 'Deep Rhythm';

export interface RhythmScore {
  percentage: number; // 0–100, integer
  activeDays: number; // unique days with activity in last 28
  label: RhythmLabel;
}

export function computeRhythmScore(
  activities: Activity[],
  now: Date = new Date(),
): RhythmScore {
  const cutoff = subDays(now, 28);
  const activeDaySet = new Set(
    activities
      .filter((a) => new Date(a.performed_at) >= cutoff)
      .map((a) => new Date(a.performed_at).toDateString()),
  );
  const activeDays = activeDaySet.size;
  const percentage = Math.round((activeDays / 28) * 100);

  let label: RhythmLabel;
  if (percentage <= 20) label = 'Finding Your Way';
  else if (percentage <= 43) label = 'Early Rhythm';        // ~12 days
  else if (percentage <= 57) label = 'Growing Consistency'; // ~16 days
  else if (percentage <= 78) label = 'Steady Rhythm';       // ~22 days
  else label = 'Deep Rhythm';

  return { percentage, activeDays, label };
}

export interface WeekCount {
  label: string;     // short date, e.g. "May 15"
  sessions: number;
  isCurrent: boolean;
}

export function weeklySessionCounts(
  activities: Activity[],
  weeks: number = 12,
  now: Date = new Date(),
): WeekCount[] {
  const currentStart = startOfWeek(now, WEEK_OPTIONS);
  return Array.from({ length: weeks }, (_, i) => {
    const start = addDays(currentStart, -7 * (weeks - 1 - i));
    return {
      label: format(start, 'MMM d'),
      sessions: activitiesInWeek(activities, start).length,
      isCurrent: i === weeks - 1,
    };
  });
}
```

- [ ] **Step 1.4 — Run tests to confirm they pass**

```bash
npx jest __tests__/rhythmScore.test.ts --no-coverage
```

Expected: all tests PASS.

- [ ] **Step 1.5 — Commit**

```bash
git add src/utils/rhythmScore.ts __tests__/rhythmScore.test.ts
git commit -m "feat: add rhythmScore utility — 28-day rolling score and weekly session counts"
```

---

## Task 2: Rhythm Score in MovementStateCard + ProgressScreen

**Files:**
- Modify: `src/components/MovementStateCard.tsx`
- Modify: `src/screens/main/ProgressScreen.tsx`

---

- [ ] **Step 2.1 — Add rhythm score prop to MovementStateCard**

Open `src/components/MovementStateCard.tsx`. Replace the existing `Props` interface and function signature:

```typescript
// add import at top of file alongside existing imports
import { computeRhythmScore, type RhythmScore } from '@/utils/rhythmScore';
import type { Activity } from '@/types';
```

Change the `Props` interface:

```typescript
interface Props {
  state: MovementState;
  rhythmScore: RhythmScore;
  onQuickLog?: () => void;
}
```

Update the function signature:

```typescript
export function MovementStateCard({ state, rhythmScore, onQuickLog }: Props) {
```

Add a rhythm score row inside the card, after the `subline` text and before the CTA button. Insert this JSX between the `subline` `<Text>` and the CTA `{state.mode === 'inactive' ...}` block:

```tsx
<View style={styles.rhythmRow}>
  <Text style={[styles.rhythmPct, { color: p.headline }]}>
    {rhythmScore.percentage}%
  </Text>
  <Text style={[styles.rhythmLabel, { color: p.subline }]}>
    {rhythmScore.label} · 28 days
  </Text>
</View>
```

Add these two style entries at the end of the `StyleSheet.create({...})` block:

```typescript
  rhythmRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  rhythmPct: {
    fontSize: 16,
    fontWeight: '700',
  },
  rhythmLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
```

- [ ] **Step 2.2 — Update HomeScreen to pass rhythmScore**

Open `src/screens/main/HomeScreen.tsx`.

Add import:

```typescript
import { computeRhythmScore } from '@/utils/rhythmScore';
```

Add a `rhythmScore` memo after the existing `movementState` memo:

```typescript
const rhythmScore = useMemo(
  () => computeRhythmScore(activities),
  [activities],
);
```

Update the `MovementStateCard` usage to pass the new prop:

```tsx
<MovementStateCard
  state={movementState}
  rhythmScore={rhythmScore}
  onQuickLog={() => navigation.navigate('Log')}
/>
```

- [ ] **Step 2.3 — Update ProgressScreen: replace rhythm card and dots with RhythmWave**

This step is continued in Task 3. Skip for now — the ProgressScreen change will be done atomically with the RhythmWave component.

- [ ] **Step 2.4 — Manual smoke test**

Run `npx expo start`, open the app, navigate to Home. The MovementStateCard should now show a `%` figure and label at the bottom of the card (e.g. "0% · Finding Your Way · 28 days" for a new user).

- [ ] **Step 2.5 — Commit**

```bash
git add src/components/MovementStateCard.tsx src/screens/main/HomeScreen.tsx
git commit -m "feat: add 28-day rhythm score to MovementStateCard"
```

---

## Task 3: Rhythm Wave Visualization (Progress Screen)

**Files:**
- Create: `src/components/RhythmWave.tsx`
- Modify: `src/screens/main/ProgressScreen.tsx`

---

- [ ] **Step 3.1 — Create `src/components/RhythmWave.tsx`**

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import type { WeekCount } from '@/utils/rhythmScore';

interface Props {
  weeks: WeekCount[];
}

const MAX_HEIGHT = 72;
const MAX_SESSIONS = 7;

export function RhythmWave({ weeks }: Props) {
  return (
    <View style={styles.container}>
      {weeks.map((w, i) => {
        const fillHeight =
          w.sessions > 0
            ? Math.max(6, Math.round((w.sessions / MAX_SESSIONS) * MAX_HEIGHT))
            : 0;

        return (
          <View key={i} style={styles.col}>
            <View style={styles.barTrack}>
              {fillHeight > 0 ? (
                <View
                  style={[
                    styles.bar,
                    {
                      height: fillHeight,
                      backgroundColor: w.isCurrent ? colors.sageDark : colors.sageMid,
                    },
                  ]}
                />
              ) : (
                <View style={[styles.emptyBar, { height: 4 }]} />
              )}
            </View>
            {w.isCurrent ? (
              <Text style={styles.nowLabel}>now</Text>
            ) : (
              <View style={styles.labelSpacer} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: MAX_HEIGHT + 20,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: MAX_HEIGHT + 20,
  },
  barTrack: {
    height: MAX_HEIGHT,
    justifyContent: 'flex-end',
    width: '70%',
  },
  bar: {
    borderRadius: 4,
    width: '100%',
  },
  emptyBar: {
    borderRadius: 2,
    width: '50%',
    backgroundColor: colors.border,
    alignSelf: 'center',
  },
  nowLabel: {
    fontSize: 8,
    color: colors.sageDark,
    fontWeight: '700',
    marginTop: 4,
  },
  labelSpacer: {
    height: 12,
  },
});
```

- [ ] **Step 3.2 — Update ProgressScreen to use RhythmWave**

Open `src/screens/main/ProgressScreen.tsx`. Replace the entire file with this updated version that:
- Removes `RhythmDots` (the existing dot component defined in the file)
- Replaces the top rhythm card with a RhythmWave card
- Adds the rhythm score percentage as the hero stat

```typescript
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Card } from '@/components/Card';
import { BarChart } from '@/components/BarChart';
import { InsightCard } from '@/components/InsightCard';
import { RhythmWave } from '@/components/RhythmWave';
import { colors } from '@/constants/colors';
import { useActivityStore } from '@/store/activityStore';
import { useReflectionStore } from '@/store/reflectionStore';
import { computeMovementRhythm, percentChange, weeklyMinutes, weeklyReflectionTrend } from '@/utils/analytics';
import { computeRhythmScore, weeklySessionCounts } from '@/utils/rhythmScore';
import { useScores } from '@/hooks/useScores';

export default function ProgressScreen() {
  const activities = useActivityStore((s) => s.activities);
  const reflections = useReflectionStore((s) => s.reflections);
  const scores = useScores();

  const rhythmScore = useMemo(() => computeRhythmScore(activities), [activities]);
  const waveData = useMemo(() => weeklySessionCounts(activities, 12), [activities]);
  const minutes = useMemo(() => weeklyMinutes(activities, 4), [activities]);
  const energy = useMemo(() => weeklyReflectionTrend(reflections, 'energy', 4), [reflections]);
  const recovery = useMemo(() => weeklyReflectionTrend(reflections, 'recovery', 4), [reflections]);

  const minutesChange = percentChange(minutes.map((d) => d.minutes));
  const energyChange = percentChange(energy.map((d) => d.value));

  return (
    <Screen>
      <Header tag="Your movement story" title="Progress" />

      {/* Rhythm Score hero */}
      <Animated.View entering={FadeInDown.delay(0).springify()}>
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroTag}>28-day rhythm</Text>
              <Text style={styles.heroScore}>{rhythmScore.percentage}%</Text>
              <Text style={styles.heroLabel}>{rhythmScore.label}</Text>
            </View>
            <Text style={styles.heroDays}>{rhythmScore.activeDays} active days</Text>
          </View>
          <RhythmWave weeks={waveData} />
          <Text style={styles.waveCaption}>12-week movement wave</Text>
        </View>
      </Animated.View>

      {/* Weekly minutes trend */}
      <Animated.View entering={FadeInDown.delay(80).springify()}>
        <Card style={styles.chartCard}>
          <View style={styles.trendHeader}>
            <Text style={styles.trendName}>Weekly movement minutes</Text>
            <Text style={[styles.trendChange, { color: minutesChange >= 0 ? colors.sageDark : colors.muted }]}>
              {minutesChange >= 0 ? `↑ +${minutesChange}%` : `↓ ${minutesChange}%`}
            </Text>
          </View>
          <BarChart
            data={minutes.map((d) => ({ label: d.label, value: d.minutes }))}
            color={colors.sageMid}
            highlightColor={colors.sageDark}
            unit="min"
          />
        </Card>
      </Animated.View>

      {/* Energy trend */}
      <Animated.View entering={FadeInDown.delay(140).springify()}>
        <Card style={styles.chartCard}>
          <View style={styles.trendHeader}>
            <Text style={styles.trendName}>Energy trend</Text>
            <Text style={[styles.trendChange, { color: energyChange >= 0 ? colors.sageDark : colors.muted }]}>
              {energyChange === 0 ? 'stable' : energyChange > 0 ? `↑ +${energyChange}%` : `↓ ${energyChange}%`}
            </Text>
          </View>
          <BarChart
            data={energy.map((d) => ({ label: d.label, value: d.value }))}
            color={colors.blush}
            highlightColor={colors.blushAccent}
            max={10}
          />
        </Card>
      </Animated.View>

      {/* Recovery trend */}
      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <Card style={styles.chartCard}>
          <View style={styles.trendHeader}>
            <Text style={styles.trendName}>Recovery trend</Text>
            <Text style={[styles.trendChange, { color: colors.muted }]}>
              {recovery.every((d) => d.value === 0) ? 'no data yet' : 'stable'}
            </Text>
          </View>
          <BarChart
            data={recovery.map((d) => ({ label: d.label, value: d.value }))}
            color={colors.sky}
            highlightColor={colors.skyAccent}
            max={10}
          />
        </Card>
      </Animated.View>

      {/* Flow score summary */}
      <Animated.View entering={FadeInDown.delay(260).springify()}>
        <Card style={styles.chartCard}>
          <Text style={styles.scoreLabel}>Weekly Flow Score</Text>
          <Text style={styles.scoreValue}>{scores.overall}</Text>
          <View style={styles.scoreBreakdown}>
            <ScorePill label="Rhythm" value={scores.consistency} />
            <ScorePill label="Strength" value={scores.strength} />
            <ScorePill label="Vitality" value={scores.endurance} />
            <ScorePill label="Rest" value={scores.recovery} />
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(320).springify()}>
        <InsightCard
          tone="sky"
          label="Progress insight"
          body={
            minutesChange > 0
              ? 'You are building a strong foundation. Small, consistent changes are working — keep going at your own pace.'
              : 'This week is a little quieter than last. That is okay — your body adapts when it rests, too.'
          }
        />
      </Animated.View>
    </Screen>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <View style={pill.wrap}>
      <Text style={pill.value}>{value}</Text>
      <Text style={pill.label}>{label}</Text>
    </View>
  );
}

const pill = StyleSheet.create({
  wrap: { alignItems: 'center', flex: 1 },
  value: { fontSize: 18, fontWeight: '600', color: colors.sageDark },
  label: { fontSize: 10, color: colors.muted, marginTop: 2, textAlign: 'center' },
});

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.sageLight,
    borderColor: colors.sageMid,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#1F2A22',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroTag: {
    fontSize: 10,
    color: colors.sage,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  heroScore: {
    fontSize: 40,
    fontWeight: '600',
    color: colors.sageDark,
    lineHeight: 44,
  },
  heroLabel: {
    fontSize: 13,
    color: colors.sage,
    fontWeight: '500',
  },
  heroDays: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500',
    marginTop: 4,
  },
  waveCaption: {
    fontSize: 10,
    color: colors.hint,
    textAlign: 'center',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '600',
  },
  chartCard: { marginBottom: 10 },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendName: { fontSize: 14, color: colors.ink, fontWeight: '500' },
  trendChange: { fontSize: 12, fontWeight: '600' },
  scoreLabel: {
    fontSize: 11,
    color: colors.muted,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  scoreValue: {
    fontSize: 44,
    fontWeight: '500',
    color: colors.sageDark,
    marginVertical: 6,
    lineHeight: 50,
  },
  scoreBreakdown: {
    flexDirection: 'row',
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
```

- [ ] **Step 3.3 — Manual smoke test**

Run `npx expo start`, navigate to the Progress tab. The top of the screen should show a large `%` score, a label ("Finding Your Way", etc.), and a 12-column wave chart. Columns should scale with session count per week.

- [ ] **Step 3.4 — Commit**

```bash
git add src/components/RhythmWave.tsx src/screens/main/ProgressScreen.tsx
git commit -m "feat: add RhythmWave component and redesign Progress screen hero"
```

---

## Task 4: Personal Bests Tracking

**Files:**
- Create: `src/utils/personalBests.ts`
- Create: `__tests__/personalBests.test.ts`
- Create: `src/components/PersonalBestCard.tsx`
- Modify: `src/screens/main/LogScreen.tsx`

---

- [ ] **Step 4.1 — Write the failing tests**

Create `__tests__/personalBests.test.ts`:

```typescript
import {
  computePersonalBests,
  detectPersonalBestEvents,
} from '../src/utils/personalBests';
import type { Activity } from '../src/types';

function mkAct(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'a-' + Math.random().toString(36).slice(2),
    user_id: 'u',
    type: 'walk',
    duration_minutes: 30,
    effort: 5,
    moods: [],
    notes: null,
    performed_at: new Date('2025-06-01T10:00:00Z').toISOString(),
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('computePersonalBests', () => {
  it('returns zeros for empty activities', () => {
    const b = computePersonalBests([]);
    expect(b.longestSessionMinutes).toBe(0);
    expect(b.mostSessionsIn7Days).toBe(0);
  });

  it('finds the longest session', () => {
    const acts = [mkAct({ duration_minutes: 30 }), mkAct({ duration_minutes: 60 })];
    expect(computePersonalBests(acts).longestSessionMinutes).toBe(60);
  });

  it('counts max sessions in any rolling 7-day window', () => {
    const base = new Date('2025-06-01T10:00:00Z');
    const acts = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      return mkAct({ performed_at: d.toISOString() });
    });
    expect(computePersonalBests(acts).mostSessionsIn7Days).toBe(5);
  });

  it('does not count sessions more than 7 days apart in the same window', () => {
    const acts = [
      mkAct({ performed_at: '2025-06-01T10:00:00Z' }),
      mkAct({ performed_at: '2025-06-09T10:00:00Z' }), // 8 days later
    ];
    expect(computePersonalBests(acts).mostSessionsIn7Days).toBe(1);
  });
});

describe('detectPersonalBestEvents', () => {
  it('returns empty array when there are no existing activities (first session)', () => {
    expect(detectPersonalBestEvents(mkAct({ duration_minutes: 45 }), [])).toHaveLength(0);
  });

  it('detects a new longest session', () => {
    const existing = [mkAct({ duration_minutes: 30 })];
    const events = detectPersonalBestEvents(mkAct({ duration_minutes: 45 }), existing);
    expect(events).toHaveLength(1);
    expect(events[0]!.type).toBe('longest_session');
    expect(events[0]!.newValue).toBe(45);
    expect(typeof events[0]!.message).toBe('string');
  });

  it('does not fire when new session is shorter than existing best', () => {
    const existing = [mkAct({ duration_minutes: 60 })];
    expect(detectPersonalBestEvents(mkAct({ duration_minutes: 30 }), existing)).toHaveLength(0);
  });

  it('does not fire when new session exactly equals existing best', () => {
    const existing = [mkAct({ duration_minutes: 30 })];
    expect(detectPersonalBestEvents(mkAct({ duration_minutes: 30 }), existing)).toHaveLength(0);
  });

  it('detects most sessions in 7 days', () => {
    const base = new Date('2025-06-01T10:00:00Z');
    const existing = Array.from({ length: 3 }, (_, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      return mkAct({ performed_at: d.toISOString() });
    });
    const newAct = mkAct({ performed_at: new Date('2025-06-04T10:00:00Z').toISOString() });
    const events = detectPersonalBestEvents(newAct, existing);
    const weekEvent = events.find((e) => e.type === 'most_weekly_sessions');
    expect(weekEvent).toBeDefined();
    expect(weekEvent!.newValue).toBe(4);
  });
});
```

- [ ] **Step 4.2 — Run tests to confirm they fail**

```bash
npx jest __tests__/personalBests.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../src/utils/personalBests'`

- [ ] **Step 4.3 — Implement `src/utils/personalBests.ts`**

```typescript
import { addDays } from 'date-fns';
import type { Activity } from '@/types';

export interface PersonalBests {
  longestSessionMinutes: number;
  mostSessionsIn7Days: number;
}

export interface PersonalBestEvent {
  type: 'longest_session' | 'most_weekly_sessions';
  newValue: number;
  message: string;
}

export function computePersonalBests(activities: Activity[]): PersonalBests {
  if (activities.length === 0) {
    return { longestSessionMinutes: 0, mostSessionsIn7Days: 0 };
  }

  const longestSessionMinutes = Math.max(...activities.map((a) => a.duration_minutes));

  let mostSessionsIn7Days = 0;
  for (const anchor of activities) {
    const windowStart = new Date(anchor.performed_at);
    const windowEnd = addDays(windowStart, 7);
    const count = activities.filter((a) => {
      const t = new Date(a.performed_at);
      return t >= windowStart && t < windowEnd;
    }).length;
    if (count > mostSessionsIn7Days) mostSessionsIn7Days = count;
  }

  return { longestSessionMinutes, mostSessionsIn7Days };
}

export function detectPersonalBestEvents(
  newActivity: Activity,
  existingActivities: Activity[],
): PersonalBestEvent[] {
  // Never fire on the very first logged session — no baseline exists yet.
  if (existingActivities.length === 0) return [];

  const oldBests = computePersonalBests(existingActivities);
  const allActivities = [newActivity, ...existingActivities];
  const newBests = computePersonalBests(allActivities);

  const events: PersonalBestEvent[] = [];

  if (newActivity.duration_minutes > oldBests.longestSessionMinutes) {
    events.push({
      type: 'longest_session',
      newValue: newActivity.duration_minutes,
      message: `Longest session — ${newActivity.duration_minutes} min.`,
    });
  }

  if (newBests.mostSessionsIn7Days > oldBests.mostSessionsIn7Days) {
    events.push({
      type: 'most_weekly_sessions',
      newValue: newBests.mostSessionsIn7Days,
      message: `${newBests.mostSessionsIn7Days} sessions in 7 days — your most active week.`,
    });
  }

  return events;
}
```

- [ ] **Step 4.4 — Run tests to confirm they pass**

```bash
npx jest __tests__/personalBests.test.ts --no-coverage
```

Expected: all tests PASS.

- [ ] **Step 4.5 — Create `src/components/PersonalBestCard.tsx`**

```typescript
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/colors';
import type { PersonalBestEvent } from '@/utils/personalBests';

interface Props {
  events: PersonalBestEvent[];
}

export function PersonalBestCard({ events }: Props) {
  useEffect(() => {
    if (events.length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [events.length]);

  if (events.length === 0) return null;

  return (
    <>
      {events.map((e) => (
        <Animated.View
          key={e.type}
          entering={FadeInDown.delay(200).springify()}
          exiting={FadeOut.duration(300)}
          style={styles.card}
        >
          <Text style={styles.icon}>⭐</Text>
          <View style={styles.text}>
            <Text style={styles.label}>Personal best</Text>
            <Text style={styles.message}>{e.message}</Text>
          </View>
        </Animated.View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.warmLight,
    borderColor: colors.warm,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: colors.warmDark,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  icon: { fontSize: 24 },
  text: { flex: 1 },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.warmDark,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warmDark,
    lineHeight: 20,
  },
});
```

- [ ] **Step 4.6 — Update LogScreen to detect and show personal bests**

Open `src/screens/main/LogScreen.tsx`.

Add imports at the top:

```typescript
import { detectPersonalBestEvents, type PersonalBestEvent } from '@/utils/personalBests';
import { PersonalBestCard } from '@/components/PersonalBestCard';
```

Add state:

```typescript
const [personalBestEvents, setPersonalBestEvents] = useState<PersonalBestEvent[]>([]);
```

In the `save` function, capture the existing activities BEFORE the `add` call, then detect bests after. Replace the `save` function with this version:

```typescript
const save = async () => {
  if (!user) return;
  setSaving(true);
  const existingActivities = useActivityStore.getState().activities;
  const payload = {
    type,
    duration_minutes: duration,
    effort,
    moods,
    notes: null,
    performed_at: new Date().toISOString(),
  };
  try {
    const created = await add(user.id, payload);
    const events = detectPersonalBestEvents(created, existingActivities);
    setPersonalBestEvents(events);
    if (events.length === 0) {
      show(`Logged. ${duration} min of ${type}.`);
    }
    await sendNow(`${duration} minutes logged.`);
    setDuration(25);
    setEffort(4);
    setMoods([]);
  } catch (e: any) {
    show(e?.message || 'Could not save — check your connection.');
  } finally {
    setSaving(false);
  }
};
```

Add `PersonalBestCard` to the JSX, between the chip row section and the save button. Place it immediately before `<Button label=...`:

```tsx
<PersonalBestCard events={personalBestEvents} />
```

Note: `useActivityStore.getState()` accesses the Zustand store directly outside of React rendering — this is a supported Zustand pattern for event handlers.

- [ ] **Step 4.7 — Manual smoke test**

Run `npx expo start`. Log an activity with a duration longer than any previous session. After saving, a gold personal best card should appear above the save button showing "Longest session — N min."

- [ ] **Step 4.8 — Commit**

```bash
git add src/utils/personalBests.ts __tests__/personalBests.test.ts src/components/PersonalBestCard.tsx src/screens/main/LogScreen.tsx
git commit -m "feat: personal bests tracking — detect and celebrate new bests at log time"
```

---

## Task 5: 2-Day Rule Notification

**Files:**
- Modify: `src/services/notifications.ts`
- Create: `src/hooks/useNotificationSync.ts`
- Modify: `src/navigation/TabNavigator.tsx`

---

- [ ] **Step 5.1 — Add `scheduleOrCancelTwoDayReminder` to notifications service**

Open `src/services/notifications.ts`. Add this import at the top:

```typescript
import { differenceInDays } from 'date-fns';
import type { Activity } from '@/types';
```

Add this function at the bottom of the file:

```typescript
const TWO_DAY_ID = 'movekind-two-day-rule';

export async function scheduleOrCancelTwoDayReminder(
  activities: Activity[],
): Promise<void> {
  if (Platform.OS === 'web') return;

  // Always cancel any existing scheduled reminder first.
  try {
    await Notifications.cancelScheduledNotificationAsync(TWO_DAY_ID);
  } catch {
    // Notification may not exist — ignore.
  }

  if (activities.length === 0) return;

  const daysSinceLast = differenceInDays(new Date(), new Date(activities[0]!.performed_at));

  // Only fire when the user has been inactive for exactly 2 days.
  // More than 2 days is handled by the MovementStateCard anti-avoidance system.
  if (daysSinceLast !== 2) return;

  // Schedule for 7pm today if 7pm has not yet passed.
  const scheduledTime = new Date();
  scheduledTime.setHours(19, 0, 0, 0);
  if (scheduledTime <= new Date()) return;

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: TWO_DAY_ID,
      content: {
        title: 'MoveKind',
        body: 'Tomorrow is worth protecting. Just 10 minutes is enough.',
        data: { kind: 'two-day-rule' },
      },
      trigger: { date: scheduledTime } as any,
    });
  } catch {
    // Best-effort — non-fatal.
  }
}
```

- [ ] **Step 5.2 — Create `src/hooks/useNotificationSync.ts`**

```typescript
import { useEffect } from 'react';
import { useActivityStore } from '@/store/activityStore';
import { scheduleOrCancelTwoDayReminder } from '@/services/notifications';

export function useNotificationSync(): void {
  const activities = useActivityStore((s) => s.activities);

  useEffect(() => {
    scheduleOrCancelTwoDayReminder(activities);
  }, [activities]);
}
```

- [ ] **Step 5.3 — Call `useNotificationSync` from TabNavigator**

Open `src/navigation/TabNavigator.tsx`. Add the import:

```typescript
import { useNotificationSync } from '@/hooks/useNotificationSync';
```

Inside `TabNavigator`, after the `useBootstrapData()` call, add:

```typescript
useNotificationSync();
```

The function now reads:

```typescript
export default function TabNavigator() {
  useBootstrapData();
  useNotificationSync();
  return (
    // ... rest unchanged
  );
}
```

- [ ] **Step 5.4 — Manual verification**

To verify without waiting 2 days: temporarily change `daysSinceLast !== 2` to `daysSinceLast >= 0` in `notifications.ts`, run the app, log an activity, then check `Notifications.getAllScheduledNotificationsAsync()` in a `console.log` call. A notification with identifier `movekind-two-day-rule` should appear. Revert the temporary change after confirming.

- [ ] **Step 5.5 — Commit**

```bash
git add src/services/notifications.ts src/hooks/useNotificationSync.ts src/navigation/TabNavigator.tsx
git commit -m "feat: 2-day rule notification — schedule 7pm nudge when inactive for 2 days"
```

---

## Task 6: Weekly Intention Setting

**Files:**
- Modify: `supabase/schema.sql` (append; requires manual SQL execution in Supabase dashboard)
- Create: `src/services/intentions.ts`
- Create: `src/store/intentionStore.ts`
- Create: `src/components/IntentionPrompt.tsx`
- Modify: `src/screens/main/ReflectScreen.tsx`
- Modify: `src/hooks/useBootstrapData.ts`

---

- [ ] **Step 6.1 — Run SQL migration in Supabase dashboard**

Open the Supabase SQL Editor for your project (`https://app.supabase.com` → your project → SQL Editor).

Run this SQL:

```sql
create table if not exists public.intentions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  description text not null,
  intended_day text,
  intended_time text,
  met boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create index if not exists idx_intentions_user_week
  on public.intentions(user_id, week_start desc);

alter table public.intentions enable row level security;

drop policy if exists "intentions_select_own" on public.intentions;
create policy "intentions_select_own" on public.intentions
  for select using (auth.uid() = user_id);

drop policy if exists "intentions_insert_own" on public.intentions;
create policy "intentions_insert_own" on public.intentions
  for insert with check (auth.uid() = user_id);

drop policy if exists "intentions_update_own" on public.intentions;
create policy "intentions_update_own" on public.intentions
  for update using (auth.uid() = user_id);

drop policy if exists "intentions_delete_own" on public.intentions;
create policy "intentions_delete_own" on public.intentions
  for delete using (auth.uid() = user_id);
```

After running, also append this block to `supabase/schema.sql` so the file stays in sync:

```sql
-- =====================================================================
-- intentions
-- =====================================================================
create table if not exists public.intentions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  description text not null,
  intended_day text,
  intended_time text,
  met boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create index if not exists idx_intentions_user_week
  on public.intentions(user_id, week_start desc);

alter table public.intentions enable row level security;

drop policy if exists "intentions_select_own" on public.intentions;
create policy "intentions_select_own" on public.intentions
  for select using (auth.uid() = user_id);

drop policy if exists "intentions_insert_own" on public.intentions;
create policy "intentions_insert_own" on public.intentions
  for insert with check (auth.uid() = user_id);

drop policy if exists "intentions_update_own" on public.intentions;
create policy "intentions_update_own" on public.intentions
  for update using (auth.uid() = user_id);

drop policy if exists "intentions_delete_own" on public.intentions;
create policy "intentions_delete_own" on public.intentions
  for delete using (auth.uid() = user_id);
```

- [ ] **Step 6.2 — Create `src/services/intentions.ts`**

```typescript
import { supabase } from './supabase';

export interface Intention {
  id: string;
  user_id: string;
  week_start: string;
  description: string;
  intended_day: string | null;
  intended_time: string | null;
  met: boolean | null;
  created_at: string;
  updated_at: string;
}

export type NewIntention = Pick<
  Intention,
  'week_start' | 'description' | 'intended_day' | 'intended_time'
>;

export async function getIntention(
  userId: string,
  weekStart: string,
): Promise<Intention | null> {
  const { data, error } = await supabase
    .from('intentions')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .maybeSingle();
  if (error) return null;
  return (data as Intention) ?? null;
}

export async function upsertIntention(
  userId: string,
  input: NewIntention,
): Promise<Intention | null> {
  const { data, error } = await supabase
    .from('intentions')
    .upsert({
      user_id: userId,
      ...input,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  if (error) return null;
  return data as Intention;
}

export async function markIntentionMet(id: string, met: boolean): Promise<void> {
  await supabase
    .from('intentions')
    .update({ met, updated_at: new Date().toISOString() })
    .eq('id', id);
}
```

- [ ] **Step 6.3 — Create `src/store/intentionStore.ts`**

```typescript
import { create } from 'zustand';
import {
  getIntention,
  upsertIntention,
  markIntentionMet,
  type Intention,
  type NewIntention,
} from '@/services/intentions';
import { weekStartIso } from '@/utils/date';

interface IntentionState {
  currentIntention: Intention | null;
  loading: boolean;
  load: (userId: string) => Promise<void>;
  save: (userId: string, input: NewIntention) => Promise<void>;
  markMet: (met: boolean) => Promise<void>;
  reset: () => void;
}

export const useIntentionStore = create<IntentionState>((set, get) => ({
  currentIntention: null,
  loading: false,

  load: async (userId) => {
    set({ loading: true });
    const data = await getIntention(userId, weekStartIso());
    set({ currentIntention: data, loading: false });
  },

  save: async (userId, input) => {
    const data = await upsertIntention(userId, input);
    set({ currentIntention: data });
  },

  markMet: async (met) => {
    const { currentIntention } = get();
    if (!currentIntention) return;
    await markIntentionMet(currentIntention.id, met);
    set({ currentIntention: { ...currentIntention, met } });
  },

  reset: () => set({ currentIntention: null }),
}));
```

- [ ] **Step 6.4 — Create `src/components/IntentionPrompt.tsx`**

```typescript
import React from 'react';
import { StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { colors } from '@/constants/colors';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const TIMES = ['Morning', 'Afternoon', 'Evening'] as const;

export interface IntentionDraft {
  description: string;
  intendedDay: string | null;
  intendedTime: string | null;
}

interface Props {
  value: IntentionDraft;
  onChange: (v: IntentionDraft) => void;
  existingDescription?: string | null;
}

export function IntentionPrompt({ value, onChange, existingDescription }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>This week's intention</Text>
      <Text style={styles.subtitle}>
        Optional. One specific thing you intend to do. Not a goal — just an intention.
      </Text>

      <TextInput
        value={value.description}
        onChangeText={(t) => onChange({ ...value, description: t })}
        placeholder={existingDescription ?? 'e.g. One 20-minute walk on Tuesday morning'}
        placeholderTextColor={colors.hint}
        style={styles.input}
        multiline={false}
        returnKeyType="done"
      />

      <Text style={styles.label}>When?</Text>
      <View style={styles.chipRow}>
        {DAYS.map((d) => (
          <Pressable
            key={d}
            onPress={() =>
              onChange({ ...value, intendedDay: value.intendedDay === d ? null : d })
            }
            style={[styles.chip, value.intendedDay === d && styles.chipActive]}
          >
            <Text
              style={[
                styles.chipText,
                { color: value.intendedDay === d ? '#FFFFFF' : colors.muted },
              ]}
            >
              {d}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.chipRow, { marginTop: 6 }]}>
        {TIMES.map((t) => (
          <Pressable
            key={t}
            onPress={() =>
              onChange({ ...value, intendedTime: value.intendedTime === t ? null : t })
            }
            style={[styles.chip, value.intendedTime === t && styles.chipActive]}
          >
            <Text
              style={[
                styles.chipText,
                { color: value.intendedTime === t ? '#FFFFFF' : colors.muted },
              ]}
            >
              {t}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 17,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.ink,
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.sageDark,
    borderColor: colors.sageDark,
  },
  chipText: { fontSize: 12, fontWeight: '500' },
});
```

- [ ] **Step 6.5 — Update ReflectScreen to include IntentionPrompt**

Open `src/screens/main/ReflectScreen.tsx`.

Add imports:

```typescript
import { IntentionPrompt, type IntentionDraft } from '@/components/IntentionPrompt';
import { useIntentionStore } from '@/store/intentionStore';
import { weekStartIso } from '@/utils/date';
```

Add state in the component body (after the existing `saving` state):

```typescript
const intentionLoad = useIntentionStore((s) => s.load);
const intentionSave = useIntentionStore((s) => s.save);
const currentIntention = useIntentionStore((s) => s.currentIntention);

const [intentionDraft, setIntentionDraft] = useState<IntentionDraft>({
  description: '',
  intendedDay: null,
  intendedTime: null,
});
```

Inside the existing `useEffect` that loads `existing` reflection data, add a load call after the `if (existing)` block:

```typescript
useEffect(() => {
  if (!user) return;
  intentionLoad(user.id);
}, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
```

Load the existing intention into the draft when `currentIntention` changes:

```typescript
useEffect(() => {
  if (currentIntention) {
    setIntentionDraft({
      description: currentIntention.description,
      intendedDay: currentIntention.intended_day,
      intendedTime: currentIntention.intended_time,
    });
  }
}, [currentIntention?.id]); // eslint-disable-line react-hooks/exhaustive-deps
```

In the `onSubmit` function, after `await save(...)` succeeds and before `show(...)`, add:

```typescript
if (intentionDraft.description.trim()) {
  await intentionSave(user.id, {
    week_start: weekIso,
    description: intentionDraft.description.trim(),
    intended_day: intentionDraft.intendedDay,
    intended_time: intentionDraft.intendedTime,
  });
}
```

In the JSX, add `<IntentionPrompt>` before `<Button label=...` (after the compassionate note block):

```tsx
<Animated.View entering={FadeInDown.delay(660).springify()}>
  <IntentionPrompt
    value={intentionDraft}
    onChange={setIntentionDraft}
    existingDescription={currentIntention?.description}
  />
</Animated.View>
```

- [ ] **Step 6.6 — Update `useBootstrapData` to load current intention**

Open `src/hooks/useBootstrapData.ts`. Add imports:

```typescript
import { useIntentionStore } from '@/store/intentionStore';
```

Inside the hook, add:

```typescript
const loadIntention = useIntentionStore((s) => s.load);
```

In the second `useEffect` (the one that checks `if (!user) return`), add:

```typescript
loadIntention(user.id);
```

Final second `useEffect`:

```typescript
useEffect(() => {
  if (!user) return;
  loadActs(user.id);
  loadRefs(user.id);
  loadIntention(user.id);
}, [user, loadActs, loadRefs, loadIntention]);
```

- [ ] **Step 6.7 — Manual smoke test**

Run `npx expo start`, navigate to Reflect. At the bottom of the reflection form, before the Save button, a card titled "This week's intention" should appear. Enter a description, select a day and time, then tap Save Reflection. The intention should persist on next app open.

- [ ] **Step 6.8 — Commit**

```bash
git add supabase/schema.sql src/services/intentions.ts src/store/intentionStore.ts src/components/IntentionPrompt.tsx src/screens/main/ReflectScreen.tsx src/hooks/useBootstrapData.ts
git commit -m "feat: weekly intention setting — set and persist movement intentions in Reflect screen"
```

---

## Task 7: Quick Log Bar

**Files:**
- Create: `src/components/QuickLogBar.tsx`
- Modify: `src/screens/main/HomeScreen.tsx`

---

- [ ] **Step 7.1 — Create `src/components/QuickLogBar.tsx`**

```typescript
import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/colors';
import { ACTIVITIES } from '@/constants/activities';
import type { Activity } from '@/types';

interface Props {
  lastActivity: Activity | null;
  onLog: (type: Activity['type'], durationMinutes: number) => Promise<void>;
}

const DEFAULT_DURATION = 20;

export function QuickLogBar({ lastActivity, onLog }: Props) {
  const [loading, setLoading] = useState(false);

  if (!lastActivity) return null;

  const actDef = ACTIVITIES.find((a) => a.type === lastActivity.type);
  const emoji = actDef?.emoji ?? '🏃';
  const label = actDef?.label ?? lastActivity.type;
  const duration = Math.min(lastActivity.duration_minutes, 60);

  const handlePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await onLog(lastActivity.type, duration);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable onPress={handlePress} disabled={loading} style={styles.bar}>
      <View style={styles.left}>
        <Text style={styles.emoji}>{emoji}</Text>
        <View>
          <Text style={styles.label}>Quick log</Text>
          <Text style={styles.detail}>
            {duration} min of {label}
          </Text>
        </View>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={colors.sageDark} />
      ) : (
        <Text style={styles.cta}>Log →</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderColor: colors.sageMid,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 12,
    shadowColor: '#1F2A22',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emoji: { fontSize: 22 },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  detail: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
    marginTop: 1,
  },
  cta: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.sageDark,
  },
});
```

- [ ] **Step 7.2 — Update HomeScreen to add QuickLogBar**

Open `src/screens/main/HomeScreen.tsx`.

Add import:

```typescript
import { QuickLogBar } from '@/components/QuickLogBar';
```

Inside the component, add a `handleQuickLog` callback after the `recent` memo:

```typescript
const handleQuickLog = async (type: Activity['type'], durationMinutes: number) => {
  if (!user) return;
  await useActivityStore.getState().add(user.id, {
    type,
    duration_minutes: durationMinutes,
    effort: 4,
    moods: [],
    notes: null,
    performed_at: new Date().toISOString(),
  });
};
```

Add the import for `Activity` type if not already present:

```typescript
import type { Activity, AIInsight } from '@/types';
```

In the JSX, add `QuickLogBar` between the WeekStrip and MovementStateCard:

```tsx
{/* Quick log — one tap to repeat last activity */}
<Animated.View entering={FadeInDown.delay(80).springify()}>
  <QuickLogBar
    lastActivity={activities[0] ?? null}
    onLog={handleQuickLog}
  />
</Animated.View>
```

Update the delay on MovementStateCard from `100` to `120` to keep animations staggered cleanly.

- [ ] **Step 7.3 — Manual smoke test**

Run `npx expo start`. If at least one activity has been logged before, a compact bar appears between WeekStrip and MovementStateCard showing "Quick log / N min of [type]". Tapping it immediately logs the activity and the WeekStrip dot updates.

- [ ] **Step 7.4 — Commit**

```bash
git add src/components/QuickLogBar.tsx src/screens/main/HomeScreen.tsx
git commit -m "feat: quick log bar — one-tap repeat of last activity from home screen"
```

---

## Final Integration Test

- [ ] **Run the full test suite**

```bash
npx jest --no-coverage
```

Expected: all existing tests pass, plus the new `rhythmScore` and `personalBests` tests.

- [ ] **Run TypeScript compiler check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Full smoke test on device/simulator**

Open the app. Verify:

1. **Home screen**: QuickLogBar appears if activities exist. MovementStateCard shows `%` rhythm score. WeekStrip unchanged.
2. **Log a new activity**: Toast shows "Logged. N min of [type]". If duration beats previous best, PersonalBestCard appears.
3. **Progress screen**: Top card shows large `%` figure and 12-column wave chart. Bar charts below unchanged.
4. **Reflect screen**: IntentionPrompt appears above the Save button. Setting an intention and saving persists it on next open.
5. **Notification**: After 2 days of inactivity, a notification fires at 7pm (verify via system notification center).

- [ ] **Final commit**

```bash
git add .
git commit -m "chore: phase 2 retention foundation — all six features integrated and smoke-tested"
```
