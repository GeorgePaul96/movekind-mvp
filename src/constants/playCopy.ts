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
    leaf: { name: 'Canopy leaf', what: 'Find the one leaf that does not match the others in the clearing.' },
    fireflies: { name: 'Dusk fireflies', what: 'Tap the gold fireflies as they drift by, and let the blue ones pass.' },
    stones: { name: 'Carved stones', what: 'Two carved stones: the same pattern turned, or a mirror image?' },
    berries: { name: 'Berry patch', what: 'Tap the patch with more berries, without stopping to count.' },
    balance: { name: 'Stream balance', what: 'Compare the stones on each bank: which side has more, or do they balance?' },
    flight: { name: 'Firefly flight', what: 'Watch a firefly visit the lanterns, then tap them in reverse order.' },
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

  leafAsk: 'Tap the leaf that stands apart.',
  leafWas: 'Here was the leaf that differed.',
  leafA11y: (n: number, shape: string) => `Leaf ${n}, ${shape}`,
  leafShapes: { oval: 'smooth oval', sassafras: 'three lobes', maple: 'five points', elm: 'toothed edge', oak: 'wavy lobes' } as Record<string, string>,

  firefliesAsk: 'Tap the gold glow. Let the blue ones drift by.',
  letPass: 'Let it pass',
  catchA11y: 'Golden firefly. Tap to catch it.',
  restA11y: 'Blue firefly. Let it pass.',
  goldMissed: 'That gold one drifted home.',
  blueTapped: 'Blue fireflies like to drift by undisturbed.',

  stonesAsk: 'The same pattern turned, or a mirror image?',
  stoneLeft: 'This pattern',
  stoneRight: 'This one',
  same: 'Same, turned',
  mirrored: 'Mirrored',
  stonesWas: (mirrored: boolean) => (mirrored ? 'It was a mirror image.' : 'It was the same pattern, turned.'),
  stoneA11y: (side: string, turned: number) => (turned ? `${side}, turned ${turned} degrees` : side),

  berriesAsk: 'Tap the patch with more berries.',
  patchA11y: (side: string) => `${side} patch of berries`,
  left: 'Left',
  right: 'Right',
  berryCount: (n: number) => `${n} berries`,

  balanceAsk: 'Which bank has more, or do they balance?',
  bankA11y: (side: string, sum: string) => `${side} bank: ${sum.replace(' + ', ' plus ').replace(' - ', ' minus ')}`,
  moreLeft: 'Left',
  balanced: 'Balanced',
  moreRight: 'Right',
  moreLeftA11y: 'The left bank has more',
  balancedA11y: 'Both banks balance',
  moreRightA11y: 'The right bank has more',
  totals: (l: number, r: number) => `Left makes ${l}, right makes ${r}.`,

  flightWatch: 'Watch where the firefly goes.',
  flightAsk: 'Now tap them in reverse, starting with the last.',
  flightStep: (n: number, total: number) => `${n} of ${total}`,
  flightWas: 'Here was the way back.',
  lanternA11y: (n: number) => `Lantern ${n}`,
} as const;
