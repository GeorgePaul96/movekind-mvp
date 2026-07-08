/**
 * MoveKind design tokens — the single source of truth for color.
 *
 * Direction: a calm, sage-forward nervous-system palette. Soft sage mist
 * backgrounds, warm near-white surfaces that float on gentle shadow, a deep
 * grounding sage for actions, and desaturated status colors that never alarm.
 *
 * Rules:
 * - Reference SEMANTIC tokens (`colors.primary`, `colors.textSecondary`, …),
 *   never raw hex, in components.
 * - Any color that carries white text must clear WCAG AA (≥4.5:1). The `primary`
 *   and the four `stateColors[*].accent` values are all verified against #FFF.
 * - Legacy keys (`bg`, `ink`, `sage`, …) are kept as aliases so older code keeps
 *   working; they point at the same tokens. Prefer the semantic names.
 */

export const colors = {
  // ---- Surfaces ----------------------------------------------------------
  background: '#EEF2EC',        // app canvas — soft sage mist (never pure white)
  surface: '#FBFCFA',           // cards / raised surfaces — warm near-white
  surfaceSecondary: '#F1F5F0',  // inputs, wells, nested surfaces

  // ---- Text (on background / surface) -----------------------------------
  textPrimary: '#22302A',       // ~12:1 — headings & body
  textSecondary: '#4B5A50',     // ~6:1 — supporting copy
  textMuted: '#6E7C72',         // ~4:1 — hints, captions
  onPrimary: '#FFFFFF',         // text/icons on primary & state accents

  // ---- Brand / actions ---------------------------------------------------
  primary: '#3F7355',           // deep calm sage — main buttons (5.5:1 on white)
  primaryPressed: '#335E45',    // pressed / active
  primarySoft: '#E7F1EA',       // tinted primary surface (soft buttons, chips)
  secondary: '#DDE9E0',         // secondary button surface (soft sage)
  secondaryText: '#2E5540',     // text on secondary

  // ---- Lines & elevation -------------------------------------------------
  border: '#D9E1DA',            // visible on both background and surface
  divider: '#E7EBE5',           // lighter hairline between rows
  shadow: '#26332B',            // deep sage-ink, applied at low opacity

  // ---- Status (calm, desaturated; success/error/info clear AA on white) --
  success: '#3E8060',
  warning: '#8A6420',           // dark enough to read as text on light surfaces
  error: '#B5544E',             // muted terracotta, not fire-engine red
  info: '#4F7BA6',

  // ---- Legacy aliases (older references; prefer semantic names above) ----
  bg: '#EEF2EC',                // → background
  ink: '#22302A',               // → textPrimary
  muted: '#4B5A50',             // → textSecondary
  hint: '#6E7C72',              // → textMuted
  sage: '#3F7355',              // → primary
  sageDark: '#2E5540',          // deep sage (accessible active)
  sageMid: '#A9CDB6',
  sageLight: '#E7F1EA',         // → primarySoft
  blush: '#E7A896',
  blushLight: '#F8E7E1',
  blushDark: '#8B5E52',
  blushAccent: '#B5544E',
  sky: '#BCD3EA',
  skyLight: '#E8F0F8',
  skyDark: '#3C6E9C',
  skyAccent: '#3C6E9C',
  warm: '#E4CFA8',
  warmLight: '#F6EEDD',
  warmDark: '#7A5A24',
  warmAccent: '#986A2C',
} as const;

export type ColorName = keyof typeof colors;

/**
 * Per-capacity-state color sets.
 * - `tint`  : soft fill for non-text surfaces (slider fill, distribution bars)
 * - `soft`  : very light surface behind state content
 * - `accent`: WCAG-AA against white — safe for buttons/chips with white text,
 *             and dark enough to read as colored text on a light surface
 */
export const stateColors = {
  overloaded: { tint: '#BCD3EA', soft: '#E8F0F8', accent: '#3C6E9C' },
  recovering: { tint: '#A9CDB6', soft: '#E7F1EA', accent: '#3F7355' },
  regulated:  { tint: '#E4CFA8', soft: '#F6EEDD', accent: '#986A2C' },
  activated:  { tint: '#E7A896', soft: '#F8E7E1', accent: '#B5544E' },
} as const;

export type CapacityState = keyof typeof stateColors;

/** Soft, consistent elevation for cards and raised surfaces. */
export const elevation = {
  card: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  raised: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
} as const;
