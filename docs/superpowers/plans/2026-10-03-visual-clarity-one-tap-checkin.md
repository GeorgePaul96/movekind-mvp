# Visual Clarity & One-Tap Check-In Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make MoveKind legible and fast: Sunrise palette, three unmistakable button kinds, plain-English copy, a one-tap mood check-in that never hits the paywall, and a this-week-vs-last card that replaces the post-session dead end.

**Architecture:** Restyle in place on the existing semantic-token system (`colors.ts`). New pure domain modules (`domain/checkin/moods.ts`, `domain/insights/weekCompare.ts`) carry the logic and the tests. `sessionStore.checkIn` splits into `logCheckIn` / `updateCheckIn` / `startTodaysSession`; Home becomes a 4-state screen built from three small components. The composer is untouched.

**Tech Stack:** Expo SDK 54 · React Native 0.81 · TypeScript strict · Zustand · Supabase · Jest + @testing-library/react-native.

**Spec:** `docs/superpowers/specs/2026-10-03-visual-clarity-one-tap-checkin-design.md`

## Global Constraints

- All color comes from `src/constants/colors.ts` semantic tokens — never hardcode hex in components.
- Every text/background pair ≥ 4.5:1; every non-text UI/graph pair ≥ 3:1 (enforced by `__tests__/colors.test.ts`).
- All new user-facing strings live in `src/constants/copy.ts`. Copy never promises a duration the composer doesn't guarantee.
- Banned words in UI copy: "attunement", "capacity", "nervous system", "parasympathetic", "somatic", "Safe Harbor".
- Minimum font size 13; body text 14.
- `src/domain/**` stays pure: no Supabase, no React, no store imports.
- Composer (`src/domain/sessions/composer.ts`) is not modified; `ENGINE_VERSION` stays `v3.0`.
- Schema changes touch `supabase/schema.sql`, `src/types/index.ts` (if types change) and `DATABASE.md`.
- Imports use the `@/` alias inside `src/`; tests import via relative `../src/...` paths (existing convention).
- Verify every task with `npm run typecheck` and `npm test`. Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

---

### Task 1: Sunrise tokens + contrast regression test

**Files:**
- Modify: `src/constants/colors.ts` (whole file)
- Modify: `app.json` (splash + adaptiveIcon `backgroundColor`)
- Create: `__tests__/colors.test.ts`

**Interfaces:**
- Produces: `colors` (same semantic keys as today + legacy aliases re-pointed), `stateColors[state] = { soft, ink, accent, tint }`, `elevation`, `CapacityState`.

- [ ] **Step 1: Write the failing contrast test** — `__tests__/colors.test.ts`

```ts
import { colors, stateColors } from '../src/constants/colors';

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const TEXT = 4.5;
const UI = 3;

describe('Sunrise palette contrast', () => {
  const textPairs: [string, string, string][] = [
    ['textPrimary on background', colors.textPrimary, colors.background],
    ['textSecondary on background', colors.textSecondary, colors.background],
    ['textSecondary on surfaceSecondary', colors.textSecondary, colors.surfaceSecondary],
    ['textMuted on background', colors.textMuted, colors.background],
    ['textMuted on surface', colors.textMuted, colors.surface],
    ['textMuted on surfaceSecondary', colors.textMuted, colors.surfaceSecondary],
    ['onPrimary on primary', colors.onPrimary, colors.primary],
    ['onPrimary on primaryPressed', colors.onPrimary, colors.primaryPressed],
    ['primary text on background', colors.primary, colors.background],
    ['primary text on surface', colors.primary, colors.surface],
    ['secondaryText on primarySoft', colors.secondaryText, colors.primarySoft],
    ['success on background', colors.success, colors.background],
    ['warning on background', colors.warning, colors.background],
    ['error on background', colors.error, colors.background],
    ['info on background', colors.info, colors.background],
  ];

  it.each(textPairs)('%s clears 4.5:1', (_name, fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(TEXT);
  });

  it('primary outline is visible against the canvas (3:1)', () => {
    expect(ratio(colors.primary, colors.background)).toBeGreaterThanOrEqual(UI);
  });

  describe.each(Object.entries(stateColors))('%s', (_state, c) => {
    it('ink text on soft tile clears 4.5:1', () => expect(ratio(c.ink, c.soft)).toBeGreaterThanOrEqual(TEXT));
    it('white on accent clears 4.5:1', () => expect(ratio('#FFFFFF', c.accent)).toBeGreaterThanOrEqual(TEXT));
    it('accent as text on background clears 4.5:1', () => expect(ratio(c.accent, colors.background)).toBeGreaterThanOrEqual(TEXT));
    it('ink tile border vs background clears 3:1', () => expect(ratio(c.ink, colors.background)).toBeGreaterThanOrEqual(UI));
    it('tint bar vs surface clears 3:1', () => expect(ratio(c.tint, colors.surface)).toBeGreaterThanOrEqual(UI));
  });
});
```

- [ ] **Step 2: Run it — expect FAIL** (`stateColors.*.ink` undefined; old tints < 3:1)

Run: `npx jest __tests__/colors.test.ts`

- [ ] **Step 3: Replace `src/constants/colors.ts`**

```ts
/**
 * MoveKind design tokens — "Sunrise". The single source of truth for color.
 *
 * Warm cream canvas, white cards, four clear mood colors, deep-green actions.
 * Calm, but never washed out: every action is either solid or clearly outlined.
 *
 * Rules:
 * - Reference SEMANTIC tokens (`colors.primary`, `colors.textSecondary`, …), never raw hex.
 * - Text pairs clear WCAG AA 4.5:1; non-text UI/graph pairs clear 3:1.
 *   Enforced by __tests__/colors.test.ts — add new pairs there when you add tokens.
 * - Legacy keys (`bg`, `ink`, `sage`, …) are aliases kept only until every file has
 *   migrated; they are removed in the final redesign task.
 */

export const colors = {
  // ---- Surfaces ----------------------------------------------------------
  background: '#FFF8EE',        // app canvas — warm cream
  surface: '#FFFFFF',           // cards / raised surfaces
  surfaceSecondary: '#F7EFE2',  // inputs, wells, nested surfaces

  // ---- Text --------------------------------------------------------------
  textPrimary: '#2B2A26',       // 13.6:1 on background
  textSecondary: '#5A5548',     // 7.0:1
  textMuted: '#6B6453',         // 5.6:1 — still AA, never faint
  onPrimary: '#FFFFFF',

  // ---- Actions -----------------------------------------------------------
  primary: '#245C43',           // deep green — solid buttons, outlines, links (7.8:1 with white)
  primaryPressed: '#1B4A35',
  primarySoft: '#E3F0E8',       // tinted surface (chips, soft highlights)
  secondary: '#E3F0E8',
  secondaryText: '#245C43',

  // ---- Lines & elevation -------------------------------------------------
  border: '#CDBFA6',            // decorative card edges only — never the sole cue for a control
  divider: '#EFE6D6',
  shadow: '#3A2F1E',

  // ---- Status ------------------------------------------------------------
  success: '#2F7A52',
  warning: '#8A5A12',
  error: '#A8443A',
  info: '#2F6596',

  // ---- Legacy aliases (removed in Task 11) -------------------------------
  bg: '#FFF8EE',
  ink: '#2B2A26',
  muted: '#5A5548',
  hint: '#6B6453',
  sage: '#245C43',
  sageDark: '#245C43',
  sageMid: '#5A9C74',
  sageLight: '#E3F0E8',
  blush: '#D06A50',
  blushLight: '#FAD5C8',
  blushDark: '#8A3220',
  blushAccent: '#A8443A',
  sky: '#5F8FC0',
  skyLight: '#DCEBFA',
  skyDark: '#1F4E7A',
  skyAccent: '#3C6E9C',
  warm: '#B8862A',
  warmLight: '#FBE7B8',
  warmDark: '#6B4A0E',
  warmAccent: '#8A5A12',
} as const;

export type ColorName = keyof typeof colors;

/**
 * Per-mood color sets.
 * - `soft`  : tile / surface fill
 * - `ink`   : text and borders on `soft` (and a ≥3:1 outline on the canvas)
 * - `accent`: fill that carries white text; also readable as text on the canvas
 * - `tint`  : bars, slider fill — ≥3:1 on white
 */
export const stateColors = {
  overloaded: { soft: '#DCEBFA', ink: '#1F4E7A', accent: '#3C6E9C', tint: '#5F8FC0' },
  recovering: { soft: '#D6EFDF', ink: '#1F5C3A', accent: '#2F7A52', tint: '#5A9C74' },
  regulated:  { soft: '#FBE7B8', ink: '#6B4A0E', accent: '#8A5A12', tint: '#B8862A' },
  activated:  { soft: '#FAD5C8', ink: '#8A3220', accent: '#A8443A', tint: '#D06A50' },
} as const;

export type CapacityState = keyof typeof stateColors;

/** Soft, consistent elevation for cards and raised surfaces. */
export const elevation = {
  card: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  raised: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
} as const;
```

- [ ] **Step 4: `app.json`** — set both `expo.splash.backgroundColor` and `expo.android.adaptiveIcon.backgroundColor` to `"#FFF8EE"`; set `expo.primaryColor` and the `expo-notifications` plugin `color` to `"#245C43"`.

- [ ] **Step 5: Run** `npx jest __tests__/colors.test.ts` → PASS; `npm run typecheck` → clean; `npm test` → all green.

- [ ] **Step 6: Commit** — `feat(ui): Sunrise palette tokens + contrast regression test`

---

### Task 2: Three unmistakable button kinds

**Files:**
- Modify: `src/components/Button.tsx` (whole file)
- Modify: `__tests__/Button.test.tsx`
- Modify call sites: `src/components/ErrorBoundary.tsx:48` (`sage-soft`→`secondary`), `src/screens/main/ProfileScreen.tsx:88` (`sage-soft`→`secondary`), `:98` (`ghost`→`link`), `src/screens/auth/SignInScreen.tsx:81` and `src/screens/auth/SignUpScreen.tsx:97` (`ghost`→`link`)

**Interfaces:**
- Produces: `Button({ label, onPress, variant?: 'primary' | 'secondary' | 'link', size?: 'md' | 'sm', loading?, disabled?, accessibilityLabel?, accessibilityHint? })`.

- [ ] **Step 1: Add failing tests** to `__tests__/Button.test.tsx` (keep the existing three):

```tsx
import { StyleSheet } from 'react-native';
import { colors } from '../src/constants/colors';

const flat = (node: any) => StyleSheet.flatten(node.props.style);

it('primary is a solid primary fill', () => {
  const { getByRole } = render(<Button label="Go" onPress={() => {}} />);
  expect(flat(getByRole('button')).backgroundColor).toBe(colors.primary);
});

it('secondary has a visible 2px primary outline', () => {
  const { getByRole } = render(<Button label="Later" variant="secondary" onPress={() => {}} />);
  const s = flat(getByRole('button'));
  expect(s.borderWidth).toBe(2);
  expect(s.borderColor).toBe(colors.primary);
});

it('link is underlined primary text with a 44pt touch target', () => {
  const { getByRole, getByText } = render(<Button label="Skip" variant="link" onPress={() => {}} />);
  expect(flat(getByRole('button')).minHeight).toBeGreaterThanOrEqual(44);
  const t = StyleSheet.flatten(getByText('Skip').props.style);
  expect(t.textDecorationLine).toBe('underline');
  expect(t.color).toBe(colors.primary);
});
```

- [ ] **Step 2: Run** `npx jest __tests__/Button.test.tsx` → FAIL (`secondary`/`link` unknown; `style` is a function).

- [ ] **Step 3: Replace `src/components/Button.tsx`**

```tsx
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';

export type ButtonVariant = 'primary' | 'secondary' | 'link';

interface Props {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/**
 * The only button in the app. Three kinds, each unmistakable:
 * - primary   — solid deep green, white label (the one main action on a screen)
 * - secondary — white with a 2px green outline (the alternative)
 * - link      — underlined green text, still a full 44pt touch target
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  accessibilityLabel,
  accessibilityHint,
}: Props) {
  const [pressed, setPressed] = useState(false);
  const isDisabled = !!(disabled || loading);

  const style = [
    styles.base,
    size === 'sm' && styles.sm,
    variant === 'primary' && styles.primary,
    variant === 'primary' && pressed && !isDisabled && styles.primaryPressed,
    variant === 'secondary' && styles.secondary,
    variant === 'secondary' && pressed && !isDisabled && styles.secondaryPressed,
    variant === 'link' && styles.link,
    variant === 'link' && pressed && !isDisabled && styles.linkPressed,
    isDisabled && styles.disabled,
  ];

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: !!loading }}
      style={style}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? colors.onPrimary : colors.primary} />
        ) : (
          <Text
            style={[
              styles.label,
              size === 'sm' && styles.labelSm,
              variant === 'primary' && { color: colors.onPrimary },
              variant !== 'primary' && { color: colors.primary },
              variant === 'link' && styles.linkLabel,
            ]}
          >
            {label}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18, minHeight: 50, justifyContent: 'center' },
  sm: { paddingVertical: 10, minHeight: 44 },
  primary: {
    backgroundColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  secondary: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primary },
  secondaryPressed: { backgroundColor: colors.primarySoft },
  link: { backgroundColor: 'transparent', minHeight: 44, paddingVertical: 10 },
  linkPressed: { opacity: 0.6 },
  disabled: { opacity: 0.45 },
  inner: { alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 16, fontWeight: '700' },
  labelSm: { fontSize: 15 },
  linkLabel: { textDecorationLine: 'underline', fontWeight: '600' },
});
```

- [ ] **Step 4: Update the five call sites** listed under Files (`variant="sage-soft"` → `variant="secondary"`, `variant="ghost"` → `variant="link"`).

- [ ] **Step 5: Run** `npx jest __tests__/Button.test.tsx` → PASS; `npm run typecheck`; `npm test`.

- [ ] **Step 6: Commit** — `feat(ui): three unmistakable button kinds (primary/secondary/link)`

---

### Task 3: Moods domain + check-in copy

**Files:**
- Create: `src/domain/checkin/moods.ts`
- Create: `__tests__/moods.test.ts`
- Modify: `src/store/sessionStore.ts:44-49` — delete local `mapEnergyToState`, add `export { mapEnergyToState } from '@/domain/checkin/moods';` and `import { mapEnergyToState, moodToEnergy } from '@/domain/checkin/moods';`
- Modify: `src/constants/copy.ts` (append)

**Interfaces:**
- Produces: `MOODS: readonly UserState[]`, `moodToEnergy(mood: UserState): number`, `mapEnergyToState(score: number): UserState`; copy `MOOD_COPY: Record<UserState, { label: string; emoji: string; reassurance: string; sessionTitle: string; sessionFeel: string }>`, `SLEEP_COPY: Record<'poor'|'fair'|'good', string>`, `CHECKIN_COPY` (keys below), `checkInPrompt(name?: string | null): string`.

- [ ] **Step 1: Failing test** — `__tests__/moods.test.ts`

```ts
import { MOODS, moodToEnergy, mapEnergyToState } from '../src/domain/checkin/moods';
import { MOOD_COPY, checkInPrompt } from '../src/constants/copy';

describe('moods', () => {
  it('lists the four moods from lowest to highest energy', () => {
    expect(MOODS).toEqual(['overloaded', 'recovering', 'regulated', 'activated']);
  });

  it('maps each mood to an energy score that round-trips to the same state', () => {
    expect(MOODS.map(moodToEnergy)).toEqual([1, 2, 4, 5]);
    for (const m of MOODS) expect(mapEnergyToState(moodToEnergy(m))).toBe(m);
  });

  it('keeps the legacy 1–5 mapping intact', () => {
    expect([1, 2, 3, 4, 5].map(mapEnergyToState)).toEqual([
      'overloaded', 'recovering', 'recovering', 'regulated', 'activated',
    ]);
  });

  it('has plain-English copy for every mood, free of jargon', () => {
    const banned = /attunement|capacity|nervous system|parasympathetic|somatic|safe harbor/i;
    for (const m of MOODS) {
      const c = MOOD_COPY[m];
      expect(c.label.length).toBeGreaterThan(0);
      for (const s of Object.values(c)) expect(s).not.toMatch(banned);
    }
  });

  it('greets by name when known', () => {
    expect(checkInPrompt('Sam')).toBe("How's your energy, Sam?");
    expect(checkInPrompt(null)).toBe("How's your energy?");
  });
});
```

- [ ] **Step 2: Run** `npx jest __tests__/moods.test.ts` → FAIL (module missing).

- [ ] **Step 3: Create `src/domain/checkin/moods.ts`**

```ts
import type { UserState } from '@/types';

/** The four one-tap moods, lowest to highest energy. Order is the tile order. */
export const MOODS: readonly UserState[] = ['overloaded', 'recovering', 'regulated', 'activated'];

// Score 3 is intentionally unused by tiles: it maps to 'recovering' like 2, so the
// tiles pick the unambiguous anchor of each state.
const ENERGY_FOR_MOOD: Record<UserState, number> = {
  overloaded: 1,
  recovering: 2,
  regulated: 4,
  activated: 5,
};

export function moodToEnergy(mood: UserState): number {
  return ENERGY_FOR_MOOD[mood];
}

/** energy_score (1–5) → capacity state. Moved from sessionStore; the store re-exports it. */
export function mapEnergyToState(score: number): UserState {
  if (score === 1) return 'overloaded';
  if (score <= 3) return 'recovering';
  if (score === 4) return 'regulated';
  return 'activated';
}
```

- [ ] **Step 4: Append to `src/constants/copy.ts`** (add `import type { UserState } from '@/types';` at the top)

```ts
export const MOOD_COPY: Record<
  UserState,
  { label: string; emoji: string; reassurance: string; sessionTitle: string; sessionFeel: string }
> = {
  overloaded: {
    label: 'Running on empty',
    emoji: '😮‍💨',
    reassurance: "Running on empty. That's okay.",
    sessionTitle: 'Your gentle reset',
    sessionFeel: 'Slow breathing and easy release. Nothing strenuous.',
  },
  recovering: {
    label: 'A bit low',
    emoji: '🌱',
    reassurance: 'A bit low today. Small is plenty.',
    sessionTitle: 'Your easy session',
    sessionFeel: 'Loosening stretches and light movement.',
  },
  regulated: {
    label: 'Steady',
    emoji: '🙂',
    reassurance: 'Steady. A good day to move.',
    sessionTitle: 'Your steady session',
    sessionFeel: 'Mobility, some strength, and a calm finish.',
  },
  activated: {
    label: 'Buzzing',
    emoji: '⚡',
    reassurance: "Buzzing. Let's use that energy well.",
    sessionTitle: 'Your strong session',
    sessionFeel: 'A fuller workout with a proper wind-down.',
  },
};

export const SLEEP_COPY: Record<'poor' | 'fair' | 'good', string> = {
  poor: '😴 Poor',
  fair: '😐 Okay',
  good: '✨ Great',
};

export const CHECKIN_COPY = {
  logged: 'Logged ✓',
  start: 'Start',
  notNow: "Not now — I'm done for today",
  sleepPrompt: 'Optional: how did you sleep?',
  addNote: '+ Add a note for today',
  notePlaceholder: 'e.g. move gently, breathe, just show up',
  saveNote: 'Save note',
  gentleReset: 'Too wiped to choose? Start a gentle reset',
  saveFailed: "Couldn't save that — tap to try again.",
  updateFailed: "Couldn't save that. Try again in a moment.",
  changeToday: "Change today's check-in",
  anotherSession: 'Do another short session',
  weekTitle: 'This week vs last',
  weekEmpty: 'Your week will appear here.',
  checkIns: 'Check-ins',
  minutes: 'Minutes moved',
  niceWeek: (name?: string | null) => (name ? `Nice to see you, ${name}.` : 'Nice to see you.'),
} as const;

export function checkInPrompt(name?: string | null): string {
  return name ? `How's your energy, ${name}?` : "How's your energy?";
}
```

- [ ] **Step 5: Re-point the store** at the moved function (edit described under Files). `__tests__/sessionStore.test.ts` keeps importing `mapEnergyToState` from the store — the re-export keeps it working.

- [ ] **Step 6: Run** `npx jest __tests__/moods.test.ts __tests__/sessionStore.test.ts` → PASS; `npm run typecheck`; `npm test`.

- [ ] **Step 7: Commit** — `feat(checkin): mood domain + plain-English check-in copy`

---

### Task 4: Week comparison (pure)

**Files:**
- Create: `src/domain/insights/weekCompare.ts`
- Create: `__tests__/weekCompare.test.ts`

**Interfaces:**
- Consumes: `mapEnergyToState` from `@/domain/checkin/moods`.
- Produces:
  - `interface WeekCheckIn { energy_score: number; created_at: string }`
  - `interface WeekSession { created_at: string; status: Session['status']; seconds: number }`
  - `interface WeekStats { days: number; minutes: number }`
  - `interface WeekComparison { thisWeek: WeekStats; lastWeek: WeekStats; daily: (UserState | null)[] }` (`daily` has 7 entries, Mon→Sun)
  - `weekBounds(now: Date): { lastStart: Date; thisStart: Date; nextStart: Date }`
  - `isSameLocalDay(a: Date, b: Date): boolean`
  - `compareWeeks(checkIns: WeekCheckIn[], sessions: WeekSession[], now?: Date): WeekComparison`

- [ ] **Step 1: Failing test** — `__tests__/weekCompare.test.ts`

```ts
import { compareWeeks, weekBounds, isSameLocalDay } from '../src/domain/insights/weekCompare';

// Thursday 2026-10-08 15:00 local. This week = Mon 10-05 .. Sun 10-11.
const NOW = new Date(2026, 9, 8, 15, 0, 0);
const at = (d: number, h = 9, m = 0) => new Date(2026, 9, d, h, m).toISOString();

describe('weekBounds', () => {
  it('starts weeks on local Monday midnight', () => {
    const { lastStart, thisStart, nextStart } = weekBounds(NOW);
    expect(thisStart).toEqual(new Date(2026, 9, 5));
    expect(lastStart).toEqual(new Date(2026, 8, 28));
    expect(nextStart).toEqual(new Date(2026, 9, 12));
  });

  it('treats Sunday as the end of the week, not the start', () => {
    expect(weekBounds(new Date(2026, 9, 11, 22)).thisStart).toEqual(new Date(2026, 9, 5));
  });
});

describe('compareWeeks', () => {
  it('counts each day once even with several check-ins', () => {
    const r = compareWeeks([
      { energy_score: 2, created_at: at(6, 8) },
      { energy_score: 4, created_at: at(6, 20) },
      { energy_score: 1, created_at: at(7) },
    ], [], NOW);
    expect(r.thisWeek.days).toBe(2);
  });

  it("colors a day by that day's latest check-in", () => {
    const r = compareWeeks([
      { energy_score: 4, created_at: at(6, 20) },
      { energy_score: 2, created_at: at(6, 8) },
    ], [], NOW);
    expect(r.daily).toEqual([null, 'regulated', null, null, null, null, null]);
  });

  it('splits this week from last week and ignores older data', () => {
    const r = compareWeeks([
      { energy_score: 3, created_at: at(5) },
      { energy_score: 3, created_at: new Date(2026, 9, 4, 23, 59).toISOString() },
      { energy_score: 3, created_at: new Date(2026, 8, 28, 0, 0).toISOString() },
      { energy_score: 3, created_at: new Date(2026, 8, 27, 12).toISOString() },
    ], [], NOW);
    expect(r.thisWeek.days).toBe(1);
    expect(r.lastWeek.days).toBe(2);
  });

  it('sums minutes only from completed sessions, rounded per week', () => {
    const r = compareWeeks([], [
      { created_at: at(6), status: 'completed', seconds: 300 },
      { created_at: at(7), status: 'completed', seconds: 150 },
      { created_at: at(7), status: 'abandoned', seconds: 600 },
      { created_at: new Date(2026, 9, 1, 9).toISOString(), status: 'completed', seconds: 90 },
    ], NOW);
    expect(r.thisWeek.minutes).toBe(8); // 450s = 7.5 → 8
    expect(r.lastWeek.minutes).toBe(2); // 90s = 1.5 → 2
  });

  it('handles an empty history', () => {
    expect(compareWeeks([], [], NOW)).toEqual({
      thisWeek: { days: 0, minutes: 0 },
      lastWeek: { days: 0, minutes: 0 },
      daily: [null, null, null, null, null, null, null],
    });
  });
});

describe('isSameLocalDay', () => {
  it('compares calendar days in local time', () => {
    expect(isSameLocalDay(new Date(2026, 9, 8, 0, 1), new Date(2026, 9, 8, 23, 59))).toBe(true);
    expect(isSameLocalDay(new Date(2026, 9, 8, 23, 59), new Date(2026, 9, 9, 0, 1))).toBe(false);
  });
});
```

- [ ] **Step 2: Run** `npx jest __tests__/weekCompare.test.ts` → FAIL (module missing).

- [ ] **Step 3: Create `src/domain/insights/weekCompare.ts`**

```ts
import type { Session, UserState } from '@/types';
import { mapEnergyToState } from '@/domain/checkin/moods';

export interface WeekCheckIn { energy_score: number; created_at: string }
export interface WeekSession { created_at: string; status: Session['status']; seconds: number }
export interface WeekStats { days: number; minutes: number }
export interface WeekComparison {
  thisWeek: WeekStats;
  lastWeek: WeekStats;
  /** Mon→Sun of the current week: the latest mood that day, or null. */
  daily: (UserState | null)[];
}

/** Monday = 0 … Sunday = 6. */
function weekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return dayKey(a) === dayKey(b);
}

export function weekBounds(now: Date): { lastStart: Date; thisStart: Date; nextStart: Date } {
  const thisStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - weekdayIndex(now));
  const lastStart = new Date(thisStart.getFullYear(), thisStart.getMonth(), thisStart.getDate() - 7);
  const nextStart = new Date(thisStart.getFullYear(), thisStart.getMonth(), thisStart.getDate() + 7);
  return { lastStart, thisStart, nextStart };
}

export function compareWeeks(
  checkIns: WeekCheckIn[],
  sessions: WeekSession[],
  now: Date = new Date(),
): WeekComparison {
  const { lastStart, thisStart, nextStart } = weekBounds(now);
  const inThis = (t: Date) => t >= thisStart && t < nextStart;
  const inLast = (t: Date) => t >= lastStart && t < thisStart;

  const thisDays = new Set<string>();
  const lastDays = new Set<string>();
  const daily: (UserState | null)[] = [null, null, null, null, null, null, null];
  const latestAt: number[] = [-1, -1, -1, -1, -1, -1, -1];

  for (const ci of checkIns) {
    const t = new Date(ci.created_at);
    if (inThis(t)) {
      thisDays.add(dayKey(t));
      const i = weekdayIndex(t);
      if (t.getTime() > latestAt[i]!) {
        latestAt[i] = t.getTime();
        daily[i] = mapEnergyToState(ci.energy_score);
      }
    } else if (inLast(t)) {
      lastDays.add(dayKey(t));
    }
  }

  let thisSeconds = 0;
  let lastSeconds = 0;
  for (const s of sessions) {
    if (s.status !== 'completed') continue;
    const t = new Date(s.created_at);
    if (inThis(t)) thisSeconds += s.seconds;
    else if (inLast(t)) lastSeconds += s.seconds;
  }

  return {
    thisWeek: { days: thisDays.size, minutes: Math.round(thisSeconds / 60) },
    lastWeek: { days: lastDays.size, minutes: Math.round(lastSeconds / 60) },
    daily,
  };
}
```

- [ ] **Step 4: Run** `npx jest __tests__/weekCompare.test.ts` → PASS; `npm run typecheck`; `npm test`.

- [ ] **Step 5: Commit** — `feat(insights): pure this-week-vs-last comparison`

---

### Task 5: Let users update their own check-ins (DB)

**Files:**
- Modify: `supabase/schema.sql` — after the `check_ins_insert_own` policy (around line 74-76)
- Modify: `DATABASE.md` — the `check_ins` RLS row/section
- Modify: `API_MAP.md` — sessionStore section (new calls)

- [ ] **Step 1: Add the policy to `supabase/schema.sql`**

```sql
drop policy if exists "check_ins_update_own" on public.check_ins;
create policy "check_ins_update_own" on public.check_ins
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

- [ ] **Step 2: `DATABASE.md`** — in the `check_ins` RLS description add: "`check_ins_update_own` — users may update only their own rows (used to add sleep/note after a one-tap check-in, or change today's mood)."

- [ ] **Step 3: `API_MAP.md`** — under the session store, replace the `checkIn` entry with: `logCheckIn` → `check_ins.insert(...).select().single()`; `updateCheckIn` → `check_ins.update(patch).eq('id', id).select().single()`; `startTodaysSession` → `profiles.select('is_premium')`, `sessions` count, `exercises.select`, `session_blocks` recency, `sessions.insert`, `session_blocks.insert`; `loadWeek` → `check_ins.select('energy_score, created_at').gte(lastStart)` and `sessions.select('created_at, status, session_blocks(actual_duration)').eq('status','completed').gte(lastStart)`.

- [ ] **Step 4: Run** `npm test` (no code change; sanity) → green.

- [ ] **Step 5: Commit** — `feat(db): users can update their own check-ins`

> Deploy note for the human: run the two policy statements in the Supabase SQL editor (the file is idempotent; re-running all of `schema.sql` also works).

---

### Task 6: Split check-in from session in the store

**Files:**
- Modify: `src/store/sessionStore.ts`
- Modify: `__tests__/sessionFlow.test.ts`
- Modify: `__tests__/sessionStore.test.ts`

**Interfaces:**
- Consumes: `moodToEnergy`, `mapEnergyToState` (Task 3); `compareWeeks`, `weekBounds`, `isSameLocalDay`, `WeekComparison` (Task 4).
- Produces (on `useSessionStore`):
  - `homeStep: 'pick' | 'logged' | 'done'` (initial `'done'`)
  - `week: WeekComparison | null`
  - `logCheckIn(mood: UserState): Promise<void>` — throws on failure
  - `updateCheckIn(patch: { sleep_quality?: CheckIn['sleep_quality']; intention?: string | null; energy_score?: number }): Promise<void>` — throws on failure
  - `startTodaysSession(): Promise<void>`
  - `dismissForToday(): void`
  - `changeTodaysCheckIn(): void` — sets `homeStep: 'pick'`
  - `loadWeek(): Promise<void>` — never throws; sets `week` or leaves `null`
  - **Removed:** `checkIn(...)`

- [ ] **Step 1: Upgrade the flow-test mock** in `__tests__/sessionFlow.test.ts`. Above `jest.mock('../src/services/supabase', …)` add:

```ts
const mockCalls: { table: string; op: string; payload: any }[] = [];
const mockConfig = { premium: true, completedCount: 0, failCheckInInsert: false };
```

In `resolveResult`, replace the `profiles` and `check_ins` cases and the `sessions` select branch:

```ts
      case 'profiles':
        return { data: { is_premium: mockConfig.premium }, error: null };
      case 'check_ins':
        if (op === 'insert') {
          return mockConfig.failCheckInInsert
            ? { data: null, error: new Error('network down') }
            : { data: { id: 'ci1', created_at: new Date().toISOString(), ...(payload || {}) }, error: null };
        }
        if (op === 'update') return { data: { id: 'ci1', ...(payload || {}) }, error: null };
        return { data: [], error: null };
      case 'sessions':
        if (op === 'insert') return { data: { id: 'sess1', ...(payload || {}) }, error: null };
        return single ? { data: null, error: null } : { data: [], count: mockConfig.completedCount, error: null };
```

In `makeBuilder`, record every terminal call — change the three op setters to also push, e.g.:

```ts
      insert: (p: unknown) => { state.op = 'insert'; state.payload = p; mockCalls.push({ table, op: 'insert', payload: p }); return builder; },
      update: (p: unknown) => { state.op = 'update'; state.payload = p; mockCalls.push({ table, op: 'update', payload: p }); return builder; },
```

and make `select` record reads of `profiles`: `select: () => { if (table === 'profiles') mockCalls.push({ table, op: 'select', payload: null }); return builder; },`

In `beforeEach` add: `mockCalls.length = 0; Object.assign(mockConfig, { premium: true, completedCount: 0, failCheckInInsert: false });` and add `homeStep: 'done', week: null` to the `setState`.

- [ ] **Step 2: Replace the four existing tests** in the `describe` with:

```ts
  it('logs a one-tap check-in without composing or touching the paywall', async () => {
    await useSessionStore.getState().logCheckIn('regulated');
    const s = useSessionStore.getState();
    expect(s.currentCheckIn).toMatchObject({ id: 'ci1', energy_score: 4, sleep_quality: null, intention: null });
    expect(s.homeStep).toBe('logged');
    expect(s.currentSession).toBeNull();
    expect(s.paywallVisible).toBe(false);
    expect(mockCalls.some((c) => c.table === 'profiles')).toBe(false);
  });

  it("composes today's session from the logged mood", async () => {
    await useSessionStore.getState().logCheckIn('regulated');
    await useSessionStore.getState().startTodaysSession();
    const s = useSessionStore.getState();
    expect(s.error).toBeNull();
    expect(s.currentSession).toMatchObject({ id: 'sess1', state: 'regulated', check_in_id: 'ci1' });
    expect(s.composedBlocks.map((b) => b.exercise.category)).toEqual(['mobilize', 'strengthen', 'move', 'downshift']);
  });

  it('shows the paywall only when starting a session past the free limit', async () => {
    mockConfig.premium = false;
    mockConfig.completedCount = 5;
    await useSessionStore.getState().logCheckIn('recovering');
    expect(useSessionStore.getState().paywallVisible).toBe(false);
    await useSessionStore.getState().startTodaysSession();
    expect(useSessionStore.getState().paywallVisible).toBe(true);
    expect(useSessionStore.getState().currentSession).toBeNull();
  });

  it('completes the session, resets state and returns Home to the week view', async () => {
    await useSessionStore.getState().logCheckIn('regulated');
    await useSessionStore.getState().startTodaysSession();
    await useSessionStore.getState().completeSession(2, 'felt great');
    const s = useSessionStore.getState();
    expect(s.error).toBeNull();
    expect(s.currentSession).toBeNull();
    expect(s.composedBlocks).toEqual([]);
    expect(s.homeStep).toBe('done');
  });

  it('adds sleep and a trimmed note to today\'s check-in', async () => {
    await useSessionStore.getState().logCheckIn('overloaded');
    await useSessionStore.getState().updateCheckIn({ sleep_quality: 'poor', intention: '  move gently  ' });
    const ci = useSessionStore.getState().currentCheckIn;
    expect(ci).toMatchObject({ sleep_quality: 'poor', intention: 'move gently' });
    expect(mockCalls.filter((c) => c.table === 'check_ins' && c.op === 'update')).toHaveLength(1);
  });

  it('stores null for a blank note', async () => {
    await useSessionStore.getState().logCheckIn('overloaded');
    await useSessionStore.getState().updateCheckIn({ intention: '   ' });
    expect(useSessionStore.getState().currentCheckIn?.intention).toBeNull();
  });

  it("changing today's mood updates the existing row instead of inserting", async () => {
    await useSessionStore.getState().logCheckIn('overloaded');
    useSessionStore.getState().changeTodaysCheckIn();
    expect(useSessionStore.getState().homeStep).toBe('pick');
    await useSessionStore.getState().logCheckIn('activated');
    expect(mockCalls.filter((c) => c.table === 'check_ins' && c.op === 'insert')).toHaveLength(1);
    expect(useSessionStore.getState().currentCheckIn?.energy_score).toBe(5);
    expect(useSessionStore.getState().homeStep).toBe('logged');
  });

  it('keeps nothing and rethrows when the check-in cannot be saved', async () => {
    mockConfig.failCheckInInsert = true;
    await expect(useSessionStore.getState().logCheckIn('regulated')).rejects.toBeTruthy();
    expect(useSessionStore.getState().currentCheckIn).toBeNull();
    expect(useSessionStore.getState().homeStep).toBe('done');
  });

  it('dismissForToday moves Home to the week view', async () => {
    await useSessionStore.getState().logCheckIn('recovering');
    useSessionStore.getState().dismissForToday();
    expect(useSessionStore.getState().homeStep).toBe('done');
  });

  it('loadWeek never throws and yields a comparison', async () => {
    await useSessionStore.getState().loadWeek();
    expect(useSessionStore.getState().week).toEqual({
      thisWeek: { days: 0, minutes: 0 },
      lastWeek: { days: 0, minutes: 0 },
      daily: [null, null, null, null, null, null, null],
    });
  });
```

In `__tests__/sessionStore.test.ts` replace the `checkIn rejects when unauthenticated` test with:

```ts
  it('logCheckIn rejects when unauthenticated', async () => {
    await expect(useSessionStore.getState().logCheckIn('regulated')).rejects.toThrow('Unauthenticated');
  });

  it('starts on the week view step with no week loaded', () => {
    const s = useSessionStore.getState();
    expect(s.homeStep).toBe('done');
    expect(s.week).toBeNull();
  });
```

- [ ] **Step 3: Run** `npx jest __tests__/sessionFlow.test.ts __tests__/sessionStore.test.ts` → FAIL (`logCheckIn` not a function).

- [ ] **Step 4: Implement in `src/store/sessionStore.ts`**

Imports:

```ts
import { mapEnergyToState, moodToEnergy } from '@/domain/checkin/moods';
import { compareWeeks, isSameLocalDay, weekBounds, type WeekComparison } from '@/domain/insights/weekCompare';
export { mapEnergyToState } from '@/domain/checkin/moods';
```

Interface: remove `checkIn`; add

```ts
  homeStep: 'pick' | 'logged' | 'done';
  week: WeekComparison | null;
  logCheckIn: (mood: UserState) => Promise<void>;
  updateCheckIn: (patch: {
    sleep_quality?: CheckIn['sleep_quality'];
    intention?: string | null;
    energy_score?: number;
  }) => Promise<void>;
  startTodaysSession: () => Promise<void>;
  dismissForToday: () => void;
  changeTodaysCheckIn: () => void;
  loadWeek: () => Promise<void>;
```

Initial state: `homeStep: 'done', week: null,`. Simple actions:

```ts
  dismissForToday: () => set({ homeStep: 'done' }),
  changeTodaysCheckIn: () => set({ homeStep: 'pick' }),
```

Replace the whole `checkIn` action with these three:

```ts
  logCheckIn: async (mood) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthenticated');

    // Re-picking today's mood edits the existing row: a day is one check-in.
    const existing = get().currentCheckIn;
    if (existing && isSameLocalDay(new Date(existing.created_at), new Date())) {
      await get().updateCheckIn({ energy_score: moodToEnergy(mood) });
      set({ homeStep: 'logged' });
      return;
    }

    set({ loading: true, error: null });
    try {
      // Logging is the free, always-available core action — no paywall here, ever.
      const { data: checkIn, error: ciErr } = await supabase
        .from('check_ins')
        .insert({
          user_id: user.id,
          energy_score: moodToEnergy(mood),
          sleep_quality: null,
          intention: null,
          engine_version: ENGINE_VERSION,
        })
        .select()
        .single();
      if (ciErr) throw ciErr;

      set({ currentCheckIn: checkIn, homeStep: 'logged', loading: false });
      telemetry.capture('checkin_completed', { state: mood });
    } catch (err) {
      set({ error: friendlyErrorMessage(err), loading: false });
      throw err;
    }
  },

  updateCheckIn: async (patch) => {
    const ci = get().currentCheckIn;
    if (!ci) return;
    const clean = { ...patch };
    if ('intention' in clean) clean.intention = clean.intention?.trim() || null;

    const { error } = await supabase
      .from('check_ins')
      .update(clean)
      .eq('id', ci.id)
      .select()
      .single();
    if (error) throw error;

    set({ currentCheckIn: { ...ci, ...clean } });
  },

  startTodaysSession: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthenticated');
    const checkIn = get().currentCheckIn;
    if (!checkIn) throw new Error('No check-in today');

    set({ loading: true, error: null });
    try {
      // >>> Move here, unchanged, the body of the old checkIn from
      // "Check for Premium status and Free Session Count limit" through the final
      // telemetry captures, EXCEPT:
      //   - delete step "1. Save check-in" (the check_ins insert) entirely;
      //   - `mapEnergyToState(energyScore)` → `mapEnergyToState(checkIn.energy_score)`;
      //   - `check_in_id: checkIn.id` stays as is (now the stored check-in);
      //   - in the final set(...), drop `currentCheckIn: checkIn` (it is already set);
      //   - delete the `checkin_completed` capture (logCheckIn owns it), keep `session_generated`.
    } catch (err) {
      set({ error: friendlyErrorMessage(err), loading: false });
      throw err;
    }
  },
```

The `>>>` block is a literal move of existing lines 141–160 and 176–255 from today's `checkIn` with exactly the four listed edits; nothing else changes.

`completeSession` final `set({...})`: add `homeStep: 'done',`. Then call the week refresh (best-effort) right after the existing stats reload: `await get().loadWeek();` (it never throws).

`loadWeek`:

```ts
  loadWeek: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { lastStart } = weekBounds(new Date());
      const since = lastStart.toISOString();

      const { data: cis } = await supabase
        .from('check_ins')
        .select('energy_score, created_at')
        .eq('user_id', user.id)
        .gte('created_at', since);

      const { data: sess } = await supabase
        .from('sessions')
        .select('created_at, status, session_blocks(actual_duration)')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', since);

      const sessions = (sess || []).map((s: any) => ({
        created_at: s.created_at,
        status: s.status,
        seconds: (s.session_blocks || []).reduce(
          (sum: number, b: { actual_duration: number | null }) => sum + (b.actual_duration ?? 0),
          0,
        ),
      }));

      set({ week: compareWeeks(cis || [], sessions, new Date()) });
    } catch (err) {
      console.warn('Could not load week:', err);
    }
  },
```

- [ ] **Step 5: Run** `npx jest __tests__/sessionFlow.test.ts __tests__/sessionStore.test.ts` → PASS. `npm run typecheck` will now FAIL in `src/components/CheckInFlow.tsx` (calls removed `checkIn`) — expected; Task 8 deletes that file. To keep this task's commit green, in this task change `CheckInFlow.tsx`'s `handleGenerate` to:

```ts
  const handleGenerate = async () => {
    try {
      await logCheckIn(mapEnergyToState(energy));
      await updateCheckIn({ sleep_quality: sleep, intention });
      await startTodaysSession();
    } catch (err) {
      console.warn('Check-in error:', err);
    }
  };
```

with `const logCheckIn = useSessionStore((s) => s.logCheckIn); const updateCheckIn = useSessionStore((s) => s.updateCheckIn); const startTodaysSession = useSessionStore((s) => s.startTodaysSession);` replacing the `checkIn` selector, and `import { mapEnergyToState } from '@/domain/checkin/moods';`. Then `npm run typecheck` → clean; `npm test` → green.

- [ ] **Step 6: Commit** — `feat(store): one-tap logCheckIn split from startTodaysSession; paywall only on start`

---

### Task 7: MoodTile, Chip and WeekCard components

**Files:**
- Create: `src/components/MoodTile.tsx`, `src/components/Chip.tsx`, `src/components/WeekCard.tsx`
- Create: `__tests__/homeComponents.test.tsx`

**Interfaces:**
- Consumes: `stateColors`, `colors` (Task 1); `MOOD_COPY`, `CHECKIN_COPY` (Task 3); `WeekComparison` (Task 4).
- Produces:
  - `MoodTile({ mood: UserState; onPress: () => void; selected?: boolean; disabled?: boolean })`
  - `Chip({ label: string; selected: boolean; onPress: () => void; accessibilityLabel?: string })`
  - `WeekCard({ week: WeekComparison | null })`

- [ ] **Step 1: Failing tests** — `__tests__/homeComponents.test.tsx`

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MoodTile } from '../src/components/MoodTile';
import { Chip } from '../src/components/Chip';
import { WeekCard } from '../src/components/WeekCard';

describe('<MoodTile />', () => {
  it('shows the plain-English label and fires onPress', () => {
    const onPress = jest.fn();
    const { getByRole, getByText } = render(<MoodTile mood="overloaded" onPress={onPress} />);
    expect(getByText('Running on empty')).toBeTruthy();
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('<Chip />', () => {
  it('exposes its selected state', () => {
    const { getByRole } = render(<Chip label="😴 Poor" selected onPress={() => {}} />);
    expect(getByRole('button').props.accessibilityState).toMatchObject({ selected: true });
  });
});

describe('<WeekCard />', () => {
  it('shows an empty state when there is no week yet', () => {
    const { getByText } = render(<WeekCard week={null} />);
    expect(getByText('Your week will appear here.')).toBeTruthy();
  });

  it('compares this week with last week', () => {
    const { getByText, getByLabelText } = render(
      <WeekCard
        week={{
          thisWeek: { days: 4, minutes: 23 },
          lastWeek: { days: 3, minutes: 15 },
          daily: ['recovering', 'regulated', null, 'overloaded', null, null, null],
        }}
      />,
    );
    expect(getByText('This week vs last')).toBeTruthy();
    expect(getByLabelText('Check-ins: 4 this week, 3 last week, up')).toBeTruthy();
    expect(getByLabelText('Minutes moved: 23 this week, 15 last week, up')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run** `npx jest __tests__/homeComponents.test.tsx` → FAIL (modules missing).

- [ ] **Step 3: Create `src/components/MoodTile.tsx`**

```tsx
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { stateColors } from '@/constants/colors';
import { MOOD_COPY } from '@/constants/copy';
import type { UserState } from '@/types';

interface Props {
  mood: UserState;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
}

/** One tap = one check-in. Pastel fill, but a dark ink border so it always reads as tappable. */
export function MoodTile({ mood, onPress, selected, disabled }: Props) {
  const c = stateColors[mood];
  const copy = MOOD_COPY[mood];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={copy.label}
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: c.soft, borderColor: c.ink },
        selected && styles.selected,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={styles.emoji} importantForAccessibility="no" accessibilityElementsHidden>
        {copy.emoji}
      </Text>
      <Text style={[styles.label, { color: c.ink }]}>{copy.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, minHeight: 104, borderRadius: 18, borderWidth: 1.5, padding: 14, justifyContent: 'flex-end' },
  selected: { borderWidth: 3 },
  pressed: { transform: [{ scale: 0.97 }] },
  emoji: { fontSize: 28, marginBottom: 6 },
  label: { fontSize: 15, fontWeight: '700', lineHeight: 19 },
});
```

- [ ] **Step 4: Create `src/components/Chip.tsx`**

```tsx
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@/constants/colors';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

export function Chip({ label, selected, onPress, accessibilityLabel }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      style={[styles.chip, selected && styles.selected]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  selected: { backgroundColor: colors.primary },
  label: { fontSize: 14, fontWeight: '600', color: colors.primary },
  labelSelected: { color: colors.onPrimary },
});
```

- [ ] **Step 5: Create `src/components/WeekCard.tsx`**

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { colors, stateColors } from '@/constants/colors';
import { CHECKIN_COPY } from '@/constants/copy';
import type { WeekComparison } from '@/domain/insights/weekCompare';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const BAR_HEIGHT: Record<string, number> = { overloaded: 0.35, recovering: 0.55, regulated: 0.8, activated: 1 };

function trend(now: number, before: number): { arrow: string; word: string } {
  if (now > before) return { arrow: '↑', word: 'up' };
  if (now < before) return { arrow: '↓', word: 'down' };
  return { arrow: '=', word: 'same' };
}

function Row({ label, now, before }: { label: string; now: number; before: number }) {
  const t = trend(now, before);
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${label}: ${now} this week, ${before} last week, ${t.word}`}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>
        {now} <Text style={styles.rowBefore}>vs {before}</Text> {t.arrow}
      </Text>
    </View>
  );
}

/** This week vs last. A low-energy day still gets a bar: showing up is what's counted. */
export function WeekCard({ week }: { week: WeekComparison | null }) {
  return (
    <Card>
      <Text style={styles.title} accessibilityRole="header">{CHECKIN_COPY.weekTitle}</Text>
      {!week ? (
        <Text style={styles.empty}>{CHECKIN_COPY.weekEmpty}</Text>
      ) : (
        <>
          <Row label={CHECKIN_COPY.checkIns} now={week.thisWeek.days} before={week.lastWeek.days} />
          <Row label={CHECKIN_COPY.minutes} now={week.thisWeek.minutes} before={week.lastWeek.minutes} />
          <View style={styles.bars} importantForAccessibility="no-hide-descendants">
            {week.daily.map((mood, i) => (
              <View key={i} style={styles.barCol}>
                <View style={styles.barTrack}>
                  {mood && (
                    <View
                      style={[styles.bar, { height: `${BAR_HEIGHT[mood]! * 100}%`, backgroundColor: stateColors[mood].tint }]}
                    />
                  )}
                </View>
                <Text style={styles.day}>{DAY_LETTERS[i]}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
  empty: { fontSize: 14, color: colors.textSecondary },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel: { fontSize: 14, color: colors.textSecondary },
  rowValue: { fontSize: 15, fontWeight: '700', color: colors.success },
  rowBefore: { fontWeight: '500', color: colors.textMuted },
  bars: { flexDirection: 'row', gap: 6, marginTop: 12 },
  barCol: { flex: 1, alignItems: 'center' },
  barTrack: { height: 52, width: '100%', justifyContent: 'flex-end', borderRadius: 6, backgroundColor: colors.surfaceSecondary },
  bar: { width: '100%', borderRadius: 6 },
  day: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
});
```

- [ ] **Step 6: Run** `npx jest __tests__/homeComponents.test.tsx` → PASS; `npm run typecheck`; `npm test`.

- [ ] **Step 7: Commit** — `feat(ui): MoodTile, Chip and WeekCard`

---

### Task 8: The new 4-state Home

**Files:**
- Create: `src/components/home/MoodPicker.tsx`, `src/components/home/LoggedPanel.tsx`, `src/components/home/WeekView.tsx`
- Modify: `src/screens/main/HomeScreen.tsx` (whole file)
- Delete: `src/components/CheckInFlow.tsx`
- Create: `__tests__/HomeScreen.test.tsx`

**Interfaces:**
- Consumes: store actions/fields from Task 6; components from Tasks 2 and 7; copy from Task 3.
- Produces: `MoodPicker()`, `LoggedPanel()`, `WeekView()` — all read the store directly (thin components, store owns async).

- [ ] **Step 1: Failing test** — `__tests__/HomeScreen.test.tsx`

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../src/services/supabase', () => ({
  supabase: { auth: { getUser: jest.fn(async () => ({ data: { user: null } })) } },
}));
jest.mock('../src/services/telemetry', () => ({ telemetry: { capture: jest.fn() } }));
jest.mock('../src/services/notifications', () => ({ scheduleAdaptiveNudge: jest.fn() }));
jest.mock('../src/hooks/useBehavioralProfile', () => ({ useBehavioralProfile: () => ({ profile: null }) }));
jest.mock('../src/components/SessionOverview', () => ({ SessionOverview: () => null }));
jest.mock('../src/components/SessionPlayer', () => ({ SessionPlayer: () => null }));
jest.mock('../src/components/SessionComplete', () => ({ SessionComplete: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import HomeScreen from '../src/screens/main/HomeScreen';
import { useSessionStore } from '../src/store/sessionStore';

const noop = async () => {};
const base = {
  currentSession: null,
  currentCheckIn: null,
  composedBlocks: [],
  activeBlockIndex: 0,
  paywallVisible: false,
  loading: false,
  error: null,
  week: null,
  loadStatsAndHistory: noop,
  loadWeek: noop,
};
const todayCheckIn = {
  id: 'ci1', user_id: 'u', energy_score: 1, sleep_quality: null, intention: null,
  engine_version: 'v3.0', created_at: new Date().toISOString(),
};

describe('<HomeScreen /> states', () => {
  it('no check-in today → the four mood tiles', () => {
    useSessionStore.setState({ ...base, homeStep: 'done' } as any);
    const { getByText } = render(<HomeScreen />);
    for (const label of ['Running on empty', 'A bit low', 'Steady', 'Buzzing']) expect(getByText(label)).toBeTruthy();
  });

  it('just logged → reassurance plus Start / Not now', () => {
    useSessionStore.setState({ ...base, currentCheckIn: todayCheckIn, homeStep: 'logged' } as any);
    const { getByText } = render(<HomeScreen />);
    expect(getByText("Running on empty. That's okay.")).toBeTruthy();
    expect(getByText('Start')).toBeTruthy();
    expect(getByText("Not now — I'm done for today")).toBeTruthy();
  });

  it('done for today → the week view', () => {
    useSessionStore.setState({ ...base, currentCheckIn: todayCheckIn, homeStep: 'done' } as any);
    const { getByText } = render(<HomeScreen />);
    expect(getByText('This week vs last')).toBeTruthy();
    expect(getByText("Change today's check-in")).toBeTruthy();
  });

  it('changing today → tiles again even with a check-in', () => {
    useSessionStore.setState({ ...base, currentCheckIn: todayCheckIn, homeStep: 'pick' } as any);
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Buzzing')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run** `npx jest __tests__/HomeScreen.test.tsx` → FAIL.

- [ ] **Step 3: Create `src/components/home/MoodPicker.tsx`**

```tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MoodTile } from '@/components/MoodTile';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { CHECKIN_COPY, checkInPrompt } from '@/constants/copy';
import { MOODS } from '@/domain/checkin/moods';
import { useSessionStore } from '@/store/sessionStore';
import type { UserState } from '@/types';

export function MoodPicker({ name }: { name?: string | null }) {
  const logCheckIn = useSessionStore((s) => s.logCheckIn);
  const safeHarbor = useSessionStore((s) => s.safeHarborBypass);
  const loading = useSessionStore((s) => s.loading);
  const [picked, setPicked] = useState<UserState | null>(null);
  const [failed, setFailed] = useState(false);

  const pick = async (mood: UserState) => {
    setPicked(mood);
    setFailed(false);
    try {
      await logCheckIn(mood);
    } catch {
      setFailed(true); // keep the tile selected; one tap retries
    }
  };

  return (
    <View>
      <Text style={styles.prompt} accessibilityRole="header">{checkInPrompt(name)}</Text>
      <View style={styles.grid}>
        {[0, 2].map((row) => (
          <View key={row} style={styles.row}>
            {MOODS.slice(row, row + 2).map((m) => (
              <MoodTile key={m} mood={m} selected={picked === m} disabled={loading} onPress={() => pick(m)} />
            ))}
          </View>
        ))}
      </View>
      {failed && picked && (
        <Button label={CHECKIN_COPY.saveFailed} variant="link" onPress={() => pick(picked)} />
      )}
      <Button
        label={CHECKIN_COPY.gentleReset}
        variant="link"
        disabled={loading}
        onPress={() => safeHarbor().catch((e) => console.warn('Gentle reset error:', e))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  prompt: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginBottom: 16, lineHeight: 30 },
  grid: { gap: 10, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 10 },
});
```

- [ ] **Step 4: Create `src/components/home/LoggedPanel.tsx`**

```tsx
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { colors, stateColors } from '@/constants/colors';
import { CHECKIN_COPY, MOOD_COPY, SLEEP_COPY } from '@/constants/copy';
import { mapEnergyToState } from '@/domain/checkin/moods';
import { useSessionStore } from '@/store/sessionStore';
import type { CheckIn } from '@/types';

export function LoggedPanel() {
  const checkIn = useSessionStore((s) => s.currentCheckIn);
  const start = useSessionStore((s) => s.startTodaysSession);
  const dismiss = useSessionStore((s) => s.dismissForToday);
  const update = useSessionStore((s) => s.updateCheckIn);
  const loading = useSessionStore((s) => s.loading);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(checkIn?.intention ?? '');
  const [updateFailed, setUpdateFailed] = useState(false);

  if (!checkIn) return null;
  const mood = mapEnergyToState(checkIn.energy_score);
  const copy = MOOD_COPY[mood];
  const c = stateColors[mood];

  const save = async (patch: Parameters<typeof update>[0]) => {
    setUpdateFailed(false);
    try {
      await update(patch);
    } catch {
      setUpdateFailed(true);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <View>
        <Text style={styles.logged}>{CHECKIN_COPY.logged}</Text>
        <Text style={styles.reassurance} accessibilityRole="header">{copy.reassurance}</Text>
      </View>

      <Card style={{ backgroundColor: c.soft, borderColor: c.ink, borderWidth: 1.5 }}>
        <Text style={[styles.sessionTitle, { color: c.ink }]}>{copy.sessionTitle}</Text>
        <Text style={[styles.sessionFeel, { color: c.ink }]}>{copy.sessionFeel}</Text>
      </Card>

      <Button
        label={CHECKIN_COPY.start}
        loading={loading}
        onPress={() => start().catch((e) => console.warn('Start session error:', e))}
      />
      <Button label={CHECKIN_COPY.notNow} variant="secondary" disabled={loading} onPress={dismiss} />

      <Card>
        <Text style={styles.small}>{CHECKIN_COPY.sleepPrompt}</Text>
        <View style={styles.chips}>
          {(['poor', 'fair', 'good'] as const).map((s) => (
            <Chip
              key={s}
              label={SLEEP_COPY[s]}
              accessibilityLabel={`Sleep: ${SLEEP_COPY[s].slice(2).trim()}`}
              selected={checkIn.sleep_quality === s}
              onPress={() => save({ sleep_quality: s as CheckIn['sleep_quality'] })}
            />
          ))}
        </View>
      </Card>

      {noteOpen ? (
        <Card>
          <TextInput
            value={note}
            onChangeText={setNote}
            accessibilityLabel="Note for today, optional"
            placeholder={CHECKIN_COPY.notePlaceholder}
            placeholderTextColor={colors.textMuted}
            maxLength={80}
            returnKeyType="done"
            style={styles.input}
          />
          <Button label={CHECKIN_COPY.saveNote} variant="secondary" size="sm" onPress={() => save({ intention: note })} />
        </Card>
      ) : (
        <Button label={CHECKIN_COPY.addNote} variant="link" onPress={() => setNoteOpen(true)} />
      )}

      {updateFailed && <Text style={styles.error} accessibilityLiveRegion="polite">{CHECKIN_COPY.updateFailed}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  logged: { fontSize: 14, fontWeight: '700', color: colors.success },
  reassurance: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, lineHeight: 30, marginTop: 2 },
  sessionTitle: { fontSize: 17, fontWeight: '800' },
  sessionFeel: { fontSize: 15, marginTop: 4, lineHeight: 21 },
  small: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  chips: { flexDirection: 'row', gap: 8, marginTop: 10 },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  error: { fontSize: 14, color: colors.error },
});
```

- [ ] **Step 5: Create `src/components/home/WeekView.tsx`**

```tsx
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WeekCard } from '@/components/WeekCard';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { CHECKIN_COPY, MOOD_COPY } from '@/constants/copy';
import { mapEnergyToState } from '@/domain/checkin/moods';
import { useSessionStore } from '@/store/sessionStore';

export function WeekView({ name }: { name?: string | null }) {
  const week = useSessionStore((s) => s.week);
  const loadWeek = useSessionStore((s) => s.loadWeek);
  const checkIn = useSessionStore((s) => s.currentCheckIn);
  const start = useSessionStore((s) => s.startTodaysSession);
  const change = useSessionStore((s) => s.changeTodaysCheckIn);
  const loading = useSessionStore((s) => s.loading);

  useEffect(() => {
    loadWeek();
  }, [loadWeek]);

  const mood = checkIn ? MOOD_COPY[mapEnergyToState(checkIn.energy_score)] : null;

  return (
    <View style={{ gap: 12 }}>
      {mood && <Text style={styles.today}>Today: {mood.emoji} {mood.label}</Text>}
      <Text style={styles.title} accessibilityRole="header">{CHECKIN_COPY.niceWeek(name)}</Text>
      <WeekCard week={week} />
      {checkIn && (
        <Button
          label={CHECKIN_COPY.anotherSession}
          variant="secondary"
          loading={loading}
          onPress={() => start().catch((e) => console.warn('Start session error:', e))}
        />
      )}
      {checkIn && <Button label={CHECKIN_COPY.changeToday} variant="link" onPress={change} />}
    </View>
  );
}

const styles = StyleSheet.create({
  today: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
});
```

- [ ] **Step 6: Replace `src/screens/main/HomeScreen.tsx`**

```tsx
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { useSessionStore } from '@/store/sessionStore';
import { SessionOverview } from '@/components/SessionOverview';
import { SessionPlayer } from '@/components/SessionPlayer';
import { SessionComplete } from '@/components/SessionComplete';
import { Paywall } from '@/components/Paywall';
import { BehavioralBanner } from '@/components/BehavioralBanner';
import { MoodPicker } from '@/components/home/MoodPicker';
import { LoggedPanel } from '@/components/home/LoggedPanel';
import { WeekView } from '@/components/home/WeekView';
import { useBehavioralProfile } from '@/hooks/useBehavioralProfile';
import { scheduleAdaptiveNudge } from '@/services/notifications';

const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function partOfDay(d: Date): string {
  const h = d.getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const name: string | null = user?.user_metadata?.name ?? null;

  const currentSession = useSessionStore((s) => s.currentSession);
  const currentCheckIn = useSessionStore((s) => s.currentCheckIn);
  const composedBlocks = useSessionStore((s) => s.composedBlocks);
  const activeIndex = useSessionStore((s) => s.activeBlockIndex);
  const paywallVisible = useSessionStore((s) => s.paywallVisible);
  const homeStep = useSessionStore((s) => s.homeStep);
  const loading = useSessionStore((s) => s.loading);
  const loadStatsAndHistory = useSessionStore((s) => s.loadStatsAndHistory);

  const { profile: behavioralProfile } = useBehavioralProfile();

  useEffect(() => {
    loadStatsAndHistory();
  }, [loadStatsAndHistory]);

  useEffect(() => {
    if (behavioralProfile) scheduleAdaptiveNudge(behavioralProfile.recovery.signal);
  }, [behavioralProfile]);

  const renderContent = () => {
    if (paywallVisible) return <Paywall />;

    if (loading && !currentSession && !currentCheckIn) {
      return (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (currentSession?.status === 'generated') return <SessionOverview />;
    if (currentSession?.status === 'started') {
      return activeIndex < composedBlocks.length ? <SessionPlayer /> : <SessionComplete />;
    }

    if (!currentCheckIn || homeStep === 'pick') {
      return (
        <View style={{ gap: 12 }}>
          <BehavioralBanner profile={behavioralProfile} />
          <MoodPicker name={name} />
        </View>
      );
    }

    if (homeStep === 'logged') return <LoggedPanel />;
    return <WeekView name={name} />;
  };

  const now = new Date();
  return (
    <Screen>
      <Header tag={`${WEEKDAY[now.getDay()]} ${partOfDay(now)}`} title="MoveKind" />
      {renderContent()}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { height: 300, alignItems: 'center', justifyContent: 'center' },
});
```

- [ ] **Step 7: Delete** `src/components/CheckInFlow.tsx` (`git rm`). Confirm no references: `npx tsc --noEmit` clean.

- [ ] **Step 8: Run** `npx jest __tests__/HomeScreen.test.tsx` → PASS. If `Screen`/`Header` need further mocks (e.g. `expo-linear-gradient`), add a `jest.mock` returning a passthrough `({children}) => children` and note it in the test file. Then `npm run typecheck`; `npm test`.

- [ ] **Step 9: Commit** — `feat(home): one-tap mood check-in, logged panel and week view replace the form + dead end`

---

### Task 9: Session screens — buttons, words, sizes

**Files:**
- Modify: `src/components/SessionOverview.tsx`, `src/components/SessionPlayer.tsx`, `src/components/SessionComplete.tsx`

Mechanical rules (apply to every file in this task):

1. Every `Pressable` that acts as a button → `<Button>`: the main forward action is `primary`, the alternative `secondary`, quiet escapes ("end early", "skip") `link`. Keep each existing `accessibilityLabel`/`onPress`, passing the label via `accessibilityLabel` when it differs from the visible text. Rating options in SessionComplete are a choice set → `Chip` (one row, `selected` = current rating).
2. Legacy colors → semantic: `bg`→`background`, `ink`→`textPrimary`, `muted`→`textSecondary`, `hint`→`textMuted`, `sage`/`sageDark`→`primary`, `sageLight`→`primarySoft`, `sageMid`→`stateColors.recovering.tint`; `sky*`→`stateColors.overloaded`, `blush*`→`stateColors.activated`, `warm*`→`stateColors.regulated` with `*Light`→`.soft`, `*Dark`→`.ink`, `*Accent`→`.accent`, bare→`.tint`. Per-state lookups that used `.tint` for text must use `.ink` (on `soft`) or `.accent` (on white/cream).
3. Any `fontSize` < 13 → 13; body copy → 14 minimum.
4. Copy: replace these strings exactly —
   - SessionComplete:56 → `` `You moved today even while feeling ${MOOD_COPY[session.state].label.toLowerCase()}. That's real self-trust.` `` (import `MOOD_COPY`)
   - SessionComplete:67 `'Attunement Win'` → `'You showed up'`
   - SessionComplete:68 → `'You checked in with yourself and moved in a way that fit today.'`
   - SessionComplete:182 `"Log capacity rating"` → `"Save how you feel now"`
   - SessionOverview:19 (overloaded) → `"Today is about recovering. Expect slow breathing and gentle release — nothing strenuous."`
   - Every other sentence in these three files containing a banned word (Global Constraints) is rewritten in the same plain voice, keeping its meaning; move rewritten strings into `copy.ts` under `SESSION_COPY`.
5. SessionPlayer's `[Static illustration: …]` placeholder (line ~116) is replaced with the exercise's category shown as a soft pill (`stateColors[session.state].soft` fill, `.ink` text) — no fake illustration text. (Real illustrations are a separate roadmap item.)

- [ ] **Step 1:** Apply the rules to `SessionOverview.tsx`. Run `npm run typecheck`.
- [ ] **Step 2:** Apply the rules to `SessionPlayer.tsx`. Run `npm run typecheck`.
- [ ] **Step 3:** Apply the rules to `SessionComplete.tsx`. Run `npm run typecheck`.
- [ ] **Step 4: Verify** no banned words or raw `Pressable` buttons remain:

Run: `npx jest` (all green) and confirm with Grep that `attunement|capacity|nervous system|parasympathetic|somatic` has no matches in these three files and that `Pressable` no longer appears in them.

- [ ] **Step 5: Commit** — `feat(ui): session screens on shared buttons, plain words, readable sizes`

---

### Task 10: Remaining screens — Paywall, Onboarding, Journey, Profile, auth, chrome

**Files:**
- Modify: `src/components/Paywall.tsx`, `src/screens/auth/OnboardingScreen.tsx`, `src/screens/main/JourneyScreen.tsx`, `src/screens/main/ProfileScreen.tsx`, `src/screens/auth/SignInScreen.tsx`, `src/screens/auth/SignUpScreen.tsx`, `src/components/BehavioralBanner.tsx`, `src/components/Header.tsx`, `src/components/BarChart.tsx`, `src/components/Slider.tsx`, `src/components/Screen.tsx`, `src/components/ErrorBoundary.tsx`, `src/navigation/TabNavigator.tsx`, `App.tsx`

- [ ] **Step 1:** Apply Task 9 rules 1–4 to `Paywall.tsx` (dismiss = `link`, upgrade = `primary`). Typecheck.
- [ ] **Step 2:** `OnboardingScreen.tsx`: rules 2–4; its radio/checkbox cards stay `Pressable` (they're choices, not buttons) but get a 1.5px `primary` border, `primarySoft` fill when selected, and keep their existing `accessibilityRole`/`accessibilityState`; Next/Back become `Button` (`primary`/`link`). Typecheck.
- [ ] **Step 3:** `JourneyScreen.tsx`, `ProfileScreen.tsx`, `SignInScreen.tsx`, `SignUpScreen.tsx`, `BehavioralBanner.tsx`, `Header.tsx`, `BarChart.tsx`, `Slider.tsx`, `Screen.tsx`, `ErrorBoundary.tsx`, `TabNavigator.tsx`, `App.tsx`: rules 2–4. Tab bar: active tint `primary`, inactive `textMuted`, background `surface`. Typecheck after each file.
- [ ] **Step 4: Run** `npm test` → green. Grep for banned words across `src/` (only `src/domain/sessions/voice.ts`'s code comment may remain — it is not UI copy).
- [ ] **Step 5: Commit** — `feat(ui): Sunrise + shared buttons across onboarding, journey, profile, auth`

---

### Task 11: Remove legacy aliases, docs, final verification

**Files:**
- Modify: `src/constants/colors.ts` (delete the legacy alias block)
- Modify: `CLAUDE.md` (Styling convention: drop "Legacy names … are aliases"; button kinds are `primary`/`secondary`/`link`; mood colors use `stateColors[state].soft/ink/accent/tint`)
- Modify: `PROJECT_MAP.md` (new files: `domain/checkin/moods.ts`, `domain/insights/weekCompare.ts`, `components/MoodTile.tsx`, `Chip.tsx`, `WeekCard.tsx`, `components/home/*`; `CheckInFlow.tsx` removed)
- Modify: `ARCHITECTURE.md` (check-in flow: `logCheckIn` → optional `startTodaysSession`; paywall only on start; Home 4-state order)
- Modify: `ROADMAP.md` (Redesign row 1 → ✅ with date and test count)

- [ ] **Step 1:** Delete the legacy alias block from `colors.ts`. Run `npm run typecheck` — any error names a file still using an alias; migrate it with Task 9 rule 2 until clean.
- [ ] **Step 2:** Update the four docs as listed.
- [ ] **Step 3: Full verification** — `npm run typecheck` clean; `npm test` all green (expect ≈125+ tests); `npx expo start --go` boots with no version warnings and `curl "http://localhost:8081/node_modules/expo/AppEntry.bundle?platform=android&dev=true"` returns HTTP 200; stop the server.
- [ ] **Step 4: Commit** — `chore(ui): drop legacy color aliases; docs for the one-tap redesign`
