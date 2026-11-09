import { stateColors, type CapacityState } from '@/constants/colors';
import type { YardMood } from '@/types';

export const YARD_MOODS: readonly YardMood[] = ['tired', 'low', 'frustrated', 'steady', 'buzzing'];

export interface YardMoodPose {
  mood: YardMood | null;
  posture: 'sitting' | 'lying';
  ears: 'neutral' | 'soft' | 'back' | 'perk';
  earAngleDeg: number;
  eyelids: 'open' | 'half';
  brows: 'none' | 'worried';
  pupilOffsetY: number;
  headTiltDeg: number;
  headDropY: number;
  /** Tail wag period in seconds. Never faster than 0.3s. */
  tailPeriodSec: number;
  tailDegrees: number;
  breatheRate: number;
  bounceAmp: number;
  tongue: boolean;
  smile: boolean;
  scribbleCloud: boolean;
  twinkles: boolean;
}

const POSES: Record<YardMood, YardMoodPose> = {
  tired: {
    mood: 'tired',
    posture: 'lying',
    ears: 'soft',
    earAngleDeg: 14,
    eyelids: 'half',
    brows: 'none',
    pupilOffsetY: 1,
    headTiltDeg: -5,
    headDropY: 8,
    tailPeriodSec: 3.6,
    tailDegrees: 4,
    breatheRate: 1.1,
    bounceAmp: 0,
    tongue: false,
    smile: false,
    scribbleCloud: false,
    twinkles: false,
  },
  low: {
    mood: 'low',
    posture: 'sitting',
    ears: 'soft',
    earAngleDeg: 10,
    eyelids: 'open',
    brows: 'none',
    pupilOffsetY: 2,
    headTiltDeg: 7,
    headDropY: 5,
    tailPeriodSec: 4.2,
    tailDegrees: 5,
    breatheRate: 1.5,
    bounceAmp: 0,
    tongue: false,
    smile: false,
    scribbleCloud: false,
    twinkles: false,
  },
  frustrated: {
    mood: 'frustrated',
    posture: 'sitting',
    ears: 'back',
    earAngleDeg: -12,
    eyelids: 'open',
    brows: 'worried',
    pupilOffsetY: 0,
    headTiltDeg: 0,
    headDropY: 0,
    tailPeriodSec: 2.2,
    tailDegrees: 9,
    breatheRate: 2.2,
    bounceAmp: 0,
    tongue: false,
    smile: false,
    scribbleCloud: true,
    twinkles: false,
  },
  steady: {
    mood: 'steady',
    posture: 'sitting',
    ears: 'neutral',
    earAngleDeg: 0,
    eyelids: 'open',
    brows: 'none',
    pupilOffsetY: 0,
    headTiltDeg: 0,
    headDropY: 0,
    tailPeriodSec: 1.5,
    tailDegrees: 14,
    breatheRate: 1.8,
    bounceAmp: 0,
    tongue: false,
    smile: true,
    scribbleCloud: false,
    twinkles: false,
  },
  buzzing: {
    mood: 'buzzing',
    posture: 'sitting',
    ears: 'perk',
    earAngleDeg: -8,
    eyelids: 'open',
    brows: 'none',
    pupilOffsetY: 0,
    headTiltDeg: -3,
    headDropY: -2,
    tailPeriodSec: 0.34, // Fast but never faster than 0.3s
    tailDegrees: 22,
    breatheRate: 2.6,
    bounceAmp: 5,
    tongue: true,
    smile: true,
    scribbleCloud: false,
    twinkles: true,
  },
};

const NEUTRAL_POSE: YardMoodPose = {
  mood: null,
  posture: 'sitting',
  ears: 'neutral',
  earAngleDeg: 0,
  eyelids: 'open',
  brows: 'none',
  pupilOffsetY: 0,
  headTiltDeg: 0,
  headDropY: 0,
  tailPeriodSec: 1.8,
  tailDegrees: 10,
  breatheRate: 1.8,
  bounceAmp: 0,
  tongue: false,
  smile: true,
  scribbleCloud: false,
  twinkles: false,
};

/** Pure function mapping today's mood (or null when skipped/unpicked) to Maple's pose. */
export function mapleMoodPose(mood: YardMood | null | undefined): YardMoodPose {
  if (!mood) return NEUTRAL_POSE;
  return POSES[mood] ?? NEUTRAL_POSE;
}

/** Maps each of the five yard moods to its Sage design token color set. */
export function yardMoodColors(mood: YardMood) {
  const map: Record<YardMood, CapacityState> = {
    tired: 'overloaded',
    low: 'recovering',
    frustrated: 'activated',
    steady: 'regulated',
    buzzing: 'buzzing',
  };
  return stateColors[map[mood]];
}

/**
 * Each pet while frustrated softens the scribble cloud opacity until it fades completely.
 * No counter or progress ring is ever shown.
 */
export function frustratedCloudOpacity(mood: YardMood | null | undefined, petCount: number): number {
  if (mood !== 'frustrated') return 0;
  return Math.max(0, 1 - petCount * 0.35);
}