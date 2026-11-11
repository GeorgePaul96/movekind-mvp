import type { Meal, SleepLog, UserState, WorkoutType, YardMood } from '@/types';

export { BODY_COPY, INSIGHTS_COPY } from '@/constants/bodyCopy';
export { HOME_COPY } from '@/constants/homeCopy';
export { FLOW_COPY } from '@/constants/flowCopy';

export const ERROR_FALLBACK = {
  title: 'Something needed a pause',
  body: "The app hit a snag, and it's nothing you did. Your progress is safe, and a fresh start is one tap away.",
  action: 'Start fresh',
} as const;

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
  reassureTitle: 'No streaks, no pressure',
  reassureBody: 'Come by whenever you like. Nothing here is ever behind.',
  skip: 'Skip for now',
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
  a11ySummary(s: { stream: number; grass: number; tree: number; flowers: unknown[]; resting: boolean; weather?: 'clear' | 'rain' }): string {
    const flowers =
      s.flowers.length === 0 ? '' : s.flowers.length === 1 ? ' One flower blooms.' : ` ${s.flowers.length} flowers bloom.`;
    const rest = s.resting ? 'Your garden is resting under the moon. ' : '';
    const rain = s.weather === 'rain' ? 'Gentle rain is falling and the garden is drinking it in. ' : '';
    return `${rain}${rest}${STREAM_LINE[s.stream]}, ${GRASS_LINE[s.grass - 1]}, and ${TREE_LINE[s.tree]}.${flowers}`;
  },
} as const;

export const WORKOUT_COPY = {
  title: 'What did you get up to today?',
  subtitle: 'Anything counts, anywhere you did it.',
  lengthTitle: 'About how many minutes?',
  save: 'Add to my garden',
  update: 'Save changes',
  cancel: 'Not now',
  types: {
    walk: 'Walk',
    run: 'Run',
    yoga: 'Yoga',
    gym: 'Gym',
    cycle: 'Cycle',
    sport: 'Sport',
    dance: 'Dance',
    other: 'Other',
  } as Record<WorkoutType, string>,
  names: {
    walk: 'Walk', run: 'Run', yoga: 'Yoga', gym: 'Gym', cycle: 'Cycle', sport: 'Sport', dance: 'Dance', other: 'Other',
  } as Record<WorkoutType, string>,
  durations: [10, 20, 30, 45, 60] as const,
  minutes: (m: number) => (m >= 60 ? '1 hr+' : `${m} min`),
  durationChip: (m: number) => (m >= 60 ? '60+' : String(m)),
  durationA11y: (m: number) => (m >= 60 ? 'An hour or more' : `${m} minutes`),
  entry: (type: WorkoutType, m: number) => `${WORKOUT_COPY.names[type]} · ${WORKOUT_COPY.minutes(m)}`,
  edit: 'Edit',
  delete: 'Delete',
  editA11y: (type: WorkoutType, m: number) => `Edit ${WORKOUT_COPY.entry(type, m)}`,
  deleteA11y: (type: WorkoutType, m: number) => `Delete ${WORKOUT_COPY.entry(type, m)}`,
};

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export const CHANGES_COPY = {
  tag: 'Your garden over time',
  title: 'Changes',
  subtitle: 'Gentle moments and growth over time.',
  paceNote: 'Every pace is welcome here. Growth happens quietly beneath the surface.',
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

export const ME_COPY = {
  tag: 'Me',
  hello: (name?: string | null) => (name ? `Hello, ${name}` : 'Hello'),
  subtitle: 'Your personal quiet corner.',
  nameTitle: 'What should we call you?',
  save: 'Save',
  saving: 'Saving',
  localBadge: 'Local and private',
  philosophyTitle: 'MoveKind philosophy',
  philosophy:
    'Movement is for joy, not for penance. Take your time, rest when you need, and let your garden flourish at its own pace.',
  reminderTitle: 'Daily reminder',
  reminderLabel: 'Daily reminder at 9am',
  reminderBody: 'One gentle note each morning. Off unless you turn it on.',
  reminderDenied: "Notifications are off for MoveKind in your phone's settings, so the reminder can't be sent.",
} as const;

export const GARDEN_INTRO_COPY = {
  tag: 'How it works',
  title: 'A kind place to note your day',
  subtitle: 'A tap or two for the things that look after you. That is all there is to it.',
  lines: [
    { icon: 'emoticon-happy-outline', text: 'Say how you feel', detail: 'Whatever it is today is fine.' },
    { icon: 'water-outline', text: 'Note your water', detail: 'One tap a glass. Tea counts too.' },
    { icon: 'food-apple-outline', text: 'Note your meals', detail: 'Only which ones. Never what, or how much.' },
    { icon: 'run', text: 'Note any movement', detail: 'Anything you enjoyed, anywhere you did it.' },
    { icon: 'sleep', text: 'Note your sleep', detail: 'Roughly how long, and how it felt.' },
  ],
  sanctuary: 'Our promise',
  promise: 'No streaks, no targets, nothing to keep up with. Note what you like, when you like. Everything stays on this phone.',
  start: 'Get started',
  next: 'Continue',
} as const;

export const STEPS_COPY = {
  checking: 'Checking',
  allow: 'Tap to allow',
  allowButton: 'Allow steps',
  allowHint: 'Lets MoveKind read your step count from this phone. Steps stay on this phone.',
  off: 'Off',
  offHint: 'Step access is off. You can turn on Motion and Fitness for MoveKind in your phone settings.',
  unavailable: 'Not available',
  unavailableHint: "This phone doesn't share a step count with MoveKind.",
  weekHint: 'Opens your steps for the week',
  weekTitle: 'Your steps this week',
  weekNote: 'Every day has its own rhythm. Days with fewer steps give space for rest.',
  close: 'Close',
  day: (d: Date) => d.toLocaleDateString(undefined, { weekday: 'long' }),
  count: (n: number) => n.toLocaleString(),
} as const;

export const BADGE_COPY = {
  resting: 'Resting under the moon',
  rain: 'Gentle rain falling',
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

export const UNWELL_COPY = {
  toggle: 'Feeling unwell today',
  cardTitle: 'Rest is part of growing. Your garden is drinking the rain.',
  cardBody: 'No logs needed today. Rest easy.',
  subtitle: 'Today is for resting.',
} as const;

export const WATER_COPY = {
  title: 'How many glasses of water today?',
  subtitle: "Maple's having one too.",
  add: '+1 glass',
  remove: 'Undo last glass',
  count: (n: number) => (n === 0 ? 'Nothing yet today' : n === 1 ? '1 glass today' : `${n} glasses today`),
  note: 'Drink when you are thirsty. Tea and other drinks count too.',
} as const;

export const SHEET_COPY = {
  close: 'Not now',
  moodTitle: "Hi, I'm Maple. How are you feeling right now?",
  moodSubtitle: "I'll feel it with you.",
  stepsTitle: 'Your steps',
  stepsSubtitle: 'Steps grow the grass.',
} as const;

export const DRAWER_COPY = {
  openLabel: "Today in Maple's yard. Opens the drawer.",
  closeLabel: 'Close the drawer',
  todayTitle: "Today in Maple's yard",
  changesTitle: 'Changes',
  insightsTitle: 'Insights',
  meTitle: 'You',
  rows: {
    water: { title: 'Water', action: '+1 glass' },
    food: { title: 'Food', action: 'Log food' },
    workout: { title: 'Movement', action: 'Log movement' },
    sleep: { title: 'Sleep', action: 'Log sleep' },
    mood: { title: 'Mood', action: 'Check in' },
    steps: { title: 'Steps', action: 'See your steps' },
  },
  noMoodYet: 'Not yet today',
  noFoodYet: 'Not yet today',
  noWorkoutYet: 'Not yet today',
  noSleepYet: 'Not yet today',
  minutesToday: (m: number) => `${m} min today`,
  mealsCount: (n: number) => (n === 0 ? 'Not yet today' : n === 1 ? '1 meal today' : `${n} meals today`),
  sleepCount: (h: number) => `${h} hr last night`,
} as const;

export const YARD_COPY = {
  title: "Maple's yard",
  greeting: (partOfDay: string, name?: string | null) =>
    name ? `Good ${partOfDay}, ${name}` : `Good ${partOfDay}`,
  moodButtonAsk: 'How are you?',
  moodButtonA11y: "Change how you're feeling",
  speakers: {
    maple: 'Maple',
    pudding: 'Pudding',
  },
  objects: {
    maple: { label: 'Maple the golden retriever', hint: 'Pet Maple.' },
    water: { label: 'Water bowl. Log glasses of water', hint: 'Maple trots over for a drink and opens water.' },
    food: { label: 'Food bowl. Log what you ate', hint: 'Maple and Pudding eat and the food sheet opens.' },
    ball: { label: "Maple's ball. Log movement", hint: 'Maple chases her ball and opens movement.' },
    pudding: { label: 'Pudding the sleeping bulldog. Log your sleep', hint: 'Pudding snores and opens sleep.' },
  },
  moods: {
    tired: { label: 'Tired', flavor: 'Low battery', line: "Let's take it slow today." },
    low: { label: 'A bit low', flavor: 'Quiet inside', line: "I'll sit right here with you." },
    frustrated: { label: 'Frustrated', flavor: 'Head is busy', line: 'Busy head? Me too. No rush.' },
    steady: { label: 'Steady', flavor: 'Doing okay', line: 'Nice. Happy just hanging out.' },
    buzzing: { label: 'Buzzing', flavor: 'Lots of energy', line: 'Ooh! Is it ball time?' },
  } as Record<YardMood, { label: string; flavor: string; line: string }>,
  afterSave: {
    water: 'Ahh. That hit the spot.',
    food: 'Thanks! That was the good stuff.',
    ball: 'That was fun. Good game!',
    pudding: 'Snrk. Good sleep is good.',
  },
  waking: {
    puddingFood: 'Food?!',
    puddingSleepTap: 'Mmmf. Five more minutes.',
  },
  foodSheet: {
    title: 'Did you get something to eat?',
    subtitle: 'Pick any. Pudding got up for this, which is a big deal.',
    save: 'Save',
    cancel: 'Not now',
    meals: {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      snack: 'A snack',
    } as Record<Meal, string>,
  },
  sleepSheet: {
    title: 'How did you sleep last night?',
    subtitle: 'Pudding is something of an expert.',
    emptyHours: 'Tap + to add',
    hoursLabel: (h: number) => (h === 1 ? '1 hour' : `${h} hours`),
    lessA11y: 'Half an hour less',
    moreA11y: 'Half an hour more',
    feelTitle: 'How did it feel?',
    feels: {
      restless: 'Restless',
      okay: 'Okay',
      deep: 'Deep',
    } as Record<NonNullable<SleepLog['feel']>, string>,
    save: 'Save',
    cancel: 'Not now',
  },
  sceneSummary: (mood: YardMood | null, puddingAwake: boolean, resting: boolean, raining: boolean): string => {
    if (resting) {
      return 'Your yard is resting under the moon. Maple and Pudding are asleep.';
    }
    const rainPart = raining ? 'Gentle rain is falling and Maple is sitting under the tree. ' : '';
    const moodPart = mood
      ? `Maple is ${mood === 'tired' ? 'lying down' : 'sitting'}, feeling ${YARD_COPY.moods[mood].label.toLowerCase()}.`
      : 'Maple is sitting calmly in the middle of the yard.';
    const puddingPart = puddingAwake ? 'Pudding is awake at the food bowl.' : 'Pudding is asleep on his cushion.';
    return `${rainPart}${moodPart} ${puddingPart}`;
  },
} as const;