import type { UserState, WorkoutType } from '@/types';

export const ERROR_FALLBACK = {
  title: 'Something needed a pause',
  body: "The app hit a snag, and it's nothing you did. Your progress is safe, and a fresh start is one tap away.",
  action: 'Start fresh',
} as const;

/** The four moods. `flavor` is the small word in the tile's corner; every mood is equally welcome. */
export const MOOD_COPY: Record<UserState, { label: string; flavor: string }> = {
  overloaded: { label: 'Running on empty', flavor: 'rest' },
  recovering: { label: 'A bit low', flavor: 'gentle' },
  regulated: { label: 'Steady', flavor: 'calm' },
  activated: { label: 'Buzzing', flavor: 'bright' },
};

export const CHECKIN_COPY = {
  saveFailed: "Couldn't save that. Tap to try again.",
} as const;

export const ONBOARDING_COPY = {
  nameTag: 'Welcome to MoveKind',
  nameTitle: 'What should we call you?',
  nameSubtitle: 'Optional. It stays on this phone, and there are no accounts.',
  namePlaceholder: 'Your name',
} as const;

export const PROFILE_COPY = {
  nameLabel: 'Name',
  namePlaceholder: 'Your name',
  savedTitle: 'Saved',
  savedBody: 'Your name is updated.',
  saveFailedTitle: 'Could not save',
  dataTitle: 'Your data',
  localNote:
    "Everything you log stays on this phone. There's no account and nothing is sent to a server. Deleting the app deletes your data.",
  eraseButton: 'Erase all my data',
  eraseTitle: 'Erase all your data?',
  eraseBody: 'This deletes your garden and everything you logged on this phone. It cannot be undone.',
  eraseConfirm: 'Erase everything',
  cancel: 'Cancel',
} as const;

export function checkInPrompt(name?: string | null): string {
  return name ? `How's your energy, ${name}?` : "How's your energy?";
}

// ---- Garden ---------------------------------------------------------------

const STREAM_LINE = [
  'A gentle trickle runs through your garden',
  'Your stream is flowing',
  'Your stream is lively, with ducks paddling',
  'Your stream is full and sparkling, with ducks',
  'Your stream is brimming, ducks everywhere',
] as const;
const GRASS_LINE = ['the grass is soft and short', 'the grass is growing', 'the grass is tall and green', 'the grass is lush'] as const;
const TREE_LINE = [
  'a sprout is waiting for its first workout',
  'a sapling is growing',
  'a young tree stands tall',
  'birds sing in your tree',
  'your tree is blossoming',
  'your tree has fruit',
  'two trees bear fruit side by side',
] as const;

export const GARDEN_COPY = {
  greeting: (partOfDay: string, name?: string | null) =>
    name ? `Good ${partOfDay}, ${name}` : `Good ${partOfDay}`,
  title: 'Your garden',
  brand: 'MoveKind',
  tag: 'Garden haven',
  tagFirstWeek: 'A quiet start',
  subtitle: 'Your garden is growing',
  subtitleResting: 'Your garden rested while you were away. Welcome back.',
  welcomeTitle: 'Welcome to your beginning',
  welcomeNoStreaks: 'No daily minimums or streaks. Log what you did, whenever you like.',
  moodTitle: 'How are you feeling?',
  moodAside: 'Check-in',
  careTitle: "Today's care",
  defaultNote: 'Everything you log helps your garden grow.',
  water: 'Water',
  glasses: (n: number) => (n === 1 ? '1 glass' : `${n} glasses`),
  waterA11y: (n: number) => `Add a glass of water. ${n === 1 ? '1 glass' : `${n} glasses`} today.`,
  undoGlass: 'Undo last glass',
  glassesUnit: (n: number) => (n === 1 ? 'glass' : 'glasses'),
  waterTap: 'Tap to add one',
  waterNote: 'Nourished',
  workoutUnit: 'Any movement',
  workoutToday: (minutes: number) => `${minutes} min`,
  workoutTodayUnit: 'today',
  workoutNote: 'Tree growing',
  stepsUnit: 'steps',
  workout: 'Workout',
  logOne: 'Log one',
  workoutA11y: 'Log a workout',
  steps: 'Steps',
  stepsSoon: 'Arrive soon',
  stepsHint: 'Your phone will count steps for you in the next update.',
  todayMood: (label: string) => `Today: ${label}`,
  changeMood: 'Change',
  todayWorkouts: 'Today',
  /** What a screen reader says about the garden. Never negative, whatever the state. */
  a11ySummary(s: { stream: number; grass: number; tree: number; flowers: unknown[]; resting: boolean }): string {
    const flowers =
      s.flowers.length === 0 ? '' : s.flowers.length === 1 ? ' One flower blooms.' : ` ${s.flowers.length} flowers bloom.`;
    const rest = s.resting ? 'Your garden is resting under the moon. ' : '';
    return `${rest}${STREAM_LINE[s.stream]}, ${GRASS_LINE[s.grass - 1]}, and ${TREE_LINE[s.tree]}.${flowers}`;
  },
} as const;

export const WORKOUT_COPY = {
  title: 'What did you do?',
  subtitle: 'Any movement counts. Stretches, strolling, or dancing in your kitchen.',
  lengthTitle: 'About how many minutes?',
  save: 'Add to my garden',
  update: 'Save changes',
  cancel: 'Not now',
  types: {
    walk: '🚶 Walk',
    run: '🏃 Run',
    yoga: '🧘 Yoga',
    gym: '🏋️ Gym',
    cycle: '🚴 Cycle',
    sport: '⚽ Sport',
    dance: '💃 Dance',
    other: '✨ Other',
  } as Record<WorkoutType, string>,
  names: {
    walk: 'Walk', run: 'Run', yoga: 'Yoga', gym: 'Gym', cycle: 'Cycle', sport: 'Sport', dance: 'Dance', other: 'Other',
  } as Record<WorkoutType, string>,
  durations: [10, 20, 30, 45, 60] as const,
  minutes: (m: number) => (m >= 60 ? '1 hr+' : `${m} min`),
  /** Short chip label; the question above says "minutes". */
  durationChip: (m: number) => (m >= 60 ? '60+' : String(m)),
  durationA11y: (m: number) => (m >= 60 ? 'An hour or more' : `${m} minutes`),
  entry: (type: WorkoutType, m: number) => `${WORKOUT_COPY.names[type]} · ${WORKOUT_COPY.minutes(m)}`,
  edit: 'Edit',
  delete: 'Delete',
  editA11y: (type: WorkoutType, m: number) => `Edit ${WORKOUT_COPY.entry(type, m)}`,
  deleteA11y: (type: WorkoutType, m: number) => `Delete ${WORKOUT_COPY.entry(type, m)}`,
};

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** The Changes tab. Ups are celebrated; quieter weeks are named gently and never counted. */
export const CHANGES_COPY = {
  tag: 'Your garden over time',
  title: 'Changes',
  linesTitle: 'This week',
  welcome: 'Your first week. Everything you log from here helps your garden grow.',
  stepsUp: (perDay: number) => `You walked about ${perDay.toLocaleString()} more steps a day than last week.`,
  stepsSame: 'Your steps are as steady as last week.',
  stepsQuieter: 'A gentler week for walking. Your grass grows back every morning.',
  workoutsUp: (n: number, more: number) =>
    `You logged ${n} ${plural(n, 'workout', 'workouts')} this week, ${more} more than last week.`,
  workoutsSame: 'Same number of workouts as last week. Steady counts.',
  workoutsQuieter: 'A quieter week for workouts. Your tree keeps everything it has grown.',
  waterUp: 'You drank more water this week than last.',
  waterSame: 'Your water is as steady as last week.',
  waterQuieter: 'A lighter week for water. Your stream keeps flowing.',
  checkinsUp: (n: number) => `You checked in on ${n} ${plural(n, 'day', 'days')} this week, more than last week.`,
  checkinsSame: 'You checked in as often as last week.',
  checkinsQuieter: 'A quieter week for check-ins. Every flower you planted is still blooming.',
  compareTitle: 'Look how it has grown',
  then: 'A month ago',
  now: 'Today',
  flowerbedTitle: 'How your weeks felt',
  weekOf: (d: Date) => `Week of ${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`,
  emptyWeek: 'No flowers this week',
} as const;

export const REMINDER_COPY = {
  body: 'Your garden is here whenever you are. A glass of water counts.',
} as const;

/** The Me tab. */
export const ME_COPY = {
  tag: 'Me',
  reminderTitle: 'Daily reminder',
  reminderLabel: 'Daily reminder at 9am',
  reminderBody: 'One gentle note each morning. Off unless you turn it on.',
  reminderDenied: "Notifications are off for MoveKind in your phone's settings, so the reminder can't be sent.",
} as const;

/** The one screen after the name: how the garden grows. */
export const GARDEN_INTRO_COPY = {
  tag: 'Your garden',
  title: 'A garden that grows with you',
  lines: [
    { emoji: '💧', text: 'Water makes the stream flow' },
    { emoji: '👣', text: 'Steps grow the grass' },
    { emoji: '🌳', text: 'Workouts grow the tree' },
    { emoji: '🌸', text: 'Each mood check-in plants a flower' },
  ],
  promise: 'Nothing ever wilts. If you are away, your garden simply rests until you are back.',
  start: 'Start my garden',
  next: 'Continue',
} as const;

/** The Steps button and its week view. Counts are shown plainly, never against a target. */
export const STEPS_COPY = {
  checking: 'Checking',
  allow: 'Tap to allow',
  allowHint: 'Lets MoveKind read your step count from this phone. Steps stay on this phone.',
  off: 'Off',
  offHint: 'Step access is off. You can turn on Motion and Fitness for MoveKind in your phone settings.',
  unavailable: 'Not on this phone',
  unavailableHint: "This phone doesn't share a step count with MoveKind.",
  weekHint: 'Opens your steps for the week',
  weekTitle: 'Your steps this week',
  close: 'Close',
  day: (d: Date) => d.toLocaleDateString(undefined, { weekday: 'long' }),
  count: (n: number) => n.toLocaleString(),
} as const;

/** Small status pills on the garden card, and captions for the then-and-now cards. */
export const BADGE_COPY = {
  resting: 'Resting under the moon',
  stream: ['Soft breeze', 'Stream flowing', 'Ducks visiting', 'Ducks visiting', 'Stream sparkling'],
  tree: ['Young sprout', 'Sapling growing', 'Young tree', 'Birds nesting', 'In blossom', 'Fruit ripening', 'Two trees thriving'],
  caption: [
    'A tiny sprout',
    'A growing sapling',
    'A young tree',
    'A tree with birds',
    'A tree in blossom',
    'A tree full of fruit',
    'Two trees, full of fruit',
  ],
  /** What logging a workout will grow (index = the stage it reaches). */
  growth: [
    '',
    'This will turn your sprout into a sapling.',
    'This will grow your sapling into a young tree.',
    'This will bring birds to your tree.',
    'This will make your tree blossom.',
    'This will bring fruit to your tree.',
    'This will grow a second tree.',
  ],
  growthMore: 'This helps your tree grow a little more.',
  growthFull: 'This keeps your two trees thriving.',
} as const;
