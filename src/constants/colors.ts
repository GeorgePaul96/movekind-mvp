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
 * - Legacy keys (`bg`, `ink`, `sage`, …) are aliases kept only until every file has
 *   migrated; they are removed in the final redesign task.
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

  // ---- Status ------------------------------------------------------------
  success: '#2F7A52',
  warning: '#8A5A12',
  error: '#A8443A',
  info: '#2F6596',

  // ---- Legacy aliases (removed in Task 11) -------------------------------
  bg: '#FFF8EE',
  ink: '#2B2A26',
  muted: '#5A5548',
  hint: '#6B6453',
  sage: '#245C43',
  sageDark: '#245C43',
  sageMid: '#5A9C74',
  sageLight: '#E3F0E8',
  blush: '#D06A50',
  blushLight: '#FAD5C8',
  blushDark: '#8A3220',
  blushAccent: '#A8443A',
  sky: '#5F8FC0',
  skyLight: '#DCEBFA',
  skyDark: '#1F4E7A',
  skyAccent: '#3C6E9C',
  warm: '#B8862A',
  warmLight: '#FBE7B8',
  warmDark: '#6B4A0E',
  warmAccent: '#8A5A12',
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
