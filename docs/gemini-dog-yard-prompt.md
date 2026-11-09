# Prompt for Gemini: replace the MoveKind park with Maple's yard

Copy everything below the line into Gemini. Attach with it:
- `docs/gemini-dog-yard-bundle.md` (the current source files in one file)
- `prototypes/dog-yard/index.html` (our clickable prototype: the behaviour to build)
- `prototypes/dog-yard/reference.html` (a richer web mock: the art and motion ideas to borrow)
- `docs/dog-yard-critique.md` (what is wrong with that mock; do not repeat those mistakes)
- 2 screenshots: our prototype on a phone, and the reference on a laptop

---

## Role

You are a senior React Native engineer and character illustrator. You build smooth, 60fps animated
scenes for mid-range Android phones and iPhones, and you draw warm, simple cartoon animals in code.
Replace the home screen of my app, **MoveKind**. Give me complete, drop-in TypeScript files, not snippets.

## The app in one paragraph

MoveKind is a calm, anti-guilt self-care tracker. People log water, food, movement, sleep and a daily mood.
Until now, home was a park that grew from those logs. **We are replacing the park with a back-yard garden
where two dogs live.** Tapping a thing in the yard is how you log. There are no streaks, no targets and no
guilt: the yard only grows or rests.

## The new home in one paragraph

**Maple** is a golden retriever who sits in the middle of the screen. She reflects how you feel. Tap her
**water bowl** and she trots over, laps at it, and a sheet asks how many glasses of water you've had today.
Tap her **ball** and she runs to it and plays, and a sheet asks what you did to move today. Tap the **food
bowl** and she eats. That clink is also the only thing that wakes **Pudding**, her lazy bulldog friend, who
scrambles up and joins her, and a sheet asks whether you've eaten. The rest of the time Pudding sleeps on
his cushion, rolling between belly up and belly down. Tap him and he stays asleep ("Mmmf. Five more
minutes."), and a sheet asks how you slept.

## Tech stack (do not change)

- Expo SDK 58, React Native 0.88, React 19, TypeScript 6 strict.
- `react-native-reanimated` 4.7.1 for all motion, on the UI thread. `react-native-svg` 15.16 for all art.
  `react-native-gesture-handler` 3.3, `react-native-safe-area-context` 5.10.
- No new native dependencies (no Skia, no Lottie, no Rive, no image files). It must work in Expo Go.
- Imports use the `@/` alias for `src/`.

## What to delete

The park and everything that only serves it: `ParkScene`, `ParkWorld`, `ParkLayers`, `ParkTree`,
`Creatures`, `Pip` and `PipArt`, `CrittersArt`, `TreeArt`, `FlowerbedArt`, `HammockArt`, `ParkTour`,
`src/domain/park/*` (layout, shapes, pip, tending) and their tests. List every file you delete at the top of
your answer. **Keep** `Sheet.tsx`, `WaterSheet`, `WorkoutSheet`, `ParkDrawer` (rename it `YardDrawer`;
contents unchanged apart from the rows listed below), `ChangesView`, `MeView`, and everything in `src/services`,
`src/store` and `src/domain/garden`.

## What to build

### Files

```
src/domain/yard/layout.ts      pure: yardLayout(w, h) -> every object's spot and tap rect
src/domain/yard/moods.ts       pure: how each mood poses Maple (ears, eyes, tail speed, extras)
src/domain/yard/script.ts      pure: the step list for each tap (walk to X, do Y, open sheet Z, come home)
src/components/yard/YardScene.tsx        the full-screen scene, one clock for all motion
src/components/yard/Maple.tsx            golden retriever: poses + walk/drink/eat/play/hop
src/components/yard/Pudding.tsx          bulldog: belly-down, belly-up, awake, eat, waddle
src/components/yard/art/*.tsx            static drawing pieces (bowls, ball, cushion, fence, flowers)
src/components/yard/SpeechBubble.tsx     one short line above a dog
src/components/yard/sheets/FoodSheet.tsx
src/components/yard/sheets/SleepSheet.tsx
src/components/yard/sheets/MoodSheet.tsx (rewrite: five moods, see below)
src/screens/main/YardScreen.tsx          replaces ParkScreen
__tests__/yardLayout.test.ts, yardScript.test.ts, yardMoods.test.ts, YardScreen.test.tsx
```

Keep layout, mood poses and the tap scripts **pure** (no React, no I/O, no clock), like `gardenState`, so
they can be tested.

### Layout (portrait first, every phone)

This is where the reference mock fails hardest: it is landscape art set to `slice`, so on a phone the
bowls and the bulldog are cut off. Ours must fit **every** phone from 360 x 640 to 430 x 932, with nothing
off-screen and no scrolling or panning.

- Sky and a soft hill fill the top quarter. A low picket fence crosses the screen at the horizon.
- The yard lawn fills the rest, edge to edge. There must be no gap at any edge or under the bottom safe area.
- **Everything you can tap sits in a band from about 30% to 58% of the screen height**, so it stays visible
  above a bottom sheet (sheets cover the lower ~42%):
  - Maple, sitting dead centre, about 32% of the screen width tall. She is the hero.
  - The ball, front left of her.
  - Pudding's cushion, back right, under a small tree.
  - The water bowl, lower left. The food bowl, lower right.
- Below that band: a stepping-stone path, a few flowers and the drawer peek. Nothing tappable.
- Every tap target is at least 48 x 48 pt.
- Use our prototype's arrangement (attached) as the starting point.

### Maple (golden retriever)

- **Draw her in side view**, like the reference mock's Sunny, not front-facing like our prototype. Give her
  four legs with a trot cycle when walking, and flip her horizontally to face the way she walks. Sitting
  pose at home, three-quarter turned towards us, so we see both eyes.
- Golden coat with two-tone shading, a cream chest ruff, floppy ears, a dark nose and a deep-green collar
  (`colors.primary`) with a small gold tag. Same outline rule as everything else (see Art style).
- **Moods.** She mirrors the mood picked today. With no mood picked she is neutral (calm, slow wag). Never
  assume a mood.

  | Mood | Maple |
  |---|---|
  | Tired | Lies down with her chin on her paws, half-closed eyelids, slow breathing, tail barely moving |
  | A bit low | Sits with her head lowered, eyes looking down, ears soft, very slow wag |
  | Frustrated | Worried brows, ears back, a small grey scribble cloud above her head that drifts. No lightning, no flashing |
  | Steady | Relaxed sit, soft smile, a gentle wag |
  | Buzzing | Tongue out, little bounces, a fast but not frantic wag (no faster than 0.3 s), a few twinkles |

- **Petting.** Tap Maple and she leans in and one heart floats up. When she's frustrated, each pet makes the
  cloud a little lighter until it fades. Never show a counter or a progress ring.
- **Actions:**
  - Drink: head-dip loop at about 0.7 s, tongue showing, a ripple in the bowl.
  - Eat: head-dip loop, a few crumbs.
  - Play: chases the ball as it bounces to 3 or 4 random spots inside the band, tongue out.
  - Hop: one happy hop after a save.

### Pudding (bulldog)

- Side view, fawn and white, a squashed face, jowls, folded ears, a red collar and **pink toe beans**. He
  should be as lovable as the reference mock's Barnaby. Borrow his poses from it.
- **Asleep (most of the time).** Lies on a plaid cushion, belly down in a frog-legged sploot, with slow
  breathing and Zzz floating up. Every 8 to 14 s he rolls over to belly up, with paws in the air, a little
  dream twitch and his tongue out, and later rolls back. This happens on its own. There is **no button** to
  roll him and the Zzz can't be popped.
- **Food bowl tapped:** the only thing that wakes him. He jolts up, says "Food?!", waddles to the food bowl
  beside Maple and eats. When the sheet closes, he waddles back, circles once, flops down and sleeps.
- **Pudding tapped:** he stays asleep, snores a bit louder and mumbles "Mmmf. Five more minutes.", and the
  Sleep sheet opens.
- While he's up, draw him in front of Maple, so he isn't hidden behind her at the bowl.

### What each tap does

Each tap runs a short script. Only one script at a time; taps during a script are ignored.

1. The dog walks to the spot.
2. The action loops: drink, eat, play, or snore.
3. After about 0.9 s the sheet opens, and the action keeps looping behind it.
4. On save: the sheet closes, the dog does one happy hop, a speech bubble shows one line for about 3 s, a
   new flower blooms in the lawn near that object, and the dog walks home.
5. On close without saving: the sheet closes and the dog walks home. **No line, no sad face.**

The water bowl, ball and food bowl also open their sheets from the drawer rows. When opened that way, run
the same script.

### Sheets

All sheets use our `Sheet`, `Button`, `Chip` and `Icon` components. They start **empty** apart from water.
Save is disabled until something is picked.

- **Water** (`WaterSheet`, keep it). Title "How many glasses of water today?", subtitle "Maple's having one
  too." There is **no goal, no "/ 8", no progress bar and no millilitres.**
- **Movement** (`WorkoutSheet`, keep it). Title "What did you get up to today?", subtitle "Anything counts,
  anywhere you did it."
- **Food** (new). Title "Did you get something to eat?", subtitle "Pick any. Pudding got up for this, which
  is a big deal." Chips: Breakfast, Lunch, Dinner, A snack, multi-select. **Nothing else**: no "how
  nourishing", no light/hearty/treat, no notes, no calories, no portions.
- **Sleep** (new). Title "How did you sleep last night?", subtitle "Pudding is something of an expert."
  An hours stepper in half hours, starting empty (show "Tap + to add"). An optional "How did it feel?" with
  Restless, Okay or Deep. No slider, no presets, no "Deep Coma".
- **Mood** (rewrite). It opens the first time each day, over the yard, before anything else. Title "Hi, I'm
  Maple. How are you feeling right now?" Five `MoodTile`s: **Tired, A bit low, Frustrated, Steady, Buzzing.**
  The tiles describe the person, not the dog. Keep the existing "Feeling unwell today" choice under them,
  which turns on rain. "Not now" picks nothing. The mood chip at top right reopens it.

### Lines (copy)

Every user-facing string goes in `src/constants/copy.ts` as a new `YARD_COPY`.

- **No em dashes.** A test enforces this.
- Lines never name what didn't happen ("you haven't...", "only...", "still...") and never give
  instructions about how to move.
- Mood lines:
  - Tired: "Let's take it slow today."
  - A bit low: "I'll sit right here with you."
  - Frustrated: "Busy head? Me too. No rush."
  - Steady: "Nice. Happy just hanging out."
  - Buzzing: "Ooh! Is it ball time?"
- After a save:
  - Water: "Ahh. That hit the spot."
  - Food (Pudding): "Thanks! That was the good stuff."
  - Movement: "That was fun. Good game!"
  - Sleep (Pudding): "Snrk. Good sleep is good."

### Light, weather and rest

Keep what the app already does: `skyPhase(now)` sets dawn, day, dusk or night from the phone clock, and
`gardenState(...).weather === 'rain'` (unwell today) brings soft rain and grey sky. In rain Maple sits
under the tree and Pudding sleeps on. `resting` (3 quiet days) shows the night sky with both dogs asleep,
and nothing is lost. No manual weather toggle and no sound.

### The yard grows

- A flower blooms for each thing logged today, near the object it came from, and clears the next morning.
  There is no count anywhere.
- The small tree behind Pudding grows through `gardenState().tree` stages (all-time movement minutes) and
  never shrinks.

### Top of the screen

Only two things: a greeting on the left ("Good afternoon" plus "Maple's yard", fading after 4 s like today)
and the mood chip on the right. There's no stats HUD on the scene. Today's numbers live in the drawer.

### Drawer

`YardDrawer` keeps today's rows, the note, `ChangesView` and `MeView`. The rows become Water, Food,
Movement, Sleep and Steps. Steps has no object in the yard; its row opens the existing `StepsSheet`.

## Data you can call (already built and tested; it's in the bundle)

```ts
// src/types/index.ts
export type YardMood = 'tired' | 'low' | 'frustrated' | 'steady' | 'buzzing';
export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type SleepFeel = 'restless' | 'okay' | 'deep';
export interface SleepLog { id: string; night_of: string; hours: number; feel: SleepFeel | null; created_at: string }

// src/domain/checkin/moods.ts
export const YARD_MOODS: readonly YardMood[];   // tile order

// src/store/gardenStore.ts
export const MEALS: readonly Meal[];            // chip order
useGardenStore:
  todayYardMood(): YardMood | null
  logYardMood(mood: YardMood): Promise<void>     // re-picking edits today
  mealsToday(): Meal[]
  setMealsToday(meals: Meal[]): Promise<void>    // makes today's meals exactly this set
  lastNightSleep(): SleepLog | null
  logSleep(hours: number, feel: SleepFeel | null): Promise<void>   // rounds to the half hour
  // existing, unchanged: addGlass, removeLastGlassToday, addWorkout, updateWorkout, setUnwell, todayUnwell
```

Use `todayYardMood` and `logYardMood`, not the old `todayMood` and `logMood`, which only know four moods.
These actions already send telemetry (`logged {kind}` only, with kinds `water`, `food`, `workout`, `sleep`
and `mood`). Don't add any more, and never send values.

## Art style

- Flat vector with soft two-tone shading. A dark, warm outline on the characters and foreground props, at
  one visual thickness after scaling. No outline on the background (sky, hills, lawn).
- Every standing thing gets the same soft oval ground shadow.
- At most about 8 main objects on screen. If a detail doesn't read at phone size, leave it out.
- All colours become tokens in `src/constants/colors.ts`: a new `yardColors` (decorative, exempt from
  contrast pairs like `gardenColors`) and a `buzzing` mood set in `stateColors`. Never hardcode hex in
  components. Any new text or UI colour pair goes in `__tests__/colors.test.ts`.

## Motion and performance

- One Reanimated clock drives every loop (breathing, tail, Zzz, rolls), like today's `Motion.tsx`. No
  `Animated` (old API), no `setInterval` animations, no React re-render per frame.
- Walks use `withTiming` on shared values. Paths are straight lines, about 4 to 6 ms per point of distance,
  capped at 1.4 s.
- When the phone asks for reduced motion (`useReduceMotion`): no loops, no walking (the dog appears at the
  spot), no hop. Sheets and lines still work.
- Under 120 SVG nodes on screen. Static art is memoised.

## Accessibility

- Every tappable object is a `Hotspot` with `accessibilityRole="button"` and a label, for example "Water
  bowl. Log glasses of water".
- The scene has one spoken summary, for example "Maple is sitting, feeling steady. Pudding is asleep."
- Minimum font size 13, touch targets 44 pt, and text contrast 4.5:1.

## Tests

- `yardLayout`: every object is inside the screen and inside the 30 to 58% band, and no two tap rects
  overlap, for 360x640, 390x844 and 430x932.
- `yardMoods`: each mood maps to its pose, and no mood maps to neutral.
- `yardScript`: water goes walk, drink, sheet; food also wakes Pudding; dismissing produces no line.
- `YardScreen`: opening the water bowl shows the water sheet. Saving food calls `setMealsToday`. Pudding
  opens the sleep sheet and stays asleep.
- The existing `noEmDash` and `colors` tests must pass.

## Do not repeat these mistakes from the reference mock

Landscape art cropped on phones; goals like "0 / 8" or "1 / 8"; judging food; logging meds; pre-filled
forms; recording a mood when none was picked; toy buttons inside forms; two food bowls; a "pet 3x" counter;
lightning; eight floating HUD pieces; emoji as icons; a second display font; sound on by default; no
accessibility labels. The full list is in the attached critique.

## Your answer

1. The files you delete.
2. Every new or changed file, complete.
3. A short list of anything you couldn't do, or did differently, and why.
