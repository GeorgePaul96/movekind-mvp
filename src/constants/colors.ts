/**
 * MoveKind design tokens - "Sage". The single source of truth for color.
 *
 * Misty sage canvas, white cards with faint green rings, deep forest-green actions,
 * distinct mood colours. Calm, but every action is solid or clearly outlined.
 */

export const colors = {
  // ---- Surfaces ----------------------------------------------------------
  background: '#F6FAF5',
  surface: '#FFFFFF',
  surfaceSecondary: '#EEF4EF',
  inverse: '#2D322E',
  onInverse: '#FFFFFF',
  onInverseSoft: 'rgba(255,255,255,0.12)',

  // ---- Text --------------------------------------------------------------
  textPrimary: '#181D1A',
  textSecondary: '#404943',
  textMuted: '#5A635D',
  onPrimary: '#FFFFFF',

  // ---- Actions -----------------------------------------------------------
  primary: '#20684A',
  primaryPressed: '#185239',
  primarySoft: '#DCEFE3',
  secondary: '#DCEFE3',
  secondaryText: '#20684A',
  sage: '#599E7C',

  // ---- Warmth (the simple home) -------------------------------------------
  /** Honey fill for things cared for today, and the greeting card. */
  warm: '#FBE7C6',
  /** Text and icons on `warm`. */
  warmInk: '#74470A',

  // ---- Lines & elevation -------------------------------------------------
  border: '#BFC9C1',
  ring: 'rgba(89,158,124,0.16)',
  divider: '#E5E9E4',
  shadow: '#244434',
  scrim: 'rgba(24,29,26,0.35)',

  // ---- Status ------------------------------------------------------------
  success: '#2F7A52',
  warning: '#8A5A12',
  error: '#A8443A',
  info: '#2F6596',
} as const;

export type ColorName = keyof typeof colors;

/**
 * One colour world per check-in page, so each feels like its own small place.
 * - `bg`   : the whole page
 * - `ink`  : headings, text and solid buttons on `bg`
 * - `soft` : an unselected choice tile (carries `ink` text)
 * - `onInk`: text on a solid `ink` button or a selected tile
 * - `glow` : a large decorative shape behind the content
 * Every text pair is contrast-tested in __tests__/colors.test.ts.
 */
export const flowThemes = {
  mood: { bg: '#FBE7C6', ink: '#74470A', soft: '#FFF8EA', onInk: '#FFF8EA', glow: '#F7D49A' },
  water: { bg: '#DDEFF8', ink: '#0F4C6B', soft: '#F4FAFD', onInk: '#F4FAFD', glow: '#B9DDF0' },
  food: { bg: '#FCE3D8', ink: '#7A2E12', soft: '#FFF6F1', onInk: '#FFF6F1', glow: '#F8C7B2' },
  movement: { bg: '#DCEFE3', ink: '#185239', soft: '#F5FBF7', onInk: '#F5FBF7', glow: '#B8DFC7' },
  sleep: { bg: '#22304A', ink: '#F2F4FA', soft: '#33425F', onInk: '#22304A', glow: '#2C3D5E' },
} as const;

/**
 * The greeting card takes the colour of the day's pace, so the home itself changes with
 * how the person slept and feels. All carry `textPrimary` and `textSecondary` (tested).
 */
export const paceColors = {
  rest: '#E3E5FA', // a quiet twilight
  gentle: '#DCEFE3', // soft sage
  steady: '#FBE7C6', // warm honey
  bright: '#F9DCA4', // fuller amber
} as const;

/** The four inks of the Ink game. Each is readable as large text on `surface` (tested). */
export const gameInks = {
  red: '#B23A2E',
  blue: '#2456B8',
  green: '#1F7A46',
  purple: '#7A3FA8',
} as const;

export type FlowThemeName = keyof typeof flowThemes;
export type FlowTheme = (typeof flowThemes)[FlowThemeName];

/**
 * Per-mood color sets. Distinct hues so no two moods can be confused.
 * - `soft`  : tile / surface fill
 * - `ink`   : text and borders on `soft` (and a >=3:1 outline on the canvas)
 * - `accent`: fill that carries white text; also readable as text on the canvas
 * - `tint`  : flowers, dots - >=3:1 on white
 */
export const stateColors = {
  overloaded: { soft: '#E3E5FA', ink: '#363C8C', accent: '#4C54B6', tint: '#6F78D8' },
  recovering: { soft: '#D5EEE0', ink: '#1F5C3A', accent: '#2F7A52', tint: '#3F9468' },
  regulated:  { soft: '#FBEBC4', ink: '#6B4A0E', accent: '#8A5A12', tint: '#B07A1C' },
  activated:  { soft: '#FAD9D1', ink: '#8A3220', accent: '#A8443A', tint: '#D0573F' },
  buzzing:    { soft: '#FFF3C4', ink: '#5C4300', accent: '#7D5B00', tint: '#9E7300' },
} as const;

export type CapacityState = keyof typeof stateColors;

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

export type YardLight = 'dawn' | 'day' | 'dusk' | 'night' | 'rain';

/**
 * Decorative tokens for Maple's back-yard scene (src/components/yard).
 * Exempt from text contrast pairs because no text sits directly on scene drawings.
 */
export const yardColors = {
  sky: {
    dawn: { top: '#FBDCCB', low: '#FFF1E2' },
    day: { top: '#E4F1EE', low: '#F3F8EC' },
    dusk: { top: '#F2C29C', low: '#E9D6EE' },
    night: { top: '#26332C', low: '#3A4A40' },
    rain: { top: '#C6D4CF', low: '#E3EBE7' },
  },
  hill: {
    dawn: { back: '#C7E6D1', front: '#A6D6B7' },
    day: { back: '#BFE3CC', front: '#9ED3B2' },
    dusk: { back: '#9BC2AC', front: '#82B095' },
    night: { back: '#3F5A4A', front: '#4C6B57' },
    rain: { back: '#AEC7B8', front: '#94B3A1' },
  },
  lawn: {
    dawn: { top: '#B4DFB8', low: '#95CE9E' },
    day: { top: '#A8D9B6', low: '#8FCB9F' },
    dusk: { top: '#8AB899', low: '#73A384' },
    night: { top: '#355243', low: '#2A4336' },
    rain: { top: '#94C0A4', low: '#7FA98E' },
  },
  fence: {
    wood: '#F3EBDD',
    rail: '#E7DAC4',
    stroke: '#D9CBB2',
    nightWood: '#6E7871',
    nightStroke: '#525C56',
  },
  path: {
    stone: '#E9DFC9',
    stroke: '#D5C7AC',
    nightStone: '#54635B',
  },
  tree: {
    trunk: '#9A7B5A',
    shade: '#4A9E6F',
    leaf: '#5FB585',
    light: '#8ED3A8',
    blossom: '#F6C1C9',
    fruit: '#EE7A63',
  },
  cushion: {
    base: '#A9C0DD',
    plaid: '#C3D4EA',
    stripe: '#7E9CC0',
    rim: '#6B88AD',
  },
  maple: {
    coat: '#E8A954',
    coatShade: '#C98838',
    chest: '#F8DFB0',
    ear: '#BF7B2C',
    nose: '#3A2A20',
    tongue: '#E87A86',
    cheek: '#F2A08E',
    collar: '#20684A',
    tag: '#F2B84B',
    tagStroke: '#C98A22',
    cloudFill: '#D9E0DC',
    cloudStroke: '#6D7A73',
    heart: '#E06377',
    twinkle: '#E0B400',
  },
  pudding: {
    fawn: '#D8B08C',
    fawnShade: '#B8906C',
    white: '#F4EDE4',
    belly: '#F7E1E6',
    spot: '#C79F7C',
    ear: '#8E6A4E',
    jowl: '#C9A382',
    nose: '#3A2A20',
    tongue: '#E87A86',
    toeBean: '#F29BB0',
    collar: '#C84B39',
    tag: '#F2B84B',
  },
  waterBowl: {
    body: '#4F8FC0',
    rim: '#6BB6D9',
    water: '#A9D8EE',
    ripple: '#FFFFFF',
  },
  foodBowl: {
    body: '#D0573F',
    rim: '#EE7A63',
    inside: '#8A4B2E',
    kibble: '#9A6A3A',
    kibbleLight: '#B88450',
    emblem: '#FBD3C8',
  },
  ball: {
    fill: '#D7E36A',
    seam: '#FFFFFF',
  },
  flower: {
    stem: '#4E9A6F',
    center: '#FFE08A',
    pink: '#F6C1C9',
    lilac: '#B9C0F0',
    butter: '#FFE08A',
    coral: '#F5A691',
  },
  outline: '#2C221E',
  shadow: 'rgba(36, 68, 52, 0.16)',
} as const;

export const parkColors = {
  outline: yardColors.outline,
  shadow: yardColors.shadow,
} as const;