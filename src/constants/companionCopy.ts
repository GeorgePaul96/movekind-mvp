import type { Pace, PaceReason } from '@/domain/home/companion';
import type { PauseKind } from '@/types';

/**
 * Copy for the day's shape: its pace, pauses, "same as yesterday" and closing the day.
 * Re-exported from copy.ts. A pace describes the day; it never sets a target, and nothing
 * here tells anyone how to move or what to eat.
 */
export const COMPANION_COPY = {
  paceLabel: (name: string) => `Today's pace: ${name}`,
  paceNames: { rest: 'Rest', gentle: 'Gentle', steady: 'Steady', bright: 'Bright' } as Record<Pace, string>,
  paceWhy: 'Read from last night and how you feel. It changes if they do.',
  /** The line under the greeting, by pace and why. */
  line: (pace: Pace, reason: PaceReason): string => {
    if (reason === 'short-night') return 'A short night. Today can be a small day.';
    if (reason === 'low-mood') return 'Running low. Small and slow is plenty today.';
    if (reason === 'mixed') return 'Body and mind are on different pages. Half pace is a fine pace.';
    if (pace === 'gentle') return 'An easy-does-it day. Whatever you manage counts.';
    if (pace === 'bright') return 'Rested and bright. Enjoy it while it is here.';
    return 'A steady day. You are in your own rhythm.';
  },

  pauseTitle: 'Or is today one of these?',
  pauseBody: 'Setting the day aside keeps only water and rest on your homepage.',
  pauses: {
    unwell: 'Unwell',
    overwhelmed: 'Overwhelmed',
    travelling: 'Travelling',
    resting: 'Resting',
  } as Record<PauseKind, string>,
  pauseLine: {
    unwell: 'Today is for getting better. Nothing here needs doing.',
    overwhelmed: 'A lot on your plate. Water and rest are plenty today.',
    travelling: 'On the move. Note what is easy and leave the rest.',
    resting: 'A rest day. That is looking after yourself too.',
  } as Record<PauseKind, string>,
  pausedBanner: (kind: string) => `Today is set aside: ${kind.toLowerCase()}.`,
  pausedShowAll: 'Show everything',
  pausedShowLess: 'Just water and rest',
  pauseEnd: 'End the pause',

  sameTitle: 'Same as yesterday?',
  sameMeals: (names: string) => `Yesterday: ${names}`,
  sameMealsA11y: "Use yesterday's meals",
  sameKcal: (n: number) => `Yesterday: ${n.toLocaleString()}`,
  sameKcalA11y: "Use yesterday's calories",
  sameWorkoutA11y: (entry: string) => `Add ${entry} again`,
  again: (entry: string) => `${entry} again`,

  closeTitle: 'Ready to wrap up?',
  closeBody: 'Wrap today up. You get a short note of what you did, and the numbers are put away until morning.',
  closeButton: 'Close the day',
  closedTitle: 'Today is done.',
  closedTitleRest: 'You looked after your energy today.',
  closedLine: 'The numbers are put away for the night. Tomorrow starts fresh.',
  reopen: 'Reopen today',
  did: {
    mood: 'Checked in with how you feel.',
    water: (n: number) => (n === 1 ? 'Drank a glass of water.' : `Drank about ${n} glasses of water.`),
    meals: (names: string) => `Ate: ${names}.`,
    movement: (m: number) => `Moved for ${m} minutes.`,
    sleep: (h: number) => (h === 1 ? 'Slept 1 hour last night.' : `Slept ${h} hours last night.`),
    good: (text: string) => `Kept one good thing: ${text}`,
    nothing: 'A quiet day. Stopping by to close it still counts.',
  },
} as const;
