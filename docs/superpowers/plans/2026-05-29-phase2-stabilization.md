# Phase 2 Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix five remaining psychological, UX, and data integrity issues before merging Phase 2 into main.

**Architecture:** Four targeted fixes to existing components/screens + one language audit pass. No new screens, no new navigation, no schema changes. Each task is independent and can be committed separately.

**Tech Stack:** React Native (Expo), TypeScript, Zustand, NativeWind/StyleSheet, Jest/jest-expo, date-fns.

---

## File Map

| File | Change |
|------|--------|
| `src/components/QuickLogBar.tsx` | Add `mode` prop, mode-aware rendering, carry effort from lastActivity |
| `src/screens/main/HomeScreen.tsx` | Pass `movementState.mode` to QuickLogBar, update `handleQuickLog` signature |
| `src/screens/main/ProgressScreen.tsx` | Replace ScorePill/Flow Score card with WeeklyMix; fix insight copy |
| `src/store/intentionStore.ts` | Add `previousIntention`, `loadPrevious`, `markPreviousMet` |
| `src/components/IntentionCheckin.tsx` | New component — previous week check-in prompt |
| `src/screens/main/ReflectScreen.tsx` | Add IntentionCheckin at top, reposition IntentionPrompt, fix footer/subtitle |
| `src/utils/analytics.ts` | Fix MovementRhythm description strings |

---

## Task 1: Mode-aware QuickLogBar + data integrity fix

**Files:**
- Modify: `src/components/QuickLogBar.tsx`
- Modify: `src/screens/main/HomeScreen.tsx`

### Why this matters
A user inactive for 12 days sees "45 min weights — Log →" directly below "12 days since your last session." That juxtaposition recreates all-or-nothing psychology. The fix: show ultra-low-friction re-entry for `inactive`/`returning`, hide for `resting`, and carry real effort values (not the hardcoded `4`) so behavioral data stays meaningful.

- [ ] **Step 1: Rewrite QuickLogBar with mode awareness**

Replace the entire contents of `src/components/QuickLogBar.tsx` with:

```tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/colors';
import { ACTIVITIES } from '@/constants/activities';
import type { Activity } from '@/types';
import type { MovementMode } from '@/utils/movementState';

interface Props {
  lastActivity: Activity | null;
  mode: MovementMode;
  onLog: (type: Activity['type'], durationMinutes: number, effort: number) => Promise<void>;
}

interface LogConfig {
  emoji: string;
  label: string;
  detail: string;
  type: Activity['type'];
  duration: number;
  effort: number;
}

function buildConfig(mode: MovementMode, lastActivity: Activity | null): LogConfig | null {
  if (mode === 'resting') return null;

  if (mode === 'inactive') {
    return {
      emoji: '🌱',
      label: 'Start small',
      detail: '5 min of anything',
      type: 'walk',
      duration: 5,
      effort: 3,
    };
  }

  if (mode === 'returning') {
    const def = lastActivity ? ACTIVITIES.find((a) => a.type === lastActivity.type) : null;
    return {
      emoji: def?.emoji ?? '🚶',
      label: 'Ease back in',
      detail: `${Math.min(lastActivity?.duration_minutes ?? 10, 15)} min${def ? ` of ${def.label}` : ''}`,
      type: lastActivity?.type ?? 'walk',
      duration: Math.min(lastActivity?.duration_minutes ?? 10, 15),
      effort: Math.min(lastActivity?.effort ?? 3, 4),
    };
  }

  // building / steady — normal repeat behavior
  if (!lastActivity) return null;
  const def = ACTIVITIES.find((a) => a.type === lastActivity.type);
  return {
    emoji: def?.emoji ?? '🏃',
    label: 'Quick log',
    detail: `${Math.min(lastActivity.duration_minutes, 60)} min of ${def?.label ?? lastActivity.type}`,
    type: lastActivity.type,
    duration: Math.min(lastActivity.duration_minutes, 60),
    effort: lastActivity.effort,
  };
}

export function QuickLogBar({ lastActivity, mode, onLog }: Props) {
  const [loading, setLoading] = useState(false);

  const config = buildConfig(mode, lastActivity);
  if (!config) return null;

  const handlePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await onLog(config.type, config.duration, config.effort);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable onPress={handlePress} disabled={loading} style={styles.bar}>
      <View style={styles.left}>
        <Text style={styles.emoji}>{config.emoji}</Text>
        <View>
          <Text style={styles.label}>{config.label}</Text>
          <Text style={styles.detail}>{config.detail}</Text>
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
    shadowColor: colors.ink,
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
  detail: { fontSize: 14, fontWeight: '500', color: colors.ink, marginTop: 1 },
  cta: { fontSize: 13, fontWeight: '600', color: colors.sageDark },
});
```

- [ ] **Step 2: Update HomeScreen to pass mode and propagate effort**

In `src/screens/main/HomeScreen.tsx`, change `handleQuickLog` and the `QuickLogBar` usage:

Change `handleQuickLog` (currently at line ~89):
```tsx
// OLD:
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

// NEW:
const handleQuickLog = async (type: Activity['type'], durationMinutes: number, effort: number) => {
  if (!user) return;
  await useActivityStore.getState().add(user.id, {
    type,
    duration_minutes: durationMinutes,
    effort,
    moods: [],
    notes: null,
    performed_at: new Date().toISOString(),
  });
};
```

Change the `QuickLogBar` JSX (currently at line ~117):
```tsx
// OLD:
<QuickLogBar
  lastActivity={activities[0] ?? null}
  onLog={handleQuickLog}
/>

// NEW:
<QuickLogBar
  lastActivity={activities[0] ?? null}
  mode={movementState.mode}
  onLog={handleQuickLog}
/>
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors related to QuickLogBar props.

- [ ] **Step 4: Commit**

```bash
git add src/components/QuickLogBar.tsx src/screens/main/HomeScreen.tsx
git commit -m "fix: QuickLogBar — mode-aware re-entry UX and real effort values"
```

---

## Task 2: Progress screen — replace zero-score pills with activity mix

**Files:**
- Modify: `src/screens/main/ProgressScreen.tsx`

### Why this matters
`ScorePill` renders `Strength: 0` and `Vitality: 0` for yoga-only or walking-focused users. This is deficit framing — the system punishes people for not doing the "right" types. Replace with a non-evaluative view of what the user actually did this week, and make the insight copy specific not generic.

- [ ] **Step 1: Add WEEK_OPTIONS import and update ProgressScreen**

At the top of `src/screens/main/ProgressScreen.tsx`, add to imports:

```tsx
import { startOfWeek } from 'date-fns';
import { WEEK_OPTIONS } from '@/utils/date';
import { ACTIVITIES, ACTIVITY_BY_TYPE } from '@/constants/activities';
import { activitiesInWeek } from '@/utils/analytics';
import type { ActivityType } from '@/types';
```

- [ ] **Step 2: Replace the ScorePill section and update insight copy**

In `src/screens/main/ProgressScreen.tsx`:

**Remove** the entire `ScorePill` function (lines ~134–147) and its `pill` StyleSheet (lines ~143–147). Also remove the `useScores` import and the `const scores = useScores();` line since scores are no longer displayed.

**Replace** the "Flow score summary" `Animated.View` block (currently lines ~106–117) with:

```tsx
{/* This week's activity mix — no scoring, no zeroes */}
<Animated.View entering={FadeInDown.delay(260).springify()}>
  <Card style={styles.chartCard}>
    <Text style={styles.scoreLabel}>This week's movement</Text>
    <WeeklyMix activities={activities} />
  </Card>
</Animated.View>
```

**Replace** the InsightCard `Animated.View` block (currently lines ~119–129) with:

```tsx
<Animated.View entering={FadeInDown.delay(320).springify()}>
  <InsightCard
    tone="sky"
    label="Progress insight"
    body={
      minutesChange > 0
        ? `Movement up ${minutesChange}% from last week. Patterns like this are what actually create change.`
        : minutesChange < 0
        ? 'Quieter week than last. Rest adapts the body — returning is what matters.'
        : 'Consistent with last week. Steady rhythm is the goal.'
    }
  />
</Animated.View>
```

- [ ] **Step 3: Add WeeklyMix component at the bottom of ProgressScreen.tsx**

Add this after the `ProgressScreen` export and before the `styles` constant:

```tsx
function WeeklyMix({ activities }: { activities: import('@/types').Activity[] }) {
  const typeEntries = useMemo(() => {
    const weekStart = startOfWeek(new Date(), WEEK_OPTIONS);
    const thisWeek = activitiesInWeek(activities, weekStart);
    const map = new Map<ActivityType, { count: number; minutes: number }>();
    for (const a of thisWeek) {
      const key = a.type as ActivityType;
      const existing = map.get(key) ?? { count: 0, minutes: 0 };
      map.set(key, { count: existing.count + 1, minutes: existing.minutes + a.duration_minutes });
    }
    return [...map.entries()];
  }, [activities]);

  if (typeEntries.length === 0) {
    return <Text style={mix.empty}>No sessions logged this week yet.</Text>;
  }

  return (
    <View style={mix.row}>
      {typeEntries.map(([type, { count, minutes }]) => {
        const def = ACTIVITY_BY_TYPE[type];
        return (
          <View key={type} style={mix.item}>
            <Text style={mix.emoji}>{def?.emoji ?? '🏃'}</Text>
            <Text style={mix.name}>{def?.label ?? type}</Text>
            <Text style={mix.sub}>{count}× · {minutes}min</Text>
          </View>
        );
      })}
    </View>
  );
}

const mix = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  item: { alignItems: 'center', minWidth: 64 },
  emoji: { fontSize: 22, marginBottom: 3 },
  name: { fontSize: 12, fontWeight: '500', color: colors.ink },
  sub: { fontSize: 10, color: colors.muted, marginTop: 2 },
  empty: { fontSize: 13, color: colors.hint, marginTop: 6 },
});
```

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors. If `useScores` is unused in other imports, remove it.

- [ ] **Step 5: Commit**

```bash
git add src/screens/main/ProgressScreen.tsx
git commit -m "fix: Progress screen — replace zero-score pills with weekly activity mix"
```

---

## Task 3: Intention lifecycle — previous week check-in

**Files:**
- Modify: `src/store/intentionStore.ts`
- Create: `src/components/IntentionCheckin.tsx`
- Modify: `src/screens/main/ReflectScreen.tsx`

### Why this matters
Intentions are set and stored, then forgotten. The system silently teaches "intentions disappear without consequence," which erodes self-trust. Adding a previous-week check-in closes the behavioral loop. The placement fix (buried below 10 rating cards) makes intentions actually visible.

- [ ] **Step 1: Extend intentionStore with previous week support**

Replace `src/store/intentionStore.ts` entirely with:

```ts
import { create } from 'zustand';
import { addDays } from 'date-fns';
import {
  getIntention,
  upsertIntention,
  markIntentionMet,
  type Intention,
  type NewIntention,
} from '@/services/intentions';
import { weekStartIso } from '@/utils/date';

function lastWeekStartIso(): string {
  const thisWeek = new Date(weekStartIso());
  return addDays(thisWeek, -7).toISOString().slice(0, 10);
}

interface IntentionState {
  currentIntention: Intention | null;
  previousIntention: Intention | null;
  loading: boolean;
  load: (userId: string) => Promise<void>;
  save: (userId: string, input: NewIntention) => Promise<void>;
  markMet: (met: boolean) => Promise<void>;
  markPreviousMet: (met: boolean) => Promise<void>;
  reset: () => void;
}

export const useIntentionStore = create<IntentionState>((set, get) => ({
  currentIntention: null,
  previousIntention: null,
  loading: false,

  load: async (userId) => {
    set({ loading: true });
    try {
      const [current, previous] = await Promise.all([
        getIntention(userId, weekStartIso()),
        getIntention(userId, lastWeekStartIso()),
      ]);
      set({ currentIntention: current, previousIntention: previous, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  save: async (userId, input) => {
    const data = await upsertIntention(userId, input);
    if (data) set({ currentIntention: data });
  },

  markMet: async (met) => {
    const { currentIntention } = get();
    if (!currentIntention) return;
    await markIntentionMet(currentIntention.id, met);
    set({ currentIntention: { ...currentIntention, met } });
  },

  markPreviousMet: async (met) => {
    const { previousIntention } = get();
    if (!previousIntention) return;
    await markIntentionMet(previousIntention.id, met);
    set({ previousIntention: { ...previousIntention, met } });
  },

  reset: () => set({ currentIntention: null, previousIntention: null }),
}));
```

- [ ] **Step 2: Create IntentionCheckin component**

Create `src/components/IntentionCheckin.tsx`:

```tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/colors';
import type { Intention } from '@/services/intentions';

interface Props {
  intention: Intention;
  onRespond: (met: boolean) => void;
}

type Response = 'yes' | 'mostly' | 'no';

const RESPONSES: { key: Response; label: string; met: boolean }[] = [
  { key: 'yes',    label: 'Yes',           met: true  },
  { key: 'mostly', label: 'Mostly',        met: true  },
  { key: 'no',     label: 'Not this week', met: false },
];

const FOLLOW_UP: Record<Response, string> = {
  yes:    'You followed through. That builds real self-trust.',
  mostly: 'Partial counts. Moving at all was the win.',
  no:     "Missed intentions happen — that's part of the process, not a failure.",
};

export function IntentionCheckin({ intention, onRespond }: Props) {
  const [response, setResponse] = useState<Response | null>(null);

  const handlePress = (r: Response, met: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setResponse(r);
    onRespond(met);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.tag}>Last week</Text>
      <Text style={styles.description}>
        You planned to{' '}
        <Text style={styles.descriptionBold}>{intention.description}</Text>.
      </Text>

      {response === null ? (
        <>
          <Text style={styles.question}>Did you follow through?</Text>
          <View style={styles.row}>
            {RESPONSES.map((r) => (
              <Pressable
                key={r.key}
                style={styles.btn}
                onPress={() => handlePress(r.key, r.met)}
              >
                <Text style={styles.btnText}>{r.label}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : (
        <Text style={styles.followUp}>{FOLLOW_UP[response]}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.sageLight,
    borderColor: colors.sageMid,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  tag: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.sage,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: colors.ink,
    lineHeight: 20,
    marginBottom: 10,
  },
  descriptionBold: { fontWeight: '600' },
  question: {
    fontSize: 13,
    color: colors.sageDark,
    fontWeight: '500',
    marginBottom: 10,
  },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.sageDark,
    backgroundColor: colors.surface,
  },
  btnText: { fontSize: 13, color: colors.sageDark, fontWeight: '500' },
  followUp: {
    fontSize: 13,
    color: colors.sageDark,
    lineHeight: 19,
    fontStyle: 'italic',
  },
});
```

- [ ] **Step 3: Update ReflectScreen — add check-in at top, reposition IntentionPrompt**

In `src/screens/main/ReflectScreen.tsx`:

**Add imports** (after the existing IntentionPrompt import):
```tsx
import { IntentionCheckin } from '@/components/IntentionCheckin';
```

**Add previousIntention and markPreviousMet** in the store selectors block (after the `currentIntention` line):
```tsx
const previousIntention = useIntentionStore((s) => s.previousIntention);
const markPreviousMet = useIntentionStore((s) => s.markPreviousMet);
```

**In the JSX**, add the check-in block right after `<Header>` (before any other content) and before the core reflection section:

```tsx
{/* Previous week intention check-in — only shows when unanswered */}
{previousIntention && previousIntention.met === null && (
  <Animated.View entering={FadeInDown.delay(0).springify()}>
    <IntentionCheckin
      intention={previousIntention}
      onRespond={markPreviousMet}
    />
  </Animated.View>
)}
```

**Move the IntentionPrompt block** from its current position (below the free-text card, before the compassionate note) to **after the core reflection section and before the Body & Mind Check-in section**. The correct placement is after the last `REFLECTION_PROMPTS` card and before the `Body & Mind Check-in` Text:

```tsx
{/* Intention — placed here so it's seen before the longer wellness section */}
<Animated.View entering={FadeInDown.delay(280).springify()}>
  <IntentionPrompt
    value={intentionDraft}
    onChange={setIntentionDraft}
    existingDescription={currentIntention?.description}
  />
</Animated.View>
```

Remove the old IntentionPrompt block from its previous position (after the free-text card).

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/store/intentionStore.ts src/components/IntentionCheckin.tsx src/screens/main/ReflectScreen.tsx
git commit -m "feat: intention lifecycle — previous week check-in and repositioned prompt"
```

---

## Task 4: Language and tone audit

**Files:**
- Modify: `src/screens/main/ReflectScreen.tsx`
- Modify: `src/utils/analytics.ts`

### Why this matters
Wellness-speak copy weakens product credibility. Vague, poetic language ("Reflection builds the awareness that gentle movement grows from") signals therapy-app genre, not behavioral intelligence. Every line should be grounded, specific, and something a direct coach would actually say.

- [ ] **Step 1: Fix ReflectScreen footer and header subtitle**

In `src/screens/main/ReflectScreen.tsx`:

**Change the header** (the `subtitle` prop):
```tsx
// OLD:
subtitle="A moment of honest self-awareness is a movement in itself"

// NEW:
subtitle="Check in honestly. No performance required."
```

**Remove the footer entirely** (the `<Text style={styles.footer}>` block and the `footer` style):
```tsx
// DELETE this block entirely:
<Text style={styles.footer}>
  Reflection builds the awareness that gentle movement grows from.
</Text>

// DELETE the footer style from the styles object:
footer: {
  textAlign: 'center',
  color: colors.hint,
  fontSize: 12,
  marginTop: 12,
  lineHeight: 18,
},
```

- [ ] **Step 2: Fix MovementRhythm description strings in analytics.ts**

In `src/utils/analytics.ts`, replace the `computeMovementRhythm` description strings:

```ts
// No movement logged at all — was:
// "Every journey starts with a single gentle movement. You are right here."
// NEW:
description: 'Nothing logged yet. First session counts the same as every other.',

// Returning after a break — was:
// "Coming back is the hardest and bravest move. You did it — welcome back."
// NEW:
description: 'Back after a gap. The return is the move.',

// Purely restorative week — was:
// "Your body is doing its best healing during intentional rest and gentle movement."
// NEW:
description: 'Deliberate recovery week. Adaptation happens during rest.',

// Rest week (nothing logged, has history) — was:
// "A quieter week. Rest has real value — and so does returning when you're ready."
// NEW:
description: 'Quiet week, no sessions. Your body is still adapting.',

// Steady rhythm — was:
// "A consistent, calm movement rhythm. This is exactly what sustainable looks like."
// NEW:
description: 'Consistent across weeks. This pattern is how lasting change works.',

// Gentle flow — was:
// "You are building a real relationship with movement — one step at a time."
// NEW:
description: 'Moving across multiple weeks. The pattern is forming.',

// Fresh start — was:
// "New beginnings are full of possibility. Any movement you choose counts."
// NEW:
description: 'Early days. Whatever you log here counts.',
```

- [ ] **Step 3: Run TypeScript check and tests**

```bash
npx tsc --noEmit && npx jest --testPathPattern="analytics" --no-coverage
```

Expected: TypeScript clean, analytics tests pass (description strings are not tested — only the `intensity` and `label` fields are asserted in tests, verify this is true).

- [ ] **Step 4: Commit**

```bash
git add src/screens/main/ReflectScreen.tsx src/utils/analytics.ts
git commit -m "fix: tone audit — remove wellness-speak, ground all behavioral copy"
```

---

## Task 5: Full test run and pre-merge verification

**Files:** No file changes — verification only.

- [ ] **Step 1: Run the full test suite**

```bash
npx jest --no-coverage
```

Expected: all tests pass. If any fail, fix them before proceeding.

- [ ] **Step 2: Run TypeScript check across the whole project**

```bash
npx tsc --noEmit
```

Expected: zero errors, zero warnings that weren't already present before this branch.

- [ ] **Step 3: Verify QuickLogBar behavior mentally**

Check each mode produces the right config:
- `inactive` → "Start small · 5 min of anything" (regardless of lastActivity)
- `returning` → "Ease back in · ≤15 min of [last type]" (capped)
- `resting` → bar not rendered
- `building` → "Quick log · [last type], ≤60 min"
- `steady` → "Quick log · [last type], ≤60 min"

- [ ] **Step 4: Verify ProgressScreen has no score zeroes**

Confirm `ScorePill` is fully deleted from the file. Run:

```bash
grep -n "ScorePill\|scores\.strength\|scores\.endurance\|useScores" src/screens/main/ProgressScreen.tsx
```

Expected: no matches.

- [ ] **Step 5: Verify Reflect screen intention placement**

Confirm IntentionPrompt appears before the Body & Mind section and IntentionCheckin is at the top:

```bash
grep -n "IntentionCheckin\|IntentionPrompt\|Body & Mind" src/screens/main/ReflectScreen.tsx
```

Expected: `IntentionCheckin` line number < `IntentionPrompt` line number < `Body & Mind` line number.

- [ ] **Step 6: Verify wellness-speak is gone**

```bash
grep -n "builds the awareness\|gentle movement grows\|movement in itself\|bravest move\|full of possibility\|real relationship with movement\|warm foundation" src/screens/main/ReflectScreen.tsx src/utils/analytics.ts src/screens/main/ProgressScreen.tsx
```

Expected: no matches.

- [ ] **Step 7: Commit merge-ready verification note and push**

```bash
git log --oneline -8
```

Confirm all 4 fix commits are present. Then create the merge PR:

```bash
git push origin HEAD
```

---

## Self-Review

### Spec coverage check

| Spec requirement | Task |
|-----------------|------|
| P1.2 QuickLogBar mode-aware | Task 1 |
| P1.2 INACTIVE → ultra-low-friction | Task 1 — "Start small · 5 min" |
| P1.2 RETURNING → compassionate restart | Task 1 — "Ease back in · ≤15 min" |
| P1.2 RESTING → no bar | Task 1 — `buildConfig` returns null |
| P1.3 No zero-value score display | Task 2 — ScorePill removed |
| P1.3 Non-evaluative metric framing | Task 2 — WeeklyMix |
| P1.3 Motivating insight copy | Task 2 — specific % change |
| P2.4 Real effort values in quick log | Task 1 — `effort: lastActivity.effort` |
| P3.5 Intention check-in loop | Task 3 — IntentionCheckin |
| P3.5 Completion acknowledgment | Task 3 — FOLLOW_UP messages |
| P3.5 Compassionate missed-intention recovery | Task 3 — "Not this week" response |
| P3.5 Better placement | Task 3 — moved before Body & Mind |
| P4.6 Footer wellness-speak removed | Task 4 |
| P4.6 Header subtitle grounded | Task 4 |
| P4.6 MovementRhythm descriptions | Task 4 |
| P4.6 ProgressScreen insight copy | Task 2 |
| Full test pass | Task 5 |
| Merge readiness | Task 5 |

No gaps identified.
