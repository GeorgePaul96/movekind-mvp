import type { ActivityType } from '@/types';
import { colors } from './colors';

export interface ActivityMeta {
  type: ActivityType;
  label: string;
  emoji: string;
  palette: 'sage' | 'blush' | 'sky' | 'warm';
}

export const ACTIVITIES: ActivityMeta[] = [
  { type: 'walk',    label: 'Walk',    emoji: '\u{1F6B6}', palette: 'sage' },
  { type: 'run',     label: 'Run',     emoji: '\u{1F3C3}', palette: 'sky' },
  { type: 'weights', label: 'Weights', emoji: '\u{1F3CB}', palette: 'blush' },
  { type: 'cycle',   label: 'Cycle',   emoji: '\u{1F6B4}', palette: 'sky' },
  { type: 'yoga',    label: 'Yoga',    emoji: '\u{1F9D8}', palette: 'sky' },
  { type: 'swim',    label: 'Swim',    emoji: '\u{1F3CA}', palette: 'sky' },
  { type: 'sport',   label: 'Sport',   emoji: '⚽',    palette: 'warm' },
  { type: 'stretch', label: 'Stretch', emoji: '\u{1F49A}', palette: 'sage' },
  { type: 'other',   label: 'Other',   emoji: '✨',    palette: 'sage' },
];

export const ACTIVITY_BY_TYPE: Record<ActivityType, ActivityMeta> =
  Object.fromEntries(ACTIVITIES.map((a) => [a.type, a])) as Record<
    ActivityType,
    ActivityMeta
  >;

export const PALETTE = {
  sage:  { bg: colors.sageLight,  fg: colors.sage,        text: colors.sageDark  },
  blush: { bg: colors.blushLight, fg: colors.blushAccent, text: colors.blushDark },
  sky:   { bg: colors.skyLight,   fg: colors.skyAccent,   text: colors.skyDark   },
  warm:  { bg: colors.warmLight,  fg: colors.warmAccent,  text: colors.warmDark  },
} as const;

export const MOOD_OPTIONS = [
  'Energized',
  'Calm',
  'Proud',
  'Tired',
  'Strong',
] as const;
