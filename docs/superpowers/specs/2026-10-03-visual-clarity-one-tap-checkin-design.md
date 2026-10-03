# Visual Clarity & One-Tap Check-In — Design

> Redesign sub-project 1 of 5 (see ROADMAP.md "Redesign"). Status: approved 2026-10-03.
> Approach A: restyle in place on the existing semantic-token system.

## Why

Friend testing (2026-10-02): buttons not visible, interface confusing, colors blank, and
no reason to come back. Root causes found in code:

- `ghost` buttons have no fill or border (read as plain text); `sage-soft` is `#E7F1EA` on a
  `#EEF2EC` canvas (~1:1). 17 hand-rolled `Pressable` buttons bypass `Button`.
- Jargon ("Daily attunement", "nervous system capacity", "Safe Harbor"); key text at 12px.
- Check-in is a slider + sleep + intention form; after a session Home is a dead end.

## Product decisions

- **Core 5-second action = one-tap check-in.** Tapping a mood tile *is* the check-in. A
  session is offered afterwards, never forced. Logging alone counts.
- **Palette = "Sunrise"**: warm cream canvas, four clear mood colors, deep-green actions.
- **Anti-guilt guardrail bent carefully** (applies to later sub-projects, recorded here):
  rest counts; missing a day never resets progress; compare to self or a small circle only.

## Out of scope (later sub-projects)

2 reason-to-return (Finch-style) · 3 full analytics (only the week card ships here) ·
4 explain *why* each exercise was picked · 5 points / social. Offline check-in queueing
stays deferred (Phase 3B follow-up). Pricing ("Rough month? It's on us", $4.99) is its own
project, blocked on Stripe.

## 1. Tokens — `src/constants/colors.ts`

Semantic names unchanged; values change. All text pairs verified ≥4.5:1, all non-text
UI/graph pairs ≥3:1 (lowest text pair: success on background 4.95).

| Token | Value | Token | Value |
|---|---|---|---|
| background | `#FFF8EE` | primary | `#245C43` |
| surface | `#FFFFFF` | primaryPressed | `#1B4A35` |
| surfaceSecondary | `#F7EFE2` | primarySoft | `#E3F0E8` |
| textPrimary | `#2B2A26` | secondary | `#E3F0E8` |
| textSecondary | `#5A5548` | secondaryText | `#245C43` |
| textMuted | `#6B6453` | onPrimary | `#FFFFFF` |
| border | `#CDBFA6` (decorative only) | divider | `#EFE6D6` |
| success | `#2F7A52` | warning | `#8A5A12` |
| error | `#A8443A` | info | `#2F6596` |
| shadow | `#3A2F1E` | | |

`stateColors[state]` gains `ink`; meanings: `soft` = tile/surface fill, `ink` = text and
border on `soft`, `accent` = fill bearing white text, `tint` = bars/slider (≥3:1 on white).

| state | soft | ink | accent | tint |
|---|---|---|---|---|
| overloaded | `#DCEBFA` | `#1F4E7A` | `#3C6E9C` | `#5F8FC0` |
| recovering | `#D6EFDF` | `#1F5C3A` | `#2F7A52` | `#5A9C74` |
| regulated | `#FBE7B8` | `#6B4A0E` | `#8A5A12` | `#B8862A` |
| activated | `#FAD5C8` | `#8A3220` | `#A8443A` | `#D06A50` |

Legacy aliases (`bg`, `ink`, `sage`, …) are re-pointed at the new values so nothing breaks;
touched files migrate to semantic names. App splash/adaptive-icon background → `#FFF8EE`.

**Regression guard:** `__tests__/colors.test.ts` asserts every listed pair's WCAG ratio.

## 2. Components

- **`Button`** — variants `primary` (solid primary, white text), `secondary` (surface fill,
  2px `primary` border, `primary` text), `link` (no fill, underlined `primary` text, min
  44pt touch height). `ghost` → `link`, `sage-soft` → `secondary`. Optional `size="sm"`.
  Label ≥15px.
- **`MoodTile`** (new) — emoji + label, `soft` fill, 1.5px `ink` border, `ink` text; selected
  = 3px border; `accessibilityRole="button"`, label = mood name.
- **`Chip`** (new) — small selectable option (sleep). `accessibilityState.selected`.
- **`WeekCard`** (new) — "This week vs last": check-in days and minutes moved with ↑/↓/=,
  and a Mon–Sun bar row colored by that day's mood `tint`. Empty → "Your week will appear here".
- The 17 hand-rolled button `Pressable`s in CheckInFlow, SessionOverview, SessionPlayer,
  SessionComplete, Paywall, Onboarding move to `Button` / `Chip` / `MoodTile`.
- Minimum body text 14px; captions 13px.

## 3. Copy — `src/constants/copy.ts`

Moods: `overloaded` "Running on empty" 😮‍💨 · `recovering` "A bit low" 🌱 · `regulated`
"Steady" 🙂 · `activated` "Buzzing" ⚡. Prompt "How's your energy{, name}?". Logged:
"Logged ✓" + per-mood reassurance (e.g. "Running on empty. That's okay."). Safe Harbor →
"Too wiped to choose? Start a gentle reset" (no minute count — the composer decides the
length, and copy must never promise what the session won't do). The Logged card likewise
describes the session's feel per mood, never an invented duration. Remove "attunement", "capacity rating",
"nervous system capacity". All new user-facing strings live in `copy.ts`.

## 4. Domain (pure, tested)

- `src/domain/checkin/moods.ts` — `MOODS` (ordered), `moodToEnergy`: overloaded 1,
  recovering 2, regulated 4, activated 5. Round-trips through `mapEnergyToState`, which
  moves here from the store (domain must not import the store; the store re-exports it). **Composer untouched → no `ENGINE_VERSION` bump.**
- `src/domain/insights/weekCompare.ts` — `compareWeeks(checkIns, sessions, now)` →
  `{ thisWeek: {days, minutes}, lastWeek: {days, minutes}, daily: (UserState|null)[7] }`.
  Weeks are Monday–Sunday in local time; a day counts once; the day's mood is the latest
  check-in that day; minutes = sum of `actual_duration` (seconds) over blocks of sessions with status
  `completed`, bucketed by session `created_at`, rounded to whole minutes per week.

## 5. Store — `src/store/sessionStore.ts`

`checkIn(energy, sleep, intention)` splits:

- `logCheckIn(mood)` — insert `check_ins` (energy from mood, sleep/intention null, engine
  version). Sets `currentCheckIn`, `homeStep: 'logged'`. **Never touches the paywall.**
  On failure: throw → UI keeps tile selected and shows retry copy.
- `updateCheckIn(patch)` — `{sleep_quality?, intention?, energy_score?}` on today's
  `currentCheckIn.id` only. "Change today's check-in" re-shows the tiles; tapping one when a
  check-in already exists today calls `updateCheckIn({energy_score})` instead of inserting.
  It does not touch any existing session (YAGNI).
- `startTodaysSession()` — the existing body after the insert: premium/free-limit check
  (paywall), entitled exercises, recency, profile, compose, insert session + blocks. Uses
  `currentCheckIn.energy_score`.
- `dismissForToday()` — `homeStep: 'done'` (in-memory; on relaunch an existing check-in with
  no active session shows the week view).
- `loadWeek()` — fetch last 14 days of check-ins + completed sessions/blocks → `weekCompare`.

Home render order: active session (overview/player/complete) → no check-in today → mood
tiles → `homeStep === 'logged'` → Logged screen → else week view.

## 6. Database

`check_ins` gets `check_ins_update_own` (`for update using/with check auth.uid() = user_id`),
added idempotently to `supabase/schema.sql`; `DATABASE.md` + `API_MAP.md` updated; no type
change needed (`sleep_quality` and `intention` are already nullable).

## 7. Errors

Check-in save fails → tile stays selected, "Couldn't save that — tap to try again".
Sleep/note/mood update fails → inline retry, never blocks. Week load fails → empty-state
card. Session start keeps existing friendly error handling.

## 8. Testing

New: `colors.test.ts` (contrast), `moods.test.ts`, `weekCompare.test.ts` (Mon–Sun bounds,
day counted once, latest mood wins, empty last week, sessions without completion ignored),
store tests (log never opens paywall; start does; update scoped to today's id; failure keeps
state), `HomeScreen` state test (4 states), `Button` variants. Existing 92 tests stay green;
tests referencing removed `checkIn` signature are migrated, not deleted.
