# MoveKind Roadmap

> Where the product goes from here. Phases are sequential by default but items inside a
> phase are independent. Every item must pass the anti-guilt filter (see Guardrails).
> Status: written 2026-07-04, immediately after Phase 3A shipped.

## Where we are

**Done (Phases 1–3A):**
- Core adaptive loop: check-in → capacity state → composed session → guided player →
  post-rating → server-side per-exercise stats (`ENGINE_VERSION v2.3`).
- Auth, onboarding, Supabase (Postgres + RLS + stats trigger), design system with
  explicit color contracts, Movement Rhythm (the streak replacement).
- Phase 3A Behavioral Intelligence: pure engine in `src/domain/behavioral/`
  (gaps, rhythm, recovery, wins, follow-through/self-trust), Journey insights,
  adaptive local nudges. 40 tests across 6 suites, all on the pure layer.

**Known debt (do not fix silently — fix deliberately, here):**
- No accessibility props anywhere in `src/` (labels, roles, reduced motion).
- Thin error handling: no error boundary, no offline/network-state handling.
- Stores and screens untested; only the pure domain layer has coverage.
- `premium.ts` / `startCheckout` is a stub; telemetry is a no-op without a PostHog key.
- `fetchBehavioralProfile` lives in `src/hooks/` but is imported by a store — belongs in `src/services/`.

---

## Phase 3B — Hardening & Trust *(next up)*

**Theme: the calm has to survive bad networks, screen readers, and our own bugs.**
An anti-guilt app that crashes mid-session or is unusable with VoiceOver breaks its
own promise. No new features until this lands.

| Item | Status | Notes |
|---|---|---|
| Accessibility pass | 🟡 core loop done (2026-07-04) | Done: labels/roles/states across CheckInFlow, Slider (adjustable + increment/decrement actions), SessionPlayer, SessionComplete, Button; decorative emoji hidden. **Remaining:** the six screens (Home, Journey, Profile, Onboarding, SignIn, SignUp) + touch-target/contrast audit. |
| Reduced motion | ✅ done (2026-07-04) | Toast respects `useReducedMotion`; Onboarding fades are Reanimated entering/exiting, which the OS setting disables automatically. |
| Resilience layer | 🟡 boundary done (2026-07-04) | Done: app-level `ErrorBoundary` with calm fallback (copy in `ERROR_FALLBACK`), wrapped in App.tsx, tested. **Remaining:** network-state awareness (offline queue for check-ins/ratings, sync on reconnect); graceful Supabase failure states in every store. |
| Store & flow tests | 🟡 started (2026-07-04) | Done: `mapEnergyToState` (all 5 scores), store initial state, paywall toggle, unauthenticated guards. **Remaining:** check-in → session → rating happy path with mocked Supabase; settings store. |
| Debt cleanup | ✅ done (2026-07-04) | `fetchBehavioralProfile` moved to `src/services/behavioralProfile.ts`; stale branch deleted; main pushed. |

**Exit criteria:** core loop fully usable with a screen reader; airplane-mode check-in
survives and syncs; error boundary catches a thrown render; store tests green.

## Phase 4 — Deeper Personalization

**Theme: the behavioral profile should change what the composer does, not just what the Journey screen says.**

| Item | Notes |
|---|---|
| Composer v3 | Feed `BehavioralProfile` signals (recovery debt, follow-through, gap profile) into composition: shorter sessions after long gaps, gentler re-entry blocks, favor exercises with high post-rating affinity. Pure function stays pure — profile comes in as an argument. Bump `ENGINE_VERSION` to `v3.0`; extend `composer.test.ts` first (TDD). |
| Intention at check-in | The deferred 3A feature. Optional one-line intention captured at check-in, reflected back at session end. Needs schema (`check_ins` column or new table) — sync `supabase/schema.sql` + `src/types/index.ts` + `DATABASE.md`. |
| Session player feel | Smoother block transitions and cue pacing using Reanimated/Gesture Handler patterns from the Software Mansion skill; honor reduced-motion from 3B. |
| Voice & cue quality | Audit `expo-speech` cue copy per capacity state (an `overloaded` user needs fewer, softer words); per-state speech rate. |

**Exit criteria:** two users with identical energy scores but different histories get
visibly different sessions; composer tests cover every new signal.

## Phase 5 — Sustainability (monetization + measurement)

**Theme: revenue and analytics, without ever importing guilt mechanics.**

| Item | Notes |
|---|---|
| Define premium | Decide the tier before wiring payments. Candidates: extended insights history, more exercise packs, voice options. **Never** paywall the core check-in → session loop or any recovery feature. |
| Wire Stripe | Replace the `startCheckout` stub (stripe plugin installed); server-side subscription state in Supabase with RLS; restore-purchases flow. |
| Activate PostHog | Turn on telemetry (posthog plugin installed) with a privacy-first contract: anonymous by default, no body-data events, measure *completion & return rhythm*, never *absence*. Feature flags for composer experiments. |
| Paywall UX | `Paywall.tsx` exists — pressure-free copy review; a "not now" that is one tap and never re-asks within the same session. |

**Exit criteria:** a real purchase completes in test mode; telemetry dashboard shows
session completion and return-rhythm funnels; flags can gate composer v3 variants.

## Phase 6 — Ship & Scale

**Theme: get it into strangers' hands.**

| Item | Notes |
|---|---|
| EAS pipeline | Dev-client builds → internal distribution → TestFlight/Play internal testing (expo skill covers EAS Build/Submit/Update). |
| OTA updates | EAS Update for JS-only fixes; adopt a channel strategy (production/preview). |
| Beta program | 20–50 users; the behavioral engine needs real longitudinal data — 90-day windows are untested with real humans. |
| Monitoring | Crash/error tracking (PostHog error tracking or Sentry); EAS Observe for build/update health. |
| Store presence | Screenshots, privacy labels (health data!), App Store/Play listings that market calm, not transformation. |

**Exit criteria:** app live in both stores' beta tracks; a JS fix reaches users via OTA
without a store review.

## Later / unscheduled ideas

- **Apple Health / Health Connect** import (sleep, HRV) to pre-fill check-in — only ever as a suggestion the user confirms.
- **Home-screen widget**: today's capacity state + one-tap check-in.
- **Exercise library growth**: more content per category, possibly premium packs.
- **Wearable-aware nudges**: skip nudges after a detected poor night.
- **Web companion** (Expo web already runs): read-only Journey view.

## Guardrails (apply to every phase)

1. **Anti-guilt is the product.** No streaks, no shame, no red badges, no "you missed X".
   Rhythm > streaks; recovery is celebrated; rest is never punished.
2. **The composer stays pure.** New signals enter as arguments; I/O stays in stores/services.
   Bump `ENGINE_VERSION` on any composition change; test via `composer.test.ts`.
3. **Explicit color contract.** Every interactive state gets an explicit color; `sageDark`
   for accessible actives. No conditionally-undefined styles.
4. **Schema changes touch three places:** `supabase/schema.sql`, `src/types/index.ts`, `DATABASE.md`.
5. **Verify with** `npm run typecheck` **and** `npm test` — there is no lint or build step.
