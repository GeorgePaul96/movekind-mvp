# Prompt for Gemini: MoveKind mind games, round 2

Copy everything below the line into Gemini. Attach `src/domain/games/games.ts`,
`src/components/games/boards.tsx`, `src/components/games/GameScreen.tsx`,
`src/constants/playCopy.ts` and `src/constants/colors.ts` so it builds on what exists.

---

## Who you are and what you are making

You are a senior game designer and React Native engineer. Design and build **six new small
mind games** for MoveKind, a calm, kind self-care app (Expo SDK 58, React Native 0.88, React 19,
TypeScript strict). The games live in the app's Play tab next to five that already exist (Light
the tiles, In order, Ink, Shape or shade, Pairs). I am attaching their code. Match its structure.

The bar for polish is the big commercial brain-game apps: smooth feel, satisfying sound and
motion, clear instructions in one line, levels that adapt to the player. **The bar for
originality and honesty is higher than theirs.** Read the two rule sections before designing
anything.

## Rule 1: original, not a copy

The cognitive tasks these apps use are old, public psychology tasks (memory span, visual search,
go / no-go, mental rotation, task switching, estimation, mental arithmetic). Use those tasks
freely. **Do not copy any specific commercial game.** For every game you design:

- Invent its own name, theme, art direction and screen layout. Do not reuse or paraphrase a
  name from Lumosity, Elevate, Peak, CogniFit, BrainHQ or similar apps.
- Do not reproduce a recognisable mechanic-plus-theme pairing from those apps (for example:
  birds or leaves that point one way while moving another, a train switching to coloured
  stations, a "memory matrix" that rotates, fish to feed in a tank, a "speed match" card flip).
- For each game, write two sentences under "How this differs from existing apps" naming the
  public task it is based on and what makes your version its own.

The app's world is a quiet forest. Theme every game in that world: leaves, stones, fireflies,
mushrooms, rain, a stream, small animals, lanterns at dusk.

## Rule 2: honest, no false advertising

The maker of Lumosity paid the US Federal Trade Commission $2 million in 2016 for advertising,
without evidence, that its games improve school and work performance and protect against
decline. MoveKind will not make that mistake.

- Nowhere in the copy, names, descriptions, results screens or code comments meant for users may
  you say or hint that the games train the brain, improve memory, attention, focus, speed or IQ,
  "keep the mind sharp", or help with ageing, dementia, ADHD or anything medical.
- No "brain age", "cognitive score", "percentile", "LPI" or comparison with other people.
- It is fine, and true, to say a game is relaxing, absorbing, or a nice break, and that people
  get better at a game with practice.
- Every game's one-line description says what you do, not what it does for you.
  Good: "Fireflies light up in a pattern. Tap them back in the same order."
  Not allowed: "Strengthen your working memory with fireflies."

## Rule 3: kind, never stressful

MoveKind's promise is no guilt and no pressure. So:

- **No countdown timers that end a round**, no lives, no "game over", no red crosses, no buzzer.
  A soft pace (things drifting by) is fine as long as missing one costs nothing but the moment.
- Each game is a **set** of 8 to 15 rounds, then a short, warm "That is a set" card. Nothing is
  scored, ranked or saved after the screen closes. Telemetry is at most `played { game }`.
- Difficulty uses the existing **gentle staircase**: two clean rounds step up one level, one miss
  steps down one, never below level 1 (`stairStep` in `games.ts`). Each game defines 5 to 8
  levels with a clear rule for what changes per level.
- A miss reveals the right answer gently in the warm honey colour (`colors.warm` /
  `colors.warmInk`) and moves on.
- Work with reduced motion: when `useReduceMotion()` is true, replace movement with fades or
  instant changes and keep the game playable.

## The six games to design

Base each on one of these public tasks, one game per task:

1. **Visual search**: find the one item that differs among many.
2. **Go / no-go**: tap for some items, let others pass.
3. **Mental rotation**: is this shape the same as that one, turned?
4. **Estimation**: which group has more, without counting.
5. **Mental arithmetic**: a gentle sum or comparison, with numbers kept small at low levels.
6. **Spatial span with a twist of your choosing** (for example, recall the path a firefly took),
   clearly different from the existing Light the tiles and In order games.

For each game provide:

- Name, one-line description (honest, per Rule 2), the public task it is based on, and "How this
  differs from existing apps".
- A level table: level number, what the player sees, what changes from the level before.
- What a round looks like, start to finish, including what happens on a miss.
- A layout sketch in words for a 375 by 812 phone, one hand, thumbs near the bottom.
- Sound cues (see "Sounds" below) and motion cues.
- Accessibility: how a screen-reader user plays it, or, if a game cannot be made accessible,
  say so plainly and give a fallback description shown on the card.

## Technical requirements

- **Pure logic first.** Add each game's round generator to `src/domain/games/games.ts` as a
  pure function `xxxRound(level, rng)` with the injectable `Rng` type and `seededRng` for tests.
  No React, no clock, no I/O in that file.
- **One board component per game** in `src/components/games/boards.tsx` (or a new file per game
  if the file grows past about 600 lines), following the existing `BoardProps` contract: it plays
  exactly one round and calls `onResult(correct)`. Use the existing `useLater` pattern so no timer
  fires after the board unmounts.
- Register each game in `GAME_IDS`, `GAME_RULES` and the `BOARDS` map in `GameScreen.tsx`, with
  an icon in `PlayView.tsx`.
- **Drawing:** React Native views and `react-native-svg` only (already installed). No new native
  dependencies, no canvas library, no game engine. Animations with `react-native-reanimated`
  (already installed), gentle springs, no shaking.
- **Colours:** only tokens from `src/constants/colors.ts`. If you need new ones, add them there
  and add a contrast check for every text or control colour to `__tests__/colors.test.ts`
  (text at least 4.5:1, controls at least 3:1). Never hardcode hex in components.
- **Type:** Plus Jakarta Sans via `...font.bold` etc. from `src/constants/typography.ts`, never
  `fontWeight`. Minimum font size 13. Touch targets at least 44 by 44.
- **Copy:** every user-facing string goes in `src/constants/playCopy.ts`. **No em dashes**
  anywhere in user-facing text (a test fails on them). Sentence case, plain words.
- **Controls:** use the app's `<Button>` for buttons. Game pieces that are tapped may be
  `Pressable`, each with `accessibilityRole="button"` and a clear `accessibilityLabel`.
- **Tests** in `__tests__/games.test.tsx` style: for each game, round generators are repeatable
  from a seed, levels change what they say they change, the right answer is always available,
  a clean round reports `true`, a miss reports `false`, and a test that scans `PLAY_COPY` for
  forbidden claim words (train, training, sharpen, smarter, IQ, boost, improve, cognitive, brain,
  memory, focus, dementia, decline) still passes.

## Sounds

The app is getting short CC0 sounds from Kenney packs, converted to WAV and played with
`expo-audio`. Refer to them by these names; I will map them:

- `tap` (soft click), `select` (gentle confirm), `notes` (a pentatonic step, rising per correct
  item; the existing `chime.note(index)` does this), `soft` (a low, quiet tone for a miss),
  `drop` (a light thud), `set` (a warm two-note ending for a finished set).

Never play a harsh or alarming sound. Sound must be optional: the game is fully playable muted.

## What to hand back

1. The design document for all six games (the per-game sections above), with the "How this
   differs" notes.
2. Complete code for the new round generators, boards, registration and copy, ready to paste.
3. The tests.
4. A short list of anything you were unsure about or could not make accessible.

Do not change the existing five games, the staircase, the "Just games" note, or any file
outside `src/domain/games/`, `src/components/games/`, `src/screens/main/PlayView.tsx`,
`src/constants/playCopy.ts`, `src/constants/colors.ts` and the two test files named above.
