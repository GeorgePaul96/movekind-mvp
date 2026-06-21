# 3A-3 — Adaptive Accountability Nudges

**Date:** 2026-06-21
**Status:** Approved design, not yet implemented
**Builds on:** the Phase 3A behavioral engine
([2026-06-18-phase3a-behavioral-intelligence-design.md](2026-06-18-phase3a-behavioral-intelligence-design.md)),
merged to `main`. Reuses `RecoveryState`, `useBehavioralProfile`.

## Context

The app already schedules one repeating 9am "daily-nudge" local notification whose copy is
keyed to the **last session's `state`** (`scheduleStateAwareNotification(yesterdayState,
completed)` in `src/services/notifications.ts`, called at session complete/abandon in
`sessionStore` and at app init). 3A-3 makes that nudge **adaptive to the user's recovery
pattern** — driven by `recovery.signal` (collapse/spiral/burnout_risk/returning/stable/thriving)
rather than a single session's state.

Emotional core: **"We help people return."** The escalation ladder is **anti-guilt-inverted** —
as a user disengages, copy gets *softer and more inviting*, never naggier. No streaks, no shame.

### Hard constraint (local notifications)

These are **local** notifications. A repeating nudge is scheduled once with fixed copy and
**cannot recompute while the app is closed.** So the nudge copy refreshes only when the app
recomputes a `BehavioralProfile` and reschedules: **on app open** and **at session end.** True
day-over-day escalation during a total absence would require a server/push (Edge Function +
push tokens + schema) and is explicitly out of scope.

## Scope

**In scope:**
1. `NUDGE_COPY` map + a pure `nudgeBodyFor()` selector in `copy.ts`.
2. `scheduleAdaptiveNudge(signal)` replacing `scheduleStateAwareNotification(...)` in
   `notifications.ts` (cancel/reschedule logic unchanged).
3. A standalone `fetchBehavioralProfile()` extracted from `useBehavioralProfile.ts`, reused by
   the store.
4. Wiring at the two recompute points: `HomeScreen` (app open) and `sessionStore`
   complete/abandon (session end); `initNotifications()` schedules a neutral default.

**Out of scope:** server push / absence-driven escalation, making the 9am time or frequency
configurable, any schema change, any `ENGINE_VERSION` change.

## Copy ladder (anti-guilt, inverted)

`NUDGE_COPY: Record<RecoverySignal, string>` — short, action-light bodies for the 9am nudge:

| signal | tone | body (verbatim) |
|---|---|---|
| `thriving` | light | "Your rhythm is strong. A session's here whenever you want it." |
| `stable` | steady | "A few kind minutes of movement are here when you're ready." |
| `returning` | warm welcome | "Good to see you back. Whenever you're ready, we'll meet you where you are." |
| `burnout_risk` | permission to rest | "Rest counts too. If you move today, keep it gentle and short." |
| `spiral` | very low pressure | "No pressure at all — even opening the app counts. We're here." |
| `collapse` | gentlest re-entry | "Whenever you're ready, the smallest step is enough. We'll meet you there." |

`nudgeBodyFor(signal: RecoverySignal | null): string` returns `NUDGE_COPY[signal]`, or a neutral
default when `signal` is `null` (no profile yet):
`"Check in when you're ready to compose today's session."`

## Architecture

```
copy.ts
  NUDGE_COPY: Record<RecoverySignal, string>
  nudgeBodyFor(signal: RecoverySignal | null): string   ← pure, unit-tested

src/hooks/useBehavioralProfile.ts
  fetchBehavioralProfile(): Promise<BehavioralProfile | null>   ← extracted, exported
  useBehavioralProfile()  ← now calls fetchBehavioralProfile internally (behavior unchanged)

src/services/notifications.ts
  scheduleAdaptiveNudge(signal: RecoverySignal | null)  ← body = nudgeBodyFor(signal);
                                                          same cancel-own + reschedule-9am logic
  initNotifications()  ← calls scheduleAdaptiveNudge(null)  (neutral default)
  (scheduleStateAwareNotification removed)

src/screens/main/HomeScreen.tsx
  effect: when behavioralProfile loads → scheduleAdaptiveNudge(profile.recovery.signal)

src/store/sessionStore.ts
  completeSession / abandonSession:
    replace scheduleStateAwareNotification(state, bool)
    with: const p = await fetchBehavioralProfile(); scheduleAdaptiveNudge(p?.recovery.signal ?? null)
```

**`scheduleAdaptiveNudge` signature/behavior:** identical I/O to today's function — web-guard,
fetch all scheduled, cancel only `data.kind === 'daily-nudge'`, schedule a new repeating 9am
notification with `data: { kind: 'daily-nudge' }`. Only the body source changes
(`nudgeBodyFor(signal)`), and it takes a `RecoverySignal | null` instead of `(state, completed)`.

**`fetchBehavioralProfile` extraction:** move the existing in-hook Supabase fetch (sessions
completed/abandoned, check_ins, post_ratings; 90-day window, 200-row cap; `post_ratings` has no
`user_id` filter — RLS-scoped) + `computeBehavioralProfile(...)` into a standalone exported async
function returning `BehavioralProfile | null` (null when unauthenticated or on error). The hook
calls it and keeps its `{ profile, loading }` contract unchanged. This is a pure refactor for
the hook (no behavior change) plus a new reusable export.

## Data flow

```
App open → HomeScreen useBehavioralProfile() → profile
            └─ effect → scheduleAdaptiveNudge(profile.recovery.signal) → reschedules 9am nudge

Session complete/abandon → sessionStore
            └─ fetchBehavioralProfile() → scheduleAdaptiveNudge(signal) → reschedules 9am nudge

App init (pre-profile) → initNotifications() → scheduleAdaptiveNudge(null) → neutral default nudge
```

## Error / empty handling

- `nudgeBodyFor(null)` → neutral default (covers no-history / unauthenticated / fetch error).
- `fetchBehavioralProfile()` swallows errors and returns `null` (consistent with the hook's
  existing degrade-to-empty behavior); `scheduleAdaptiveNudge(null)` then uses the default.
- `scheduleAdaptiveNudge` keeps the existing `try/catch` and web `Platform.OS` guard; notifications
  are best-effort.

## Testing

- **Unit (new):** `__tests__/nudge.test.ts` — `nudgeBodyFor` returns a non-empty body for each of
  the six `RecoverySignal` values and the neutral default for `null`. (Type system already forces
  `NUDGE_COPY` to cover all six signals via `Record<RecoverySignal, …>`.)
- **Not unit-tested:** `scheduleAdaptiveNudge`, `fetchBehavioralProfile`, and the Home/store
  wiring are I/O (expo-notifications / Supabase), consistent with how the hook and screens were
  handled in 3A-1/Spec B. Verification = full suite green + `npm run typecheck` + documented
  manual checks (new user → neutral/returning copy; an account in an avoidance pattern → the
  gentler `spiral`/`collapse` copy; completing a session reschedules to the post-session copy).

## Conventions & guardrails

- User-facing strings in `@/constants/copy`; `@/` alias in source.
- Do not change the 9am trigger, the `daily-nudge` data kind, or `sendNow`.
- Removing `scheduleStateAwareNotification` must update all callers (init + the two store calls).
- Verify with `npm run typecheck` and `npm test`.

## Open follow-ups (not this spec)
- Server-push escalation during prolonged absence (separate, larger project; needs schema + Edge Function).
- User-configurable nudge time / opt-out per signal.
