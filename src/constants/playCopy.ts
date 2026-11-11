import type { GameId, Ink, PairIcon, Shade, Shape, SwitchRule } from '@/domain/games/games';

/**
 * Copy for the Play tab. Re-exported from copy.ts.
 *
 * The honesty rule: these are games. Nothing here may say or hint that playing trains the
 * brain, sharpens memory, raises IQ or protects against decline. A test checks the wording.
 */
export const PLAY_COPY = {
  title: 'Play',
  intro: 'A few small games for a quiet moment. No timers, no scores kept, no losing.',
  honestTitle: 'Just games',
  honest:
    'These are here because they are pleasant, not because they do anything for your brain. With practice people get better at the games themselves. Research has not shown that games like these help with memory or thinking in daily life, so we make no such promise.',
  games: {
    pattern: { name: 'Light the tiles', what: 'Some tiles light up, then hide. Tap where they were.' },
    sequence: { name: 'In order', what: 'Tiles light up one after another. Tap them in the same order.' },
    ink: { name: 'Ink', what: 'A colour word is printed in some ink. Tap the ink, not the word.' },
    switch: { name: 'Shape or shade', what: 'Answer by shape or by shade. The rule changes as you go.' },
    pairs: { name: 'Pairs', what: 'Turn over two cards at a time and find the matching ones.' },
  } as Record<GameId, { name: string; what: string }>,
  playA11y: (name: string) => `Play ${name}`,
  close: 'Close',
  closeA11y: 'Close the game',
  round: (n: number, total: number) => `Round ${n} of ${total}`,
  level: (n: number) => `Level ${n}`,
  setDone: 'That is a set.',
  setDoneBody: 'Nothing was saved or scored. Play another, or leave it there.',
  again: 'Another set',
  back: 'Back to the games',

  watch: 'Watch',
  yourTurn: 'Your turn, at your own pace',
  clean: 'Lovely.',
  easing: 'Easing off a little.',
  tile: (row: number, col: number) => `Tile, row ${row}, column ${col}`,

  inks: { red: 'Red', blue: 'Blue', green: 'Green', purple: 'Purple' } as Record<Ink, string>,
  inkAsk: 'Which ink is the word printed in?',
  inkWordA11y: (word: string, ink: string) => `The word ${word}, printed in ${ink.toLowerCase()} ink`,
  inkWas: (ink: string) => `The ink was ${ink.toLowerCase()}.`,
  inkColourNote: 'This game depends on telling colours apart.',

  rule: { shape: 'Answer by shape', shade: 'Answer by shade' } as Record<SwitchRule, string>,
  shapes: { circle: 'Circle', square: 'Square' } as Record<Shape, string>,
  shades: { dark: 'Dark', light: 'Light' } as Record<Shade, string>,
  figureA11y: (shade: string, shape: string) => `A ${shade.toLowerCase()} ${shape.toLowerCase()}`,

  pairNames: {
    leaf: 'Leaf',
    flower: 'Flower',
    water: 'Water drop',
    'white-balance-sunny': 'Sun',
    'moon-waning-crescent': 'Moon',
    star: 'Star',
    heart: 'Heart',
    tree: 'Tree',
    paw: 'Paw',
    cloud: 'Cloud',
  } as Record<PairIcon, string>,
  cardDown: (n: number) => `Card ${n}, face down`,
  cardUp: (n: number, name: string) => `Card ${n}: ${name}`,
  pairsDone: 'All pairs found.',
} as const;
