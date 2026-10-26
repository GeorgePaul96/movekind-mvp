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
