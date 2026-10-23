/**
 * MoveKind design tokens — "Sunrise". The single source of truth for color.
 *
 * Warm cream canvas, white cards, four clear mood colors, deep-green actions.
 * Calm, but never washed out: every action is either solid or clearly outlined.
 *
 * Rules:
 * - Reference SEMANTIC tokens (`colors.primary`, `colors.textSecondary`, …), never raw hex.
 * - Text pairs clear WCAG AA 4.5:1; non-text UI/graph pairs clear 3:1.
 *   Enforced by __tests__/colors.test.ts — add new pairs there when you add tokens.
 * - Mood color comes from `stateColors[state]` (soft / ink / accent / tint), never ad hoc.
 */

export const colors = {
  // ---- Surfaces ----------------------------------------------------------
  background: '#FFF8EE',        // app canvas — warm cream
  surface: '#FFFFFF',           // cards / raised surfaces
  surfaceSecondary: '#F7EFE2',  // inputs, wells, nested surfaces

  // ---- Text --------------------------------------------------------------
  textPrimary: '#2B2A26',       // 13.6:1 on background
  textSecondary: '#5A5548',     // 7.0:1
  textMuted: '#6B6453',         // 5.6:1 — still AA, never faint
  onPrimary: '#FFFFFF',

  // ---- Actions -----------------------------------------------------------
  primary: '#245C43',           // deep green — solid buttons, outlines, links (7.8:1 with white)
  primaryPressed: '#1B4A35',
  primarySoft: '#E3F0E8',       // tinted surface (chips, soft highlights)
  secondary: '#E3F0E8',
  secondaryText: '#245C43',

  // ---- Lines & elevation -------------------------------------------------
  border: '#CDBFA6',            // decorative card edges only — never the sole cue for a control
  divider: '#EFE6D6',
  shadow: '#3A2F1E',
  scrim: 'rgba(43,42,38,0.35)', // dims the screen behind a bottom sheet

  // ---- Status ------------------------------------------------------------
  success: '#2F7A52',
  warning: '#8A5A12',
  error: '#A8443A',
  info: '#2F6596',
} as const;

export type ColorName = keyof typeof colors;

/**
 * Per-mood color sets.
 * - `soft`  : tile / surface fill
 * - `ink`   : text and borders on `soft` (and a ≥3:1 outline on the canvas)
 * - `accent`: fill that carries white text; also readable as text on the canvas
 * - `tint`  : bars, slider fill — ≥3:1 on white
 */
export const stateColors = {
  overloaded: { soft: '#DCEBFA', ink: '#1F4E7A', accent: '#3C6E9C', tint: '#5F8FC0' },
  recovering: { soft: '#D6EFDF', ink: '#1F5C3A', accent: '#2F7A52', tint: '#5A9C74' },
  regulated:  { soft: '#FBE7B8', ink: '#6B4A0E', accent: '#8A5A12', tint: '#B8862A' },
  activated:  { soft: '#FAD5C8', ink: '#8A3220', accent: '#A8443A', tint: '#D06A50' },
} as const;

export type CapacityState = keyof typeof stateColors;

/**
 * The garden illustration (src/components/garden/Garden.tsx). Decorative only: no text
 * or control ever sits on these, and the garden has a spoken summary, so they are exempt
 * from the contrast pairs. Mood flowers use `stateColors[mood].tint`.
 */
export const gardenColors = {
  sky: '#FCE3C4',
  skyRest: '#DCE3EE',
  sun: '#F9C97C',
  moon: '#F4F1E8',
  hillBack: '#A8C98A',
  hillFront: '#7FB069',
  grass: '#5E9A4E',
  stream: '#8EC5E8',
  streamDeep: '#5FA6D6',
  trunk: '#8B6B4A',
  leaf: '#4E8B5F',
  leafLight: '#5C9B6B',
  blossom: '#F6C1C9',
  fruit: '#E07A5F',
  bird: '#5A4A3A',
  duck: '#F2D36B',
  flowerHeart: '#FFE08A',
} as const;

/** Soft, consistent elevation for cards and raised surfaces. */
export const elevation = {
  card: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  raised: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
} as const;
