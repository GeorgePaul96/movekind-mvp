# 3A-3 Adaptive Accountability Nudges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the daily local nudge adaptive to the user's recovery pattern — copy driven by the behavioral engine's `recovery.signal` (anti-guilt-inverted escalation) instead of the last session's state.

**Architecture:** A pure `nudgeBodyFor()` selector + `NUDGE_COPY` map in `copy.ts` (unit-tested). `scheduleAdaptiveNudge(signal)` replaces `scheduleStateAwareNotification(...)` in `notifications.ts`, keeping the cancel-own-`daily-nudge` + reschedule-9am I/O unchanged. A standalone `fetchBehavioralProfile()` extracted from `useBehavioralProfile.ts` lets the store get a profile without React. Rescheduling happens on app open (HomeScreen effect) and at session end (sessionStore).

**Tech Stack:** TypeScript (strict), React Native / Expo, expo-notifications, Supabase, Jest.

## Global Constraints

- User-facing strings live in `@/constants/copy`; `@/` alias in source; test files use relative `../src/...`.
- Anti-guilt: copy gets SOFTER as the user disengages (`returning → burnout_risk → spiral → collapse`); never naggier, no streaks, no shame.
- Local-only: do NOT add server push, push tokens, or schema. Keep the 9am repeating trigger and the `data.kind === 'daily-nudge'` marker exactly as today.
- `scheduleStateAwareNotification` is REMOVED — every caller (init + both `sessionStore` calls) must be updated, or typecheck breaks.
- No `ENGINE_VERSION` change.
- Verify with `npm run typecheck` and `npm test`.

## File Structure

- Modify `src/constants/copy.ts` — add `NUDGE_COPY` + `nudgeBodyFor` (`RecoverySignal` already imported here).
- Create `__tests__/nudge.test.ts` — unit-test `nudgeBodyFor`.
- Modify `src/services/notifications.ts` — replace `scheduleStateAwareNotification` with `scheduleAdaptiveNudge`; `initNotifications` calls it with `null`.
- Modify `src/hooks/useBehavioralProfile.ts` — extract & export `fetchBehavioralProfile()`; hook uses it.
- Modify `src/store/sessionStore.ts` — both notification call sites use `fetchBehavioralProfile` + `scheduleAdaptiveNudge`.
- Modify `src/screens/main/HomeScreen.tsx` — effect reschedules on profile load.

---

### Task 1: NUDGE_COPY + `nudgeBodyFor` (pure)

**Files:**
- Modify: `src/constants/copy.ts`
- Test: `__tests__/nudge.test.ts`

**Interfaces:**
- Produces: `NUDGE_COPY: Record<RecoverySignal, string>` and `nudgeBodyFor(signal: RecoverySignal | null): string`.

- [ ] **Step 1: Write the failing test**

Create `__tests__/nudge.test.ts`:

```ts
import { nudgeBodyFor, NUDGE_COPY } from '../src/constants/copy';
import type { RecoverySignal } from '../src/domain/behavioral/types';

describe('nudgeBodyFor', () => {
  const signals: RecoverySignal[] = ['collapse', 'spiral', 'burnout_risk', 'returning', 'stable', 'thriving'];

  test('returns the mapped, non-empty body for every recovery signal', () => {
    for (const s of signals) {
      expect(nudgeBodyFor(s)).toBe(NUDGE_COPY[s]);
      expect(nudgeBodyFor(s).length).toBeGreaterThan(0);
    }
  });

  test('returns a neutral default (distinct from every signal body) for null', () => {
    const body = nudgeBodyFor(null);
    expect(body.length).toBeGreaterThan(0);
    expect(Object.values(NUDGE_COPY)).not.toContain(body);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- nudge`
Expected: FAIL — `nudgeBodyFor`/`NUDGE_COPY` are not exported from `copy.ts`.

- [ ] **Step 3: Implement the copy map + selector**

Append to the end of `src/constants/copy.ts` (the `import type { RecoverySignal } from '@/domain/behavioral/types';` line already exists at the top of this file from Phase 3A):

```ts
export const NUDGE_COPY: Record<RecoverySignal, string> = {
  thriving: "Your rhythm is strong. A session's here whenever you want it.",
  stable: "A few kind minutes of movement are here when you're ready.",
  returning: "Good to see you back. Whenever you're ready, we'll meet you where you are.",
  burnout_risk: 'Rest counts too. If you move today, keep it gentle and short.',
  spiral: "No pressure at all — even opening the app counts. We're here.",
  collapse: "Whenever you're ready, the smallest step is enough. We'll meet you there.",
};

const NUDGE_DEFAULT = "Check in when you're ready to compose today's session.";

export function nudgeBodyFor(signal: RecoverySignal | null): string {
  return signal ? NUDGE_COPY[signal] : NUDGE_DEFAULT;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- nudge`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/constants/copy.ts __tests__/nudge.test.ts
git commit -m "feat(notifications): NUDGE_COPY map + nudgeBodyFor selector"
```

---

### Task 2: Wire the adaptive nudge (scheduler, fetch extraction, callers)

This task is atomic: `scheduleStateAwareNotification` is removed and all callers updated in one commit so typecheck never breaks mid-way. No new unit tests (all changes are I/O — expo-notifications / Supabase / a screen — consistent with how the hook and screens were handled in 3A-1).

**Files:**
- Modify: `src/services/notifications.ts`
- Modify: `src/hooks/useBehavioralProfile.ts`
- Modify: `src/store/sessionStore.ts`
- Modify: `src/screens/main/HomeScreen.tsx`

**Interfaces:**
- Consumes: `nudgeBodyFor` from `@/constants/copy`; `computeBehavioralProfile`, `BehavioralProfile` from `@/domain/behavioral`; `RecoverySignal` from `@/domain/behavioral/types`.
- Produces: `scheduleAdaptiveNudge(signal: RecoverySignal | null): Promise<void>`; `fetchBehavioralProfile(): Promise<BehavioralProfile | null>`.

- [ ] **Step 1: Replace the scheduler in `notifications.ts`**

Rewrite `src/services/notifications.ts` so that `initNotifications` and a new `scheduleAdaptiveNudge` replace `scheduleStateAwareNotification`. Add the two imports at the top, change `initNotifications`'s last line, and replace the whole `scheduleStateAwareNotification` function with `scheduleAdaptiveNudge`. Leave the `Notifications.setNotificationHandler(...)` block and `sendNow` exactly as they are.

Top of file — add after the existing two imports:

```ts
import { nudgeBodyFor } from '@/constants/copy';
import type { RecoverySignal } from '@/domain/behavioral/types';
```

`initNotifications` — change its final line from `await scheduleStateAwareNotification('regulated', true);` to:

```ts
  await scheduleAdaptiveNudge(null); // neutral default until a profile is computed
```

Replace the entire `scheduleStateAwareNotification` function (the `export async function scheduleStateAwareNotification(...) { ... }` block) with:

```ts
/**
 * Reschedules the single repeating 9am "daily-nudge" with copy adapted to the
 * user's recovery signal. Cancels only its own daily-nudge entries (not others).
 */
export async function scheduleAdaptiveNudge(signal: RecoverySignal | null): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.content.data?.kind === 'daily-nudge') {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'MoveKind',
        body: nudgeBodyFor(signal),
        data: { kind: 'daily-nudge' },
      },
      trigger: {
        hour: 9,
        minute: 0,
        repeats: true,
      } as any,
    });
  } catch (err) {
    console.warn('Could not schedule adaptive nudge:', err);
  }
}
```

- [ ] **Step 2: Extract `fetchBehavioralProfile` in `useBehavioralProfile.ts`**

Rewrite `src/hooks/useBehavioralProfile.ts` to export a standalone `fetchBehavioralProfile()` and have the hook consume it. Replace the ENTIRE file contents with:

```ts
import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { computeBehavioralProfile, type BehavioralProfile } from '@/domain/behavioral';
import type { Session, CheckIn, PostRating } from '@/types';

const WINDOW_DAYS = 90;
const MAX_ROWS = 200;

/**
 * Fetches the user's recent history and computes a BehavioralProfile.
 * Returns null when unauthenticated or on error (callers fall back to a default).
 * Plain async function (no React) so non-component callers (e.g. the session store) can reuse it.
 */
export async function fetchBehavioralProfile(): Promise<BehavioralProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

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

    return computeBehavioralProfile(
      (sessRes.data as Session[]) ?? [],
      (ciRes.data as CheckIn[]) ?? [],
      (prRes.data as PostRating[]) ?? [],
    );
  } catch {
    return null;
  }
}

export function useBehavioralProfile(): { profile: BehavioralProfile | null; loading: boolean } {
  const [profile, setProfile] = useState<BehavioralProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const p = await fetchBehavioralProfile();
      if (active) {
        setProfile(p);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return { profile, loading };
}
```

> Note: the hook's `{ profile, loading }` contract is unchanged for its consumers (`BehavioralBanner` and `JourneyScreen` already handle a null `profile`). These screens are behind auth, so in practice `profile` is non-null there; null only occurs on a real fetch error.

- [ ] **Step 3: Update both `sessionStore` call sites**

In `src/store/sessionStore.ts`, replace the completeSession notification block. Find:

```ts
      try {
        const { scheduleStateAwareNotification } = await import('@/services/notifications');
        await scheduleStateAwareNotification(session.state, true);
      } catch (nErr) {
        console.warn('Could not schedule notification on completeSession:', nErr);
      }
```

Replace with:

```ts
      try {
        const { fetchBehavioralProfile } = await import('@/hooks/useBehavioralProfile');
        const { scheduleAdaptiveNudge } = await import('@/services/notifications');
        const p = await fetchBehavioralProfile();
        await scheduleAdaptiveNudge(p?.recovery.signal ?? null);
      } catch (nErr) {
        console.warn('Could not schedule notification on completeSession:', nErr);
      }
```

Then find the abandonSession block:

```ts
      try {
        const { scheduleStateAwareNotification } = await import('@/services/notifications');
        await scheduleStateAwareNotification(session.state, false);
      } catch (nErr) {
        console.warn('Could not schedule notification on abandonSession:', nErr);
      }
```

Replace with:

```ts
      try {
        const { fetchBehavioralProfile } = await import('@/hooks/useBehavioralProfile');
        const { scheduleAdaptiveNudge } = await import('@/services/notifications');
        const p = await fetchBehavioralProfile();
        await scheduleAdaptiveNudge(p?.recovery.signal ?? null);
      } catch (nErr) {
        console.warn('Could not schedule notification on abandonSession:', nErr);
      }
```

- [ ] **Step 4: Reschedule on app open in `HomeScreen`**

In `src/screens/main/HomeScreen.tsx`, add the scheduler import alongside the other imports (after the existing `import { useBehavioralProfile } from '@/hooks/useBehavioralProfile';` line):

```tsx
import { scheduleAdaptiveNudge } from '@/services/notifications';
```

The component already has `const { profile: behavioralProfile } = useBehavioralProfile();` and already imports `useEffect`. Add this effect immediately after the existing `useEffect(() => { loadStatsAndHistory(); }, [loadStatsAndHistory]);`:

```tsx
  useEffect(() => {
    if (behavioralProfile) {
      scheduleAdaptiveNudge(behavioralProfile.recovery.signal);
    }
  }, [behavioralProfile]);
```

- [ ] **Step 5: Typecheck and full suite**

Run: `npm run typecheck`
Expected: no errors. (If `tsc` reports `scheduleStateAwareNotification` is missing anywhere, a caller was not updated — fix it. There should be no remaining references.)
Run: `npm test`
Expected: PASS — all suites including the new `nudge` test (6 suites total).

- [ ] **Step 6: Manual verification (documented, no code)**

These paths are I/O and not unit-tested. Verify manually:
- Fresh app open with no history → 9am nudge uses the warm `returning` copy (new users compute `signal: 'returning'`); before any profile loads, init scheduled the neutral default.
- An account in an avoidance pattern (long gap, abandoned sessions) → nudge uses the gentler `spiral`/`collapse` copy, never a guilt message.
- Completing a session reschedules the nudge to the post-session signal (e.g. `stable`/`thriving`).
Note these in the commit body.

- [ ] **Step 7: Commit**

```bash
git add src/services/notifications.ts src/hooks/useBehavioralProfile.ts src/store/sessionStore.ts src/screens/main/HomeScreen.tsx
git commit -m "feat(notifications): recovery-driven adaptive nudges

Replaces scheduleStateAwareNotification with scheduleAdaptiveNudge driven by
recovery.signal; extracts fetchBehavioralProfile for non-React reuse; reschedules
on app open (HomeScreen) and session end (sessionStore). Manually verified
returning/avoidance/post-session copy."
```

---

## Notes for the implementer

- Run `npm test -- nudge` for fast feedback in Task 1; run full `npm test` + `npm run typecheck` before the Task 2 commit.
- Task 2 must remove `scheduleStateAwareNotification` AND update all three callers (init + two store sites) in the same commit — partial changes break typecheck.
- Keep the `Notifications.setNotificationHandler` block, the 9am repeating trigger, the `daily-nudge` data marker, and `sendNow` unchanged.
- `scheduleAdaptiveNudge` is fire-and-forget in `HomeScreen` (no `await`); it self-handles errors and the web guard.
