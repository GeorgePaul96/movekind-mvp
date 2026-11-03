/**
 * MoveKind design tokens — "Sage". The single source of truth for color.
 *
 * Misty sage canvas, white cards with faint green rings, deep forest-green actions,
 * four clearly different mood colours. Calm, but every action is solid or clearly outlined.
 *
 * Rules:
 * - Reference SEMANTIC tokens (`colors.primary`, `colors.textSecondary`, …), never raw hex.
 * - Text pairs clear WCAG AA 4.5:1; non-text UI/graph pairs clear 3:1.
 *   Enforced by __tests__/colors.test.ts — add new pairs there when you add tokens.
 * - Sage (#599E7C) is decoration only: white text on it fails 4.5:1, so actions use `primary`.
 * - Mood color comes from `stateColors[state]` (soft / ink / accent / tint), never ad hoc.
 */

export const colors = {
  // ---- Surfaces ----------------------------------------------------------
  background: '#F6FAF5',        // app canvas — misty sage white
  surface: '#FFFFFF',           // cards / raised surfaces
  surfaceSecondary: '#EEF4EF',  // inputs, wells, nested surfaces
  inverse: '#2D322E',           // the dark note card
  onInverse: '#FFFFFF',
  onInverseSoft: 'rgba(255,255,255,0.12)', // icon circle on the dark note card

  // ---- Text --------------------------------------------------------------
  textPrimary: '#181D1A',       // 16:1 on background
  textSecondary: '#404943',     // 8.8:1
  textMuted: '#5A635D',         // 5.9:1, still AA, never faint
  onPrimary: '#FFFFFF',

  // ---- Actions -----------------------------------------------------------
  primary: '#20684A',           // deep forest green — buttons, active tab, links (6.7:1 with white)
  primaryPressed: '#185239',
  primarySoft: '#DCEFE3',       // tinted surface (active tab pill, soft highlights)
  secondary: '#DCEFE3',
  secondaryText: '#20684A',
  sage: '#599E7C',              // decoration only (icons on soft fills, dots); never behind text

  // ---- Lines & elevation -------------------------------------------------
  border: '#BFC9C1',            // decorative card edges only — never the sole cue for a control
  ring: 'rgba(89,158,124,0.16)', // the faint green ring around cards
  divider: '#E5E9E4',
  shadow: '#244434',
  scrim: 'rgba(24,29,26,0.35)', // dims the screen behind a bottom sheet

  // ---- Status ------------------------------------------------------------
  success: '#2F7A52',
  warning: '#8A5A12',
  error: '#A8443A',
  info: '#2F6596',
} as const;

export type ColorName = keyof typeof colors;

/**
 * Per-mood color sets. Four distinct hues so no two moods can be confused.
 * - `soft`  : tile / surface fill
 * - `ink`   : text and borders on `soft` (and a ≥3:1 outline on the canvas)
 * - `accent`: fill that carries white text; also readable as text on the canvas
 * - `tint`  : flowers, dots — ≥3:1 on white
 */
export const stateColors = {
  overloaded: { soft: '#E3E5FA', ink: '#363C8C', accent: '#4C54B6', tint: '#6F78D8' },
  recovering: { soft: '#D5EEE0', ink: '#1F5C3A', accent: '#2F7A52', tint: '#3F9468' },
  regulated:  { soft: '#FBEBC4', ink: '#6B4A0E', accent: '#8A5A12', tint: '#B07A1C' },
  activated:  { soft: '#FAD9D1', ink: '#8A3220', accent: '#A8443A', tint: '#D0573F' },
} as const;

export type CapacityState = keyof typeof stateColors;

/**
 * The garden illustration (src/components/garden/Garden.tsx). Decorative only: no text
 * or control ever sits on these, and the garden has a spoken summary, so they are exempt
 * from the contrast pairs. Mood flowers use `stateColors[mood].tint`.
 */
export const gardenColors = {
  sky: '#E4F1EE',
  skyLow: '#F3F8EC',
  dawnSky: '#FBDCCB',
  dawnLow: '#FFF1E2',
  duskSky: '#F2C29C',
  duskLow: '#E9D6EE',
  sunDusk: '#F6A86B',
  rainSky: '#C6D4CF',
  rainLow: '#E3EBE7',
  rainCloud: '#A9BBB5',
  rain: '#7FA6BC',
  mist: '#FFFFFF',
  skyRest: '#26332C',
  skyRestLow: '#3A4A40',
  star: '#F4F1E8',
  sun: '#FFE08F',
  sunGlow: '#FFF2C7',
  moon: '#F6E7B5',
  cloud: '#FFFFFF',
  hillBack: '#BFE3CC',
  hillFront: '#9ED3B2',
  hillBackRest: '#3F5A4A',
  hillFrontRest: '#4C6B57',
  grass: '#4E9A6F',
  stream: '#A9D8EE',
  streamDeep: '#6BB6D9',
  trunk: '#9A7B5A',
  leaf: '#5FB585',
  leafLight: '#8ED3A8',
  blossom: '#F6C1C9',
  fruit: '#EE7A63',
  bird: '#F2B84B',
  birdWing: '#E0A13A',
  duck: '#F2D36B',
  beak: '#EE7A63',
  flowerHeart: '#FFE08A',
} as const;

/** Soft, consistent elevation: a faint sage-tinted shadow, never a hard drop shadow. */
export const elevation = {
  card: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  raised: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
} as const;

type ParkLight = 'dawn' | 'day' | 'dusk' | 'night' | 'rain';

/**
 * The full-screen cartoon park (src/components/park). Decorative only, like `gardenColors`.
 * Tuned for a bright, friendly vector world with bold hero outlines (`outline`) and soft ground shadows (`shadow`).
 */
export const parkColors: {
  sky: Record<ParkLight, { top: string; low: string }>;
  far: Record<ParkLight, string>;
  mid: Record<ParkLight, string>;
  ground: Record<ParkLight, { back: string; front: string; fore: string }>;
  path: Record<ParkLight, string>;
  pathBank: Record<ParkLight, string>;
  river: Record<ParkLight, { water: string; flow: string; bank: string }>;
  /** Tree crowns: shade underneath, leaf, and the light catching the top. */
  foliage: Record<ParkLight, { shade: string; leaf: string; light: string }>;
  soil: Record<ParkLight, string>;
  stone: Record<ParkLight, string>;
  /** The rocks at the river's spring: darker than `stone`, so they can't read as a cloud. */
  rock: Record<ParkLight, { base: string; light: string }>;
  hammock: { cloth: string; stripe: string };
  /** `far` is the two legs on the far side, a shade darker so the fawn reads as standing on four. */
  fawn: { body: string; far: string; under: string; antler: string; spot: string; nose: string };
  rabbit: { body: string; earInner: string; nose: string };
  /** Pip, the honey-coloured seed who lives in the park. */
  pip: { body: string; shine: string; feet: string; cheek: string };
  /** Rosy cheeks on the park's creatures. */
  blush: string;
  /** Washes the daytime scene toward each light (day needs none). */
  tint: Record<Exclude<ParkLight, 'day'>, { color: string; opacity: number }>;
  mist: Record<ParkLight, number>;
  sun: { dawn: string; day: string; dusk: string };
  moon: string;
  star: string;
  firefly: string;
  shimmer: string;
  cloud: string;
  mistTint: string;
  outline: string;
  shadow: string;
} = {
  sky: {
    dawn: { top: '#B6D0F7', low: '#FFE4D6' },
    day: { top: '#89CFF8', low: '#DCF2FF' },
    dusk: { top: '#6D68A8', low: '#F7B08A' },
    night: { top: '#142038', low: '#263B5E' },
    rain: { top: '#A8BFC9', low: '#DAE6EC' },
  },
  far: { dawn: '#8FD694', day: '#7ED987', dusk: '#689E70', night: '#264D3E', rain: '#84B593' },
  mid: { dawn: '#6CC476', day: '#59C768', dusk: '#528B5A', night: '#1F4033', rain: '#6BA07B' },
  ground: {
    dawn: { back: '#63C16D', front: '#4FB45B', fore: '#3E9C4A' },
    day: { back: '#62C96B', front: '#4DB857', fore: '#399E43' },
    dusk: { back: '#509658', front: '#42824A', fore: '#346B3B' },
    night: { back: '#244A3B', front: '#1E3F32', fore: '#173328' },
    rain: { back: '#58AD68', front: '#479956', fore: '#388246' },
  },
  path: { dawn: '#EDE2C8', day: '#F5EBD4', dusk: '#C9BFA8', night: '#4A5752', rain: '#D1CABB' },
  pathBank: { dawn: '#47A352', day: '#42A84B', dusk: '#397340', night: '#1A362B', rain: '#3E8A4C' },
  river: {
    dawn: { water: '#7CC6F2', flow: '#E6F5FF', bank: '#3D964E' },
    day: { water: '#58BDF6', flow: '#E3F6FF', bank: '#389C49' },
    dusk: { water: '#6A9BC7', flow: '#DCEBFA', bank: '#326B3E' },
    night: { water: '#345E85', flow: '#7AA6CC', bank: '#16332A' },
    rain: { water: '#6CA9CC', flow: '#D6EBF7', bank: '#357F46' },
  },
  foliage: {
    dawn: { shade: '#2E9448', leaf: '#48B862', light: '#7CE08F' },
    day: { shade: '#279B43', leaf: '#44C45E', light: '#7AE88F' },
    dusk: { shade: '#2B753D', leaf: '#3E9452', light: '#66B878' },
    night: { shade: '#16382B', leaf: '#214F3D', light: '#326B54' },
    rain: { shade: '#2D8547', leaf: '#44A660', light: '#6EC786' },
  },
  soil: { dawn: '#8A624A', day: '#91674C', dusk: '#6E4E3A', night: '#382B24', rain: '#75533E' },
  stone: { dawn: '#E3DDD3', day: '#ECE6DC', dusk: '#BDB5A8', night: '#575C5C', rain: '#C7C3BA' },
  rock: {
    dawn: { base: '#9C9A8E', light: '#BDBBAE' },
    day: { base: '#A3A296', light: '#C6C4B7' },
    dusk: { base: '#7F7C75', light: '#9C9991' },
    night: { base: '#3F4645', light: '#525A58' },
    rain: { base: '#8E8F87', light: '#ABACA3' },
  },
  hammock: { cloth: '#FFE299', stripe: '#FF8A65' },
  fawn: {
    body: '#F08A35',
    far: '#C9692A',
    under: '#FFF1E0',
    antler: '#8A4A28',
    spot: '#FFFFFF',
    nose: '#4A2818',
  },
  rabbit: {
    body: '#ECEFF4',
    earInner: '#F6C1C9',
    nose: '#EE7A63',
  },
  pip: { body: '#FFD89A', shine: '#FFF1D6', feet: '#E8B96A', cheek: '#F6A9B4' },
  blush: '#F6A9B4',
  tint: {
    dawn: { color: '#FFA882', opacity: 0.12 },
    dusk: { color: '#5E3D7A', opacity: 0.22 },
    night: { color: '#0A1526', opacity: 0.45 },
    rain: { color: '#6E8894', opacity: 0.22 },
  },
  mist: { dawn: 0.3, day: 0.2, dusk: 0.25, night: 0.12, rain: 0.4 },
  sun: { dawn: '#FFE082', day: '#FFF0A8', dusk: '#FFB76B' },
  moon: '#FFF0B8',
  star: '#FFFDF5',
  firefly: '#FFE875',
  shimmer: '#FFFFFF',
  cloud: '#FFFFFF',
  mistTint: '#FFFFFF',
  outline: '#231F20',
  shadow: 'rgba(24, 52, 34, 0.18)',
};
