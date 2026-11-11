/**
 * Small games for the Play tab. Pure logic: every round is generated from a random source
 * passed in, so the games can be tested exactly.
 *
 * They are games, kept because they are pleasant. Nothing here measures, scores or stores
 * anything about a person, and the app makes no claim that playing improves memory or
 * thinking (see PLAY_COPY.honest). The tasks are the classic, public ones from psychology
 * (pattern recall, order recall, the colour-word task, rule switching) and pairs.
 */

export type Rng = () => number;

/** A small deterministic random source, for tests. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(xs: readonly T[], rng: Rng): T => xs[Math.floor(rng() * xs.length)];

export function shuffle<T>(xs: readonly T[], rng: Rng): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ---- The gentle staircase ----------------------------------------------------

export interface Stair {
  level: number;
  /** Clean rounds in a row at this level. */
  streak: number;
}

export const START: Stair = { level: 1, streak: 0 };

/**
 * Two clean rounds step up one level; a miss quietly steps down one. There is no losing:
 * the game simply settles where it is comfortable.
 */
export function stairStep(s: Stair, correct: boolean, maxLevel: number): Stair {
  if (!correct) return { level: Math.max(1, s.level - 1), streak: 0 };
  if (s.streak + 1 >= 2) return { level: Math.min(maxLevel, s.level + 1), streak: 0 };
  return { level: s.level, streak: s.streak + 1 };
}

// ---- Light the tiles: remember where they were -----------------------------------

const PATTERN_LEVELS = [
  { size: 3, count: 3 },
  { size: 3, count: 4 },
  { size: 4, count: 4 },
  { size: 4, count: 5 },
  { size: 4, count: 6 },
  { size: 5, count: 7 },
  { size: 5, count: 8 },
] as const;
export const PATTERN_MAX = PATTERN_LEVELS.length;

export function patternRound(level: number, rng: Rng): { size: number; targets: number[] } {
  const { size, count } = PATTERN_LEVELS[Math.min(Math.max(level, 1), PATTERN_MAX) - 1];
  const cells = Array.from({ length: size * size }, (_, k) => k);
  return { size, targets: shuffle(cells, rng).slice(0, count).sort((a, b) => a - b) };
}

// ---- In order: remember the order they lit up ----------------------------------

export const SEQUENCE_SIZE = 3;
export const SEQUENCE_MAX = 6;

/** A run of tiles on a 3 by 3 grid, never the same tile twice in a row. Three long at level 1. */
export function sequenceRound(level: number, rng: Rng): number[] {
  const length = Math.min(Math.max(level, 1), SEQUENCE_MAX) + 2;
  const out: number[] = [];
  while (out.length < length) {
    const next = Math.floor(rng() * SEQUENCE_SIZE * SEQUENCE_SIZE);
    if (next !== out[out.length - 1]) out.push(next);
  }
  return out;
}

// ---- Ink: name the colour, not the word (the classic colour-word task) ------------

export const INKS = ['red', 'blue', 'green', 'purple'] as const;
export type Ink = (typeof INKS)[number];
export const INK_MAX = 5;

export function inkRound(level: number, rng: Rng): { word: Ink; ink: Ink; options: Ink[] } {
  const lv = Math.min(Math.max(level, 1), INK_MAX);
  const word = pick(INKS, rng);
  // Early levels often match; later ones mostly clash.
  const matches = rng() < Math.max(0.1, 0.5 - 0.1 * (lv - 1));
  const ink = matches ? word : pick(INKS.filter((i) => i !== word), rng);
  // From level 3 the answer buttons move around too.
  return { word, ink, options: lv >= 3 ? shuffle(INKS, rng) : [...INKS] };
}

// ---- Shape or shade: the rule changes ----------------------------------------------

export type SwitchRule = 'shape' | 'shade';
export type Shape = 'circle' | 'square';
export type Shade = 'dark' | 'light';
export const SWITCH_MAX = 5;

export interface SwitchRound {
  rule: SwitchRule;
  shape: Shape;
  shade: Shade;
  answer: Shape | Shade;
}

export function switchRound(level: number, previousRule: SwitchRule | null, rng: Rng): SwitchRound {
  const lv = Math.min(Math.max(level, 1), SWITCH_MAX);
  // The rule changes more often as the level rises.
  const changes = rng() < Math.min(0.8, 0.2 + 0.15 * (lv - 1));
  const rule: SwitchRule =
    previousRule == null
      ? pick(['shape', 'shade'] as const, rng)
      : changes
        ? previousRule === 'shape'
          ? 'shade'
          : 'shape'
        : previousRule;
  const shape = pick(['circle', 'square'] as const, rng);
  const shade = pick(['dark', 'light'] as const, rng);
  return { rule, shape, shade, answer: rule === 'shape' ? shape : shade };
}

// ---- Pairs: find the matching cards ----------------------------------------------

export const PAIR_ICONS = [
  'leaf', 'flower', 'water', 'white-balance-sunny', 'moon-waning-crescent',
  'star', 'heart', 'tree', 'paw', 'cloud',
] as const;
export type PairIcon = (typeof PAIR_ICONS)[number];
const PAIR_COUNTS = [6, 8, 10] as const;
export const PAIRS_MAX = PAIR_COUNTS.length;

/** A shuffled board: 12, 16 or 20 cards. */
export function pairsDeck(level: number, rng: Rng): PairIcon[] {
  const pairs = PAIR_COUNTS[Math.min(Math.max(level, 1), PAIRS_MAX) - 1];
  const icons = shuffle(PAIR_ICONS, rng).slice(0, pairs);
  return shuffle([...icons, ...icons], rng);
}

// ---- The games, as the Play tab lists them ---------------------------------------

export const GAME_IDS = ['pattern', 'sequence', 'ink', 'switch', 'pairs'] as const;
export type GameId = (typeof GAME_IDS)[number];

/** Rounds in one set, and the highest level. A set always ends; there is no "game over". */
export const GAME_RULES: Record<GameId, { rounds: number; maxLevel: number }> = {
  pattern: { rounds: 8, maxLevel: PATTERN_MAX },
  sequence: { rounds: 8, maxLevel: SEQUENCE_MAX },
  ink: { rounds: 12, maxLevel: INK_MAX },
  switch: { rounds: 12, maxLevel: SWITCH_MAX },
  pairs: { rounds: 1, maxLevel: PAIRS_MAX },
};
