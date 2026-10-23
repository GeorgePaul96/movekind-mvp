# MoveKind Garden: design

Date: 2026-10-23 · Status: approved · Replaces the guided-session product.

## Intent and why

MoveKind stops telling people how to move. Hundreds of apps already do that, and guided
exercise carried the most risk (people getting hurt) and the most work (source-verifying
every exercise). Instead MoveKind becomes **one calm place to record the everyday care people
already spread across several apps (water, steps, workouts, mood) and to see that care
turn into something living: a garden that grows because of them.**

The feeling we want after a week: *"it's thriving because of me."* Happier, more energetic,
visibly growing. The no-guilt promise stays absolute: the garden only ever grows or rests,
it never wilts, dries, dies or scolds.

## Goals

- A garden home screen that visibly responds to four inputs, each owning one part of it.
- Logging that takes one or two taps.
- A Changes tab that tells people, in plain sentences, what their activity is changing.
- Built in two stages (owner's decision, option B):
  1. **Stage 1, Expo Go:** everything except steps. The owner tests all features and UI.
  2. **Stage 2, development build, before testers get it:** real steps on both platforms
     (Health Connect on Android, the iOS step counter / Apple Health on iPhone), so
     Android users never get a worse experience.
- Validate the idea: **testers come back daily for a week without reminders.**

## Non-goals (this release)

- Exercise instructions, guided sessions, the recorded voice, the exercise library.
- Camera heart rate (second release; needs a development build).
- Apple Health / Health Connect beyond steps (second release). Steps come in stage 2 of this release.
- The creature/companion (after validation; the owner will design it, likely in Rive).
- Calorie counting, body composition, weight, BMI.
- Accounts, a backend, a paywall or Pro plan.

## Anti-goals (a failure even if it works)

- Anything that goes backwards visibly: drying, browning, wilting, dying, red, "you missed".
- Targets, streak counters, scores, comparisons with other people.
- Any mood showing as worse than another (every mood flower is equally beautiful).
- Judging bodies in any way.
- Health data leaving the phone (analytics stay anonymous counts only).

## The garden

Drawn in code (react-native-svg, already installed). No illustrator, no image assets.
Animation is gentle and respects the phone's reduce-motion setting
(`src/hooks/useReduceMotion` pattern from the figures branch).

| Part | Fed by | Behaviour |
|---|---|---|
| **Stream** | water (one tap = one glass) | Each morning starts as a gentle trickle, **never dry**. Gets fuller and livelier with each glass that day; ducks or fish appear around the 3rd–4th glass. |
| **Grass** | steps (stage 2: Health Connect / iOS step counter; until then the grass holds a calm default) | Longer and greener with the day's steps. Resets each morning; on quiet days it is short, never brown. |
| **Tree** | logged workouts | Grows slowly over weeks from cumulative workouts: sprout → sapling → tree → birds → blossom → fruit → a second tree. **Never shrinks.** |
| **Flowers** | daily mood check-in | One flower per check-in, coloured by the mood picked. All moods equally pretty. The flowerbed slowly becomes a picture of the month. |
| **Whole garden** | being away | Dozes in soft evening light; wakes when the user returns. Nothing is lost. |

Builder's call: exact growth curves and thresholds, as long as they are monotonic for the
tree, daily-reset for stream and grass, and a first visible change happens on the very
first tap of each input.

## Screens

**Home (Garden)**, layout A, chosen by the owner:
- Short greeting with the user's name.
- The garden fills most of the screen.
- One plain note under it about what's changing (own numbers only, never scolding).
- Three big buttons: **Water** (one tap adds a glass, today's count shown),
  **Workout** (opens the log sheet), **Steps** (today's count; tap for the week. In stage 1
  it shows a calm "steps arrive soon" state).
- The mood check-in is kept and moves onto this screen: a once-a-day prompt with the
  existing four mood tiles (`MoodTile`, `MOOD_COPY`). Builder decides exact placement.
- Bottom tabs: **Garden · Changes · Me**.

**Workout log sheet**: two taps. Type chips (Walk, Run, Yoga, Gym, Cycle, Sport, Dance,
Other) and rough duration chips (10, 20, 30, 45 min, 1 hr+), then "Add to my garden".
Editable/deletable afterwards from the day's list.

**Changes**:
- This week vs last week in plain sentences ("You walked about 2,000 more steps a day").
- The tree a month ago beside the tree today.
- The mood flowerbed laid out by week.
- No targets, streaks or scores.

**Me**: name, the optional daily reminder (off by default), and data/settings that exist today.

Mockups: `.superpowers/brainstorm/515-1792746702/content/garden-home.html` (local only).

## What happens to today's MoveKind

**Kept:** the name, the Sunrise palette and colour rules, `Button`/`Chip`/`MoodTile`, the
one-tap mood check-in, local-first storage via `src/services/db` (no accounts), onboarding's
name step, privacy-first telemetry, the daily reminder (now off by default), the a11y and
contrast rules, the no-em-dash rule.

**Removed:** guided sessions (composer, session player, overview, completion, ratings,
`applyRating`, `user_exercise_stats`), the recorded voice and its clips, the exercise library
and source-review doc, the "Before you move" safety notice, the paywall and Pro gating,
the Journey screen (replaced by Changes). `ENGINE_VERSION` is no longer meaningful.

**Data:** testers only, all on-device. Keep profile and check-ins; drop session tables.

## Validation

- 15–20 testers, one week, daily reminder **off**.
- Success: most testers open the app on **at least 5 of 7 days**.
- Measured with the existing privacy-first PostHog telemetry (needs the owner's free
  PostHog key): anonymous "app opened" with day number, and which input was used. Never
  values (no step counts, glasses, moods).

## Constraints

- Expo SDK 57. Stage 1 runs in **Expo Go** with no new native modules; stage 2 adds a development build for steps only.
- All copy in `src/constants/copy.ts`; all colour from `src/constants/colors.ts` tokens;
  new colour pairs added to the contrast test.
- Minimum font 13, 44pt touch targets, screen-reader labels (the garden gets a spoken
  summary like "Your stream is lively, grass is tall, the tree has fruit").

## Second release (for context, not this build)

Built on the stage-2 development build: camera heart rate (finger on camera, FFT of brightness,
morning resting reading + optional after-workout recovery reading, framed as a wellness
estimate), and more from Apple Health / Health Connect (automatic workouts and body
composition from scales/watches people already own).

## Left to the builder

Growth curves, animation details, exact copy (within the rules above), data model shape for
water/steps/workouts, how the garden state is derived (pure functions in `src/domain/`,
unit-tested, like the composer was), test plan.
