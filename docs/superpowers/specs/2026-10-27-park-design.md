# MoveKind Park: design

Date: 2026-10-27 · Status: approved · Replaces the garden card on the home screen.

## Intent and why

The owner tested the green redesign and found the features good but missing a "wow" factor. The
garden lives inside a card on a busy screen. MoveKind's selling point is the garden, so the garden
becomes the app: **a wide, serene, full-screen park you pan across with a gentle swipe**, where every
object is also the way you log. Tending the park replaces filling in forms, so logging never feels
like a chore, and the park is calm enough that people come back just to visit.

Reference art: `design/park/gemini-park-times-of-day.jpg` (Gemini; four times of day) and the owner's
chosen frame (a wide landscape: tree on the left hill, a river winding through the middle, two slim
trees with a hammock on the right, a path, a small cream rabbit). Sheets and drawer: Stitch screens in
`design/park/stitch_movekind_habit_tracker_ui*` (git-ignored, local reference).

## Goals

- The home screen is a full-screen, portrait park that is about 2.2 screens wide and pans
  horizontally with a gentle swipe, with parallax depth (sky slowest, foreground fastest).
- Style matches the Gemini art: flat shapes, no outlines, soft vertical gradients, drifting mist
  between hill layers, sage palette, Alto's Odyssey serenity.
- Every caring action is an object in the park; tapping it opens a small sheet:
  - **River** → water
  - **Tree** (left hill) → workouts
  - **Flowerbed** → mood (the four mood tiles move here, plus "Feeling unwell today")
  - **Hammock** between two slim trees → sleep (new)
  - **Grass and path** → steps (automatic; tapping shows the week)
- A **pull-up drawer** from the bottom edge: collapsed it shows today at a glance; open it has
  plain rows with log buttons (backup and screen-reader path), the gentle note, "This week" changes,
  the mood flowerbed, and Me/settings.
- **Sleep** (new data): how it felt (Rested / Okay / Restless) plus rough hours (5, 6, 7, 8, 9+).
  Logged by tap now; filled in from Health Connect / Apple Health later when the phone already knows.
- **A rabbit** lives in the park: hops along the path, nibbles the grass you grew, is more playful on
  days with care logged, and sleepier after a restless night. Never sad, hungry or sick.
- **Ambient sound** (stream, birds, wind, rain), off by default, switched on from the park.
- **Discovery**: a short first-visit tour (auto-pan across the park, one line per object), then a
  soft shimmer on objects not yet tended today.
- Everything the current garden already does stays true: water widens the river and brings ducks,
  steps grow the grass, workouts grow the tree through its stages, moods plant flowers, rain on
  unwell days, dawn / day / dusk / night skies, resting under the moon after 3 quiet days.

## Non-goals (this project)

- Mind games (later, once the park is right).
- Landscape orientation (the app stays portrait; the park pans instead).
- Typing anything (no notes, no dream journal) and any new permission at launch.
- Automatic sleep from health stores (a later stage with the development build).

## Anti-goals (failure even if it works)

- Anything in the park that looks neglected, decays, dries, wilts, dies, gets hungry or sad,
  including the rabbit.
- Targets in disguise: "4 of 6 glasses", empty slots waiting to be filled, streaks, scores.
- Logging that takes more than two taps for the common case.
- A park that stutters: it must stay smooth on the owner's OnePlus 12 and on a mid-range Android.
- Losing accessibility: every object reachable and labelled for screen readers; Reduce Motion
  stops panning drift, parallax easing and creature motion.

## Decided by the owner

| Topic | Decision |
|---|---|
| Feel | Serene landscape (Alto's Odyssey) |
| Orientation | Portrait, wide park panned by gentle swipe |
| Art | AI concept art, rebuilt in code |
| Home layout | Full-screen park + pull-up drawer |
| Tap on object | Always opens a small sheet (no accidental logs) |
| Text on park | Almost none (a soft greeting that fades) |
| Sound | Ambient, off by default |
| Sleep spot | Hammock between trees |
| Sleep sheet | Feeling + rough hours |
| Restless night | The rabbit is sleepier that day |
| Creature | A rabbit, now; mirrors care gently |
| Discovery | First-visit tour, then shimmer |
| Changes | In the drawer |
| Drawer | Also has plain log buttons |
| Old UI | Mood tiles to the flowerbed sheet; note into the drawer; badges become the scene |
| Games | Later |
| Shipping | In stages, owner tests each |

## Stages

1. **Park and drawer.** Full-screen panning park with parallax and mist; river, tree, flowerbed and
   grass/path tappable with their sheets (water, workout, mood + unwell, steps week); the drawer;
   first-visit tour and shimmer. The old garden card and home layout are retired.
2. **Sleep and the hammock.** Sleep data, the hammock sheet, the hammock in the scene (a blanket
   and a cushion appear after a logged rest).
3. **The rabbit.** Idle hop, nibble, nap; reacts to taps and to the day's care and sleep.
4. **Sound.** Ambient loops with an on/off control, respecting the phone's silent mode.

## Constraints

- Expo SDK 58, still testable in Expo Go (no new native modules unless already in Expo Go).
- Existing pure garden logic stays the single source of what the park shows (`gardenState`).
- All colour from tokens; contrast rules for any text on sheets; no em dashes in copy.
- Local-first: sleep stored in the on-device db like other logs; never sent to telemetry.

## Calls made by Claude (owner to check)

- **No tab bar.** The owner chose "park plus a pull-up drawer" over keeping tabs, so Changes and
  Me (name, reminder, data, erase) both live in the drawer.
- **Water sheet:** a drop appears for each glass with no fixed row of empty slots (Stitch showed 6,
  which reads as a target); +1 glass, -1 glass, and a line that tea and other drinks count too.
  No "half cup" (keeps one simple unit).
- **Sleep belongs to the morning you wake:** logging it today describes last night, and today's
  rabbit reflects it. One sleep entry per day, re-logging edits it (like moods).
- **No dream or thought note** on the sleep sheet (typing is a chore; can be added later).
- **The steps row in the drawer** shows the count or "Arrive soon"; there is no "Add walk" button,
  since steps come from the phone.
- **Heading font stays Plus Jakarta Sans** (Stitch's park screen used a serif).

## Left to the builder

Rendering technology for the park (react-native-svg vs react-native-skia, both available in Expo
Go), exact panorama width and parallax speeds, the composition of each object across the panorama,
shimmer and tour details, sheet layouts following the Stitch screens, the rabbit's animation set,
sound sources (licensed for free commercial use) and data model shape for sleep.
