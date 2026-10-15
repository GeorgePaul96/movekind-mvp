# MoveKind Roadmap

> Where the product goes from here. Phases are sequential by default but items inside a
> phase are independent. Every item must pass the anti-guilt filter (see Guardrails).
> Status: written 2026-07-04, immediately after Phase 3A shipped.

## Where we are

**Done (Phases 1–3A):**
- Core adaptive loop: check-in → capacity state → composed session → guided player →
  post-rating → server-side per-exercise stats (`ENGINE_VERSION v3.0`).
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

## Phase 3B — Hardening & Trust ✅ *(complete 2026-07-04)*

**Theme: the calm has to survive bad networks, screen readers, and our own bugs.**
An anti-guilt app that crashes mid-session or is unusable with VoiceOver breaks its
own promise. This landed before any Phase 4 feature work.

| Item | Status | Notes |
|---|---|---|
| Accessibility pass | ✅ done (2026-07-04) | Labels/roles/states across the core loop (CheckInFlow, Slider as adjustable w/ increment/decrement, SessionPlayer, SessionComplete, Button) **and all six screens** (Home, Journey, Profile, Onboarding, SignIn, SignUp): `Header` title is a shared header role; inputs labeled; onboarding cards are radio/checkbox with checked state; the Journey distribution bars read as one summary each; decorative emoji hidden. Touch-target/contrast spot-audit deferred to a design pass. |
| Reduced motion | ✅ done (2026-07-04) | Toast respects `useReducedMotion`; Onboarding fades are Reanimated entering/exiting, which the OS setting disables automatically. |
| Resilience layer | ✅ done (2026-07-04) | App-level `ErrorBoundary` with calm fallback (`ERROR_FALLBACK`); `src/services/network.ts` classifies offline errors + calm copy; `src/services/outbox.ts` queues post-ratings to AsyncStorage and replays on launch (`syncPendingRatings` in App.tsx); `completeSession` finishes optimistically when offline; check-in/safe-harbor/complete set friendly error messages. **Note:** offline *check-in* queueing (composing a session offline) is deferred — it needs the exercise library cached + client-side session creation; tracked as a Phase 4/later item. |
| Store & flow tests | ✅ done (2026-07-04) | `mapEnergyToState`, store guards, network classifier, outbox (enqueue/dedupe/sync/keep-on-offline/drop-on-permanent), full check-in → session → rating flow with a stateful Supabase mock, and settingsStore hydrate/persist. 67 tests / 12 suites green. |
| Debt cleanup | ✅ done (2026-07-04) | `fetchBehavioralProfile` moved to `src/services/behavioralProfile.ts`; stale branch deleted; main pushed. |

**Exit criteria:** ✅ core loop usable with a screen reader; ✅ offline rating survives and
syncs on next launch (airplane-mode *check-in* queueing deferred — see note); ✅ error
boundary catches a thrown render; ✅ store tests green.

**Known follow-ups carried forward:** touch-target/contrast audit (design pass);
offline check-in composition; proactive network detection (`expo-network`) if reactive
failure-handling proves insufficient in the field.

## Phase 4 — Deeper Personalization *(in progress)*

**Theme: the behavioral profile should change what the composer does, not just what the Journey screen says.**

| Item | Status | Notes |
|---|---|---|
| Composer v3 | ✅ done (2026-07-04) | `composeSession` takes an optional `profile`; `reEntryModeFor()` derives gentle / normal / energized from `recovery.reEntryReadiness`, `recovery.signal` (collapse/spiral/burnout_risk), a ≥14-day gap, or wavering follow-through (<50% completion). Gentle scales durations ×0.7 and drops the longest high-intensity block (never below 2); energized lengthens high-intensity blocks ×1.15. Pure — profile is an argument. Wired into `sessionStore.checkIn` (fetched via `fetchBehavioralProfile`, null-safe/offline-safe). `ENGINE_VERSION` bumped to `v3.0`. 8 new TDD tests. Post-rating affinity was already handled via `userStats` weighting. |
| Voice & cue quality | ✅ done (2026-07-04) | `src/domain/sessions/voice.ts` `speechParamsForState()` — slower/softer rate + fewer spoken cues for overloaded/recovering (cues stay fully visible on screen); wired into `SessionPlayer`. Pure + tested. |
| Intention at check-in | ✅ done (2026-07-12) | Optional one-line intention (`INTENTION` copy) captured in `CheckInFlow`, persisted via `checkIn(energy, sleep, intention?)` to a new nullable `check_ins.intention` column, and reflected back on the `SessionComplete` screen. Schema + `CheckIn` type + `DATABASE.md` kept in sync; `schema.sql` includes an idempotent `add column if not exists` so the pending Supabase rebuild picks it up automatically. Composition is unaffected (intention is reflective, not compositional). 2 new store tests. |
| Session player feel | ⬜ deferred | Smoother block transitions and cue pacing using Reanimated/Gesture Handler patterns from the Software Mansion skill; honor reduced-motion from 3B. Deferred: needs a device/simulator to tune feel. |

**Exit criteria:** ✅ two users with identical energy scores but different histories get
visibly different sessions (covered by `composer.test.ts` "exit criterion" test);
✅ composer tests cover every new signal. Only **session player feel** remains in Phase 4
(carried forward — needs a device/simulator to tune).

## Phase 5 — Sustainability (monetization + measurement) *(in progress)*

**Theme: revenue and analytics, without ever importing guilt mechanics.**

**Premium tier decided (2026-07-04):** premium gates **extended insights & history** and
**additional exercise packs**. The core check-in → session loop, all recovery features, and
voice/cue quality stay free — permanently. Encoded in `src/domain/premium/entitlements.ts`.

| Item | Status | Notes |
|---|---|---|
| Define premium | ✅ done (2026-07-04) | `src/domain/premium/entitlements.ts` (pure, tested): `PREMIUM_FEATURES` = `extended_insights` + `exercise_packs`; `hasAccess()`, `visibleExercises()` (free users skip `is_premium` exercises), `insightsWindowDays()` (free = 30d, premium = ∞). `Exercise.is_premium?` added to the type. |
| Wire gates | ✅ done (2026-07-04) | `checkIn` composes only from `visibleExercises(...)`; JourneyScreen gates the Rhythm-Over-Time / Return-Rhythm trend cards behind premium (free users see a calm "Your Full Journey" unlock card; recovery + distribution stay free). |
| Paywall UX | ✅ done (2026-07-04) | Session-scoped one-tap dismissal: `dismissPaywall()` + `paywallDismissedThisSession` in the store; `checkIn` never re-pops the paywall after dismissal (gate still holds), resets on app launch. Copy rewritten to the real tier (removed the incorrect "text-to-speech" pitch — voice is free); a11y roles added. |
| Activate PostHog | 🟡 contract shipped (2026-07-04) | Privacy-first contract enforced in code: `src/services/telemetryPrivacy.ts` `sanitizeProperties()` strips body-data (energy/sleep/rating/notes) + PII from every event; `identify()` is anonymous (no email/name). **Remaining:** set `EXPO_PUBLIC_POSTHOG_API_KEY` to actually emit; feature flags for composer experiments. Needs the key + authorized PostHog connector. |
| Wire purchases | ⬜ deferred | `startCheckout` still a stub; Paywall keeps the beta self-upgrade (sets the local `profile.is_premium`). **Since local-first (2026-10-15):** use App Store / Google Play billing (e.g. RevenueCat) — purchase/restore → `profileStore.setPremium(true)`; no server or Stripe webhook needed. See [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md). |

**Exit criteria:** ✅ a real purchase completes in test mode — *deferred with Stripe wiring*;
🟡 telemetry funnels — contract ready, needs the API key to emit; ✅ premium gating works
end-to-end today via `profiles.is_premium` (entitlements + paywall dismissal tested).

**Exit criteria:** a real purchase completes in test mode; telemetry dashboard shows
session completion and return-rhythm funnels; flags can gate composer v3 variants.

## Redesign — Clarity & Return *(in progress, prioritized ahead of store launch)*

**Why:** friend testing (2026-10-02) — buttons not visible, confusing, washed-out colors, and
"no pressure" had become "no reason to come back". Launch marketing (Product Hunt / X /
Instagram) didn't land. Five sub-projects, built in order:

| # | Sub-project | Status | Notes |
|---|---|---|---|
| 1 | Visual clarity + one-tap check-in | ✅ built (2026-10-03, branch `redesign/visual-clarity`) | Sunrise palette (contrast-tested), 3-variant Button + MoodTile/Chip/WeekCard, all hand-rolled buttons and legacy color aliases removed, jargon purged, min font 13. `logCheckIn` (never paywalls) split from `startTodaysSession`; 4-state Home; this-week-vs-last card; (the `check_ins_update_own` policy it added became moot with local-first). Paywall price now $4.99 and no fake "trial". 159 tests. Spec: [docs/superpowers/specs/2026-10-03-visual-clarity-one-tap-checkin-design.md](docs/superpowers/specs/2026-10-03-visual-clarity-one-tap-checkin-design.md). Follow-ups: real exercise illustrations (player shows a mood panel for now); offline check-in queue; re-test with the same friends. |
| 2 | Reason to return | ⬜ | Finch-style "something of yours that grows when you show up". Rest days count. |
| 3 | Weekly analytics | ⬜ | This-week-vs-last beyond the week card. |
| 4 | Honest custom workouts | ⬜ | Show the composer's reasoning per exercise ("picked because…"). |
| 5 | Light social | ⬜ | Points / small circles. Needs friends + invites backend. |
| — | **Local-first architecture** | ✅ built (2026-10-15) | Supabase removed (project paused; no free slots). All data on the device via `src/services/db` (AsyncStorage, serialized writes); exercise library bundled with stable ids; stats trigger ported to pure `applyRating`; **no accounts** (onboarding asks a name; Profile has "Erase all my data"). Benchmark rationale: Bend / Down Dog / Finch need no server for the core loop. Spec: [docs/superpowers/specs/2026-10-15-local-first-design.md](docs/superpowers/specs/2026-10-15-local-first-design.md). Follow-ups: "Export my data"; a small optional server only when circles (5) are built. |
| — | **Source-verified exercises + safety layer** | ✅ built (2026-10-16) | Every shown exercise cites NHS / NHS inform / Mayo Clinic / Cleveland Clinic / ACE in our own words; 14 unsourced or risky moves replaced (box breathing → NHS slow breathing, doorframe rows, scorpion, downward dog…); 3 with no source **hidden** until a physio approves. Player shows + speaks each source's cautions, the NHS inform pain guide and a source link; one-time "Before you move" notice. Review: [docs/exercise-source-review.md](docs/exercise-source-review.md). **Next:** chartered physiotherapist review (hidden items + block lengths) before claiming "verified". |
| — | Pricing | 🟢 **free until launch** (2026-10-16) | **Entirely free for now** — `PRO_PLAN_LIVE = false` in `entitlements.ts` removes the paywall and every lock; introduce Pro only once downloads justify it, and then gate only NEW things (never take back what people had free). When live: Pro $4.99/mo (~$29.99/yr). "Rough month? It's on us" honor-system free month. Consistency rewards are in-app, never cash. Rejected: "6 workouts/week → free month" (charges people for resting; inverted revenue; Pact/GymPact precedent). |

**Benchmark & order (decided 2026-10-14):** primary benchmark is **Bend** (short daily guided
routine for non-gym people); retention model is **Finch**; adaptive-session proof is **Down Dog**;
Hevy only for its growth playbook (organic, product-first, social feed from the activity itself).
Order: ✅ local-first → **exercise visuals** (biggest gap vs Bend) → reason to return (Finch-style,
with a home-screen widget) → store listing + launch → circles.

## Phase 6 — Ship & Scale *(in progress)*

**Theme: get it into strangers' hands.**

| Item | Status | Notes |
|---|---|---|
| EAS pipeline | 🟡 config done (2026-09-30) | `eas.json` with four profiles — `development` (dev-client, internal, Android APK), `development-simulator` (iOS sim), `preview` (internal release), `production` (store, `autoIncrement`, AAB). `appVersionSource: "remote"` so EAS owns build numbers. `expo-dev-client` + `expo-updates` installed; `app.json` gained `scheme: "movekind"`, `runtimeVersion` (appVersion policy), `primaryColor`, and `ITSAppUsesNonExemptEncryption: false` (skips the export-compliance prompt on every submit). Store credentials gitignored. npm scripts: `build:dev:android`, `build:preview`, `build:prod`, `submit:prod`, `ota`. **Remaining (needs accounts, not code):** `eas init` to create the project + inject `extra.eas.projectId`; (no backend env vars are needed since local-first — only the optional PostHog key via `eas env:create`); fill the three `REPLACE_WITH_*` placeholders in `eas.json` `submit.production.ios`. |
| OTA updates | 🟡 ready, not wired | `expo-updates` installed and `runtimeVersion` set; channels declared per build profile (development/preview/production). Needs `eas update:configure` (after `eas init`) to add `updates.url` — that requires the project ID. |
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

1. **Anti-guilt is the product — bent carefully, not dropped (2026-10-03).** No shame, no
   red badges, no "you missed X". Points and gentle consistency signals are allowed, but
   rest counts, missing a day never resets progress, money is never tied to performance,
   and comparison is only to yourself or a small circle — never a public ranking.
2. **The composer stays pure.** New signals enter as arguments; I/O stays in stores/services.
   Bump `ENGINE_VERSION` on any composition change; test via `composer.test.ts`.
3. **Explicit color contract.** Every interactive state gets an explicit color from the Sunrise
   tokens; contrast is enforced by `__tests__/colors.test.ts`. No conditionally-undefined styles.
4. **Data-model changes touch three places:** `src/services/db/`, `src/types/index.ts`, `DATABASE.md`.
5. **Verify with** `npm run typecheck` **and** `npm test` — there is no lint or build step.
6. **Local-first.** User data never leaves the phone. Anything that needs a server (circles) is
   additive and optional — the core loop must keep working with no network and no account.
