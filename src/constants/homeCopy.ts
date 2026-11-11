import type { YardMood } from '@/types';

/** Copy for the simple home. Re-exported from copy.ts. Warm, plain, never a target or a tally of what is missing. */
export const HOME_COPY = {
  tabs: {
    today: 'Today',
    changes: 'Changes',
    insights: 'Insights',
    you: 'You',
  },
  tabA11y: (label: string) => `${label} tab`,
  greeting: (partOfDay: string, name?: string | null) => (name ? `Good ${partOfDay}, ${name}` : `Good ${partOfDay}`),
  /** The kind line under the greeting, before a mood is picked. */
  welcome: {
    morning: 'No rush. Start wherever you like.',
    afternoon: 'Glad you stopped by. Anything you note here is enough.',
    evening: 'The day is winding down. Be easy on yourself.',
  } as Record<string, string>,
  /** The kind line once a mood is picked. */
  moodLine: {
    tired: 'Tired is allowed. Small and slow counts today.',
    low: 'Low days happen. You showed up, and that matters.',
    frustrated: 'A busy head is heavy. One thing at a time.',
    steady: 'Steady is a good place to be.',
    buzzing: 'Lovely. Enjoy the energy while it is here.',
  } as Record<YardMood, string>,
  unwellLine: 'Today is for resting. Nothing here needs doing.',

  careTitle: 'Cared for today',
  care: {
    mood: 'Mood',
    water: 'Water',
    food: 'Food',
    movement: 'Movement',
    sleep: 'Sleep',
  },
  careA11y: (label: string, done: boolean) => (done ? `${label}: noted today` : `${label}: not noted yet`),

  startFlow: "Start today's check-in",
  continueFlow: 'Go through today again',
  todayTitle: 'Your day so far',
  edit: 'Edit',
  add: 'Add',
  editA11y: (label: string) => `Edit ${label.toLowerCase()}`,
  notYet: 'Not noted yet',
  summary: {
    mood: (label: string, unwell: boolean) => (unwell ? `${label}, and feeling unwell` : label),
    meals: (names: string[]) => names.join(', '),
    kcal: (n: number) => `${n.toLocaleString()} kcal`,
    movement: (count: number, minutes: number) =>
      count === 1 ? `1 entry, ${minutes} min` : `${count} entries, ${minutes} min`,
    sleep: (hours: number, feel?: string) =>
      `${hours === 1 ? '1 hour' : `${hours} hours`}${feel ? `, ${feel.toLowerCase()}` : ''}`,
  },
  goodEdit: 'Change it',
  goodKept: 'Kept for today',

  monthTitle: 'Looking back',
  monthBody: 'The warmer the day, the more you noted. Tap a day to see it.',
  monthDayA11y: (date: string, count: number) =>
    count === 0 ? `${date}: nothing noted` : `${date}: ${count} ${count === 1 ? 'thing' : 'things'} noted`,
  monthNothing: 'Nothing noted that day. Rest days are part of it.',
  monthDay: (d: Date) => d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }),
  weekdays: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],

  moodTitle: 'How are you feeling?',
  unwell: 'Feeling unwell today',
  waterTitle: 'Water',
  waterAdd: '+1 glass',
  waterUndo: 'Undo',
  waterUndoA11y: 'Undo the last glass',
  foodTitle: 'Food',
  foodBody: 'Just which meals. Never what, or how much.',
  movementTitle: 'Movement',
  movementBody: 'Anything counts, anywhere you did it.',
  movementMinutes: 'About how many minutes?',
  movementAdd: 'Add movement',
  sleepTitle: 'Sleep',
  sleepBody: 'Last night, roughly.',
  sleepHours: (h: number) => (h === 1 ? '1 hour' : `${h} hours`),
  sleepLess: 'Less',
  sleepMore: 'More',
  sleepLessA11y: 'Half an hour less',
  sleepMoreA11y: 'Half an hour more',
  sleepSave: 'Save sleep',
  sleepSaved: (h: number) => `Saved: ${h === 1 ? '1 hour' : `${h} hours`} last night.`,
  stepsTitle: 'Steps',
  saved: 'Saved.',

  goodTitle: 'One good thing',
  goodBody: 'Anything, however small. A warm drink, a message from a friend, the light this morning.',
  goodLabel: 'One good thing about today',
  goodPlaceholder: 'Today I liked...',
  goodSave: 'Keep this',
  goodEarlier: 'Earlier good things',
  goodDay: (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }),

  breathTitle: 'A slow breath',
  breathBody:
    'Sit, stand or lie down, whatever is comfortable. Breathe in through your nose and out through your mouth, gently, only as deep as feels easy.',
  breathMinutes: (m: number) => (m === 1 ? '1 minute' : `${m} minutes`),
  breathStart: 'Begin',
  breathStop: 'Stop',
  breathIn: 'Breathe in',
  breathOut: 'Breathe out',
  breathCount: (n: number) => `${n}`,
  breathDone: 'Done. Nicely breathed.',
  breathCare: 'If you feel dizzy or uncomfortable, stop and breathe normally.',

  yardTitle: "Maple's yard",
  yardLabel: "Use Maple's yard as home",
  yardBody: 'An early look at the illustrated yard with Maple and Pudding. Still being drawn. You can switch back here any time.',
} as const;
