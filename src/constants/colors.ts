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
 * The full-screen park (src/components/park). Decorative only, like `gardenColors`: no text sits
 * on these. Matches the Gemini concept art in design/park: layered hills, mist, four lights.
 */
export const parkColors: {
  sky: Record<ParkLight, { top: string; low: string }>;
  far: Record<ParkLight, string>;
  mid: Record<ParkLight, string>;
  ground: Record<ParkLight, { back: string; front: string; fore: string }>;
  path: Record<ParkLight, string>;
  river: Record<ParkLight, { water: string; flow: string }>;
  /** Tree crowns: shade underneath, leaf, and the light catching the top. */
  foliage: Record<ParkLight, { shade: string; leaf: string; light: string }>;
  soil: Record<ParkLight, string>;
  stone: Record<ParkLight, string>;
  hammock: { cloth: string; stripe: string };
  /** Washes the daytime painting toward each light (day needs none). */
  tint: Record<Exclude<ParkLight, 'day'>, { color: string; opacity: number }>;
  mist: Record<ParkLight, number>;
  sun: { dawn: string; day: string; dusk: string };
  moon: string;
  star: string;
  firefly: string;
  shimmer: string;
  cloud: string;
  mistTint: string;
} = {
  sky: {
    dawn: { top: '#C9B5DE', low: '#FBD9C4' },
    day: { top: '#9FD6CB', low: '#E2F3EA' },
    dusk: { top: '#5E5A84', low: '#F2A06A' },
    night: { top: '#16233B', low: '#2B3E57' },
    rain: { top: '#B4C3BE', low: '#DCE5E1' },
  },
  far: { dawn: '#B9C4BA', day: '#A3CDB9', dusk: '#8E8A80', night: '#2E4552', rain: '#AABAB3' },
  mid: { dawn: '#97B2A0', day: '#83BA9D', dusk: '#6E7563', night: '#24394A', rain: '#91A79D' },
  ground: {
    dawn: { back: '#86AC93', front: '#73A086', fore: '#5F8E73' },
    day: { back: '#74AE8A', front: '#5F9F78', fore: '#4E8C68' },
    dusk: { back: '#64735A', front: '#596A50', fore: '#4C5D45' },
    night: { back: '#2F4A45', front: '#2A443F', fore: '#223A35' },
    rain: { back: '#76A288', front: '#668F78', fore: '#577F69' },
  },
  path: { dawn: '#AFC9AC', day: '#A4D0A9', dusk: '#8F9472', night: '#3E5B52', rain: '#98B79E' },
  river: {
    dawn: { water: '#B9C8DE', flow: '#E8EEF6' },
    day: { water: '#9FD3E6', flow: '#E3F4FA' },
    dusk: { water: '#8F9DBE', flow: '#E9D6E3' },
    night: { water: '#4C6E8C', flow: '#8FAECB' },
    rain: { water: '#93B4C2', flow: '#D1E0E6' },
  },
  foliage: {
    dawn: { shade: '#4D8A6A', leaf: '#6CAE88', light: '#A3D2B2' },
    day: { shade: '#3F8F66', leaf: '#5FB585', light: '#8ED3A8' },
    dusk: { shade: '#4A6B4C', leaf: '#62845C', light: '#89A47A' },
    night: { shade: '#1F3A35', leaf: '#2C4E46', light: '#3E6658' },
    rain: { shade: '#457F63', leaf: '#62A07F', light: '#8DC0A2' },
  },
  soil: { dawn: '#8A6D58', day: '#8B6A4F', dusk: '#6E5444', night: '#3A3330', rain: '#7A6252' },
  stone: { dawn: '#D9D2C6', day: '#E2DBCD', dusk: '#B7AC9C', night: '#5A5E5E', rain: '#C9C6BE' },
  hammock: { cloth: '#F1D9A6', stripe: '#E2A86B' },
  tint: {
    dawn: { color: '#F2B39A', opacity: 0.16 },
    dusk: { color: '#6E4F86', opacity: 0.3 },
    night: { color: '#0D1A2E', opacity: 0.62 },
    rain: { color: '#7E949C', opacity: 0.3 },
  },
  mist: { dawn: 0.45, day: 0.35, dusk: 0.3, night: 0.14, rain: 0.5 },
  sun: { dawn: '#FFE3B0', day: '#FFF1BF', dusk: '#FFC77A' },
  moon: '#F6E7B5',
  star: '#F4F1E8',
  firefly: '#F5E58A',
  shimmer: '#FFFFFF',
  cloud: '#FFFFFF',
  mistTint: '#FFFFFF',
};
