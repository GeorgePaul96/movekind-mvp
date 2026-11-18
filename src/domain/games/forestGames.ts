import type { Rng } from '@/domain/games/games';

/**
 * Six forest games, designed with Gemini from public psychology tasks and rebuilt here to fit
 * the app (pure, injectable random source, the shared gentle staircase). Like the first five,
 * they are games: nothing here measures a person, and the app claims nothing for them.
 *
 * Fixes on the way in: Stream balance could produce a negative stone ("2 + -1") at levels 4
 * and 5, and Berry patch's description promised surface-area control at level 3 that the code
 * did not do. Both are corrected below.
 */

const level6 = (level: number) => Math.max(1, Math.min(6, Math.floor(level)));
const int = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));

// ---- Canopy leaf: find the one leaf that differs (visual search) ---------------------------

export type LeafShape = 'oval' | 'sassafras' | 'maple' | 'elm' | 'oak';

export interface LeafItem {
  id: string;
  shape: LeafShape;
  rotation: number;
  isTarget: boolean;
  /** Centre, as a share of the board (0 to 100). */
  x: number;
  y: number;
}

export interface CanopyLeafRound {
  leaves: LeafItem[];
  targetId: string;
  targetShape: LeafShape;
  distractorShape: LeafShape;
}

const LEAF_COUNTS = [6, 9, 12, 16, 20, 24];
const LEAF_PAIRS: [LeafShape, LeafShape][] = [
  ['oval', 'sassafras'],
  ['sassafras', 'maple'],
  ['oval', 'elm'],
  ['elm', 'oak'],
  ['oak', 'maple'],
  ['elm', 'sassafras'],
];

export function canopyLeafRound(level: number, rng: Rng): CanopyLeafRound {
  const lv = level6(level);
  const count = LEAF_COUNTS[lv - 1];
  const [distractorShape, targetShape] = LEAF_PAIRS[lv - 1];
  const targetIndex = Math.floor(rng() * count);
  const cols = lv <= 2 ? 3 : lv <= 4 ? 4 : 5;
  const rows = Math.ceil(count / cols);
  const leaves: LeafItem[] = [];
  for (let k = 0; k < count; k++) {
    const r = Math.floor(k / cols);
    const c = k % cols;
    const jx = (rng() - 0.5) * (50 / cols);
    const jy = (rng() - 0.5) * (50 / rows);
    let rotation = 0;
    if (lv === 2) rotation = (rng() - 0.5) * 30;
    else if (lv === 3) rotation = [0, 90, 180, 270][Math.floor(rng() * 4)];
    else if (lv >= 4) rotation = Math.floor(rng() * 360);
    leaves.push({
      id: `leaf-${k}`,
      shape: k === targetIndex ? targetShape : distractorShape,
      rotation: Math.round(rotation),
      isTarget: k === targetIndex,
      x: Math.max(7, Math.min(93, Math.round(((c + 0.5) / cols) * 88 + 6 + jx))),
      y: Math.max(7, Math.min(93, Math.round(((r + 0.5) / rows) * 84 + 8 + jy))),
    });
  }
  return { leaves, targetId: leaves[targetIndex].id, targetShape, distractorShape };
}

// ---- Dusk fireflies: tap the gold ones, let the blue ones pass (go / no-go) ----------------

export type FireflyType = 'gold' | 'blue';

export interface DuskFirefliesRound {
  type: FireflyType;
  /** How long it takes to drift across. Letting it pass costs nothing but the moment. */
  durationMs: number;
  startY: number;
  endY: number;
}

const DRIFT_MS = [3600, 3200, 2800, 2400, 2100, 1800];
const GOLD_SHARE = [0.8, 0.75, 0.7, 0.65, 0.6, 0.5];

export function duskFirefliesRound(level: number, rng: Rng): DuskFirefliesRound {
  const lv = level6(level);
  return {
    type: rng() < GOLD_SHARE[lv - 1] ? 'gold' : 'blue',
    durationMs: DRIFT_MS[lv - 1],
    startY: int(rng, 25, 75),
    endY: int(rng, 25, 75),
  };
}

// ---- Carved stones: same pattern turned, or mirrored? (mental rotation) --------------------

export interface GlyphNode {
  x: number;
  y: number;
}
export interface GlyphLine {
  from: number;
  to: number;
}

export interface CarvedStonesRound {
  nodes: GlyphNode[];
  lines: GlyphLine[];
  rotationDegrees: number;
  isMirrored: boolean;
  nodeCount: number;
}

/** Asymmetric twig carvings, one per level, growing from 3 to 6 points. */
const GLYPHS: { nodes: GlyphNode[]; lines: GlyphLine[] }[] = [
  { nodes: [{ x: 0, y: -35 }, { x: 0, y: 10 }, { x: 30, y: 35 }], lines: [{ from: 0, to: 1 }, { from: 1, to: 2 }] },
  {
    nodes: [{ x: 0, y: -35 }, { x: 0, y: 5 }, { x: -28, y: 30 }, { x: 22, y: -10 }],
    lines: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 1, to: 3 }],
  },
  {
    nodes: [{ x: -15, y: -35 }, { x: 10, y: -10 }, { x: 10, y: 30 }, { x: -30, y: 15 }],
    lines: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 }],
  },
  {
    nodes: [{ x: 0, y: -40 }, { x: 0, y: -10 }, { x: -25, y: 10 }, { x: 25, y: 15 }, { x: 0, y: 38 }],
    lines: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 1, to: 3 }, { from: 1, to: 4 }],
  },
  {
    nodes: [{ x: -10, y: -38 }, { x: 0, y: -15 }, { x: 25, y: -20 }, { x: -25, y: 15 }, { x: 0, y: 20 }, { x: 15, y: 40 }],
    lines: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 1, to: 4 }, { from: 4, to: 3 }, { from: 4, to: 5 }],
  },
  {
    nodes: [{ x: 0, y: -40 }, { x: 0, y: -15 }, { x: 28, y: -5 }, { x: -20, y: 10 }, { x: 12, y: 25 }, { x: -30, y: 35 }],
    lines: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 1, to: 3 }, { from: 3, to: 4 }, { from: 3, to: 5 }],
  },
];
const ROTATIONS = [[90, 180], [90, 180, 270], [45, 135, 225, 315], [45, 90, 135, 180, 225, 270, 315]];

export function carvedStonesRound(level: number, rng: Rng): CarvedStonesRound {
  const lv = level6(level);
  const glyph = GLYPHS[lv - 1];
  const choices = ROTATIONS[Math.min(lv, 4) - 1];
  return {
    nodes: glyph.nodes,
    lines: glyph.lines,
    rotationDegrees: choices[Math.floor(rng() * choices.length)],
    isMirrored: rng() >= 0.5,
    nodeCount: glyph.nodes.length,
  };
}

/** Where a node lands after the round's mirror and turn, for drawing and for tests. */
export function placeNode(n: GlyphNode, round: Pick<CarvedStonesRound, 'rotationDegrees' | 'isMirrored'>): GlyphNode {
  const x = round.isMirrored ? -n.x : n.x;
  const a = (round.rotationDegrees * Math.PI) / 180;
  return { x: x * Math.cos(a) - n.y * Math.sin(a), y: x * Math.sin(a) + n.y * Math.cos(a) };
}

// ---- Berry patch: which patch has more, without counting (estimation) ----------------------

export interface Berry {
  x: number;
  y: number;
  radius: number;
}

export interface BerryPatchRound {
  leftCount: number;
  rightCount: number;
  leftBerries: Berry[];
  rightBerries: Berry[];
  correctSide: 'left' | 'right';
}

/** Smaller and larger counts per level, getting closer together. */
const BERRY_PAIRS = [[7, 14], [10, 15], [12, 16], [16, 20], [20, 24], [24, 28]];

function scatter(count: number, radius: number, rng: Rng): Berry[] {
  const cols = Math.ceil(Math.sqrt(count * 1.3));
  const rows = Math.ceil(count / cols);
  const out: Berry[] = [];
  for (let k = 0; k < count; k++) {
    const c = k % cols;
    const r = Math.floor(k / cols);
    out.push({
      x: Math.max(8, Math.min(92, Math.round(((c + 0.5) / cols) * 80 + 10 + (rng() - 0.5) * (50 / cols)))),
      y: Math.max(8, Math.min(92, Math.round(((r + 0.5) / rows) * 80 + 10 + (rng() - 0.5) * (50 / rows)))),
      radius: Math.max(3.5, Math.min(8, radius + (rng() - 0.5) * 1.2)),
    });
  }
  return out;
}

export function berryPatchRound(level: number, rng: Rng): BerryPatchRound {
  const lv = level6(level);
  const shift = Math.floor(rng() * 3);
  const smaller = BERRY_PAIRS[lv - 1][0] + shift;
  const larger = BERRY_PAIRS[lv - 1][1] + shift;
  const leftIsLarger = rng() >= 0.5;
  // From level 3 the berries in the bigger patch are drawn smaller, so the total area of
  // berries is about equal and the answer comes from how many there are, not how much.
  const bigR = 5;
  const smallR = lv >= 3 ? bigR * Math.sqrt(smaller / larger) : bigR;
  const leftCount = leftIsLarger ? larger : smaller;
  const rightCount = leftIsLarger ? smaller : larger;
  return {
    leftCount,
    rightCount,
    leftBerries: scatter(leftCount, leftIsLarger ? smallR : bigR, rng),
    rightBerries: scatter(rightCount, leftIsLarger ? bigR : smallR, rng),
    correctSide: leftIsLarger ? 'left' : 'right',
  };
}

// ---- Stream balance: which bank has more, or do they balance (small sums) ------------------

export type BalanceAnswer = 'left' | 'balanced' | 'right';

export interface StreamBalanceRound {
  leftExpression: string;
  rightExpression: string;
  leftTotal: number;
  rightTotal: number;
  correctAnswer: BalanceAnswer;
}

/** A sum or a difference that makes `total`, every stone a whole number from 1 up. */
function makeSum(total: number, rng: Rng, kind: 'plain' | 'plus' | 'minus'): string {
  if (kind === 'plain' || total < 2) return kind === 'minus' ? `${total + 1} - 1` : `${total}`;
  if (kind === 'plus') {
    const a = int(rng, 1, total - 1);
    return `${a} + ${total - a}`;
  }
  const b = int(rng, 1, 6);
  return `${total + b} - ${b}`;
}

export function streamBalanceRound(level: number, rng: Rng): StreamBalanceRound {
  const lv = level6(level);
  const balanced = rng() < [0.3, 0.3, 0.35, 0.3, 0.35, 0.4][lv - 1];
  const ranges: [number, number][] = [[2, 9], [3, 12], [4, 16], [4, 18], [5, 24], [8, 30]];
  const [lo, hi] = ranges[lv - 1];
  const leftTotal = int(rng, lo, hi);
  const gap = lv <= 3 ? int(rng, 1, 3) : lv <= 5 ? int(rng, 1, 2) : 1;
  let rightTotal = balanced ? leftTotal : leftTotal + (rng() < 0.5 ? -gap : gap);
  if (rightTotal < 1) rightTotal = leftTotal + gap;

  const forms: ['plain' | 'plus' | 'minus', 'plain' | 'plus' | 'minus'][] = [
    ['plain', 'plain'],
    ['plus', 'plain'],
    ['plus', 'plus'],
    ['minus', 'plus'],
    ['minus', 'plus'],
    ['plus', 'minus'],
  ];
  const [lf, rf] = forms[lv - 1];
  const correctAnswer: BalanceAnswer = leftTotal === rightTotal ? 'balanced' : leftTotal > rightTotal ? 'left' : 'right';
  return {
    leftExpression: makeSum(leftTotal, rng, lf),
    rightExpression: makeSum(rightTotal, rng, rf),
    leftTotal,
    rightTotal,
    correctAnswer,
  };
}

/** Works out a stone's sum, so tests can check every expression matches its total. */
export function evaluate(expression: string): number {
  const parts = expression.split(' ');
  let total = Number(parts[0]);
  for (let k = 1; k < parts.length; k += 2) total = parts[k] === '+' ? total + Number(parts[k + 1]) : total - Number(parts[k + 1]);
  return total;
}

// ---- Firefly flight: watch the path, tap it back in reverse ---------------------------------

export interface Lantern {
  id: number;
  x: number;
  y: number;
}

export interface FireflyFlightRound {
  lanterns: Lantern[];
  sequence: number[];
  reverseSequence: number[];
  stepDurationMs: number;
}

const LANTERN_SPOTS = [
  { x: 20, y: 18 }, { x: 80, y: 20 }, { x: 50, y: 34 }, { x: 22, y: 52 }, { x: 78, y: 50 },
  { x: 50, y: 68 }, { x: 20, y: 84 }, { x: 80, y: 82 }, { x: 50, y: 92 },
];

export function fireflyFlightRound(level: number, rng: Rng): FireflyFlightRound {
  const lv = level6(level);
  const count = [5, 6, 7, 8, 8, 9][lv - 1];
  const length = [3, 3, 4, 4, 5, 6][lv - 1];
  const sequence: number[] = [];
  while (sequence.length < length) {
    const next = Math.floor(rng() * count);
    if (next !== sequence[sequence.length - 1]) sequence.push(next);
  }
  return {
    lanterns: LANTERN_SPOTS.slice(0, count).map((p, id) => ({ id, ...p })),
    sequence,
    reverseSequence: [...sequence].reverse(),
    stepDurationMs: [750, 650, 600, 550, 500, 450][lv - 1],
  };
}

export const FOREST_GAME_MAX = 6;
