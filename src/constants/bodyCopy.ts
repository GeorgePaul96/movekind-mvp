/**
 * Copy for the opt-in Body section and Insights. Re-exported from copy.ts.
 * Plain and factual: these screens state numbers, so they never cheer or scold.
 */
export const BODY_COPY = {
  title: 'Body',
  switchTitle: 'Body and numbers',
  switchLabel: 'Show body numbers and estimates',
  switchBody:
    'Body composition, where your pace is heading, sleep balance and fitness estimates. Off unless you turn it on. The yard never mentions them.',
  switchOnBody: 'On. Fill in your details and measurements just below. Switch off any time; your entries are kept.',
  noticeTitle: 'About these numbers',
  noticeBody:
    'These are wellness estimates worked out on your phone from published formulas. They are not a medical device or a diagnosis. The formulas are for adults and are not valid during pregnancy. Nothing here leaves your phone.',
  noticeOk: 'I understand',
  unitsTitle: 'Units',
  units: { metric: 'cm and kg', imperial: 'in and lb' },

  detailsTitle: 'Your details',
  detailsBody: 'The formulas need these once. You can change them any time.',
  sexTitle: 'Which formula set should we use?',
  sexNote: 'The published formulas come in two versions only.',
  sex: { male: 'Male formulas', female: 'Female formulas' },
  birthYear: 'Year of birth',
  height: (unit: string) => `Height (${unit})`,
  saveDetails: 'Save details',
  editDetails: 'Change details',
  minor:
    'These formulas were made for adults, so there are no body numbers to show here. Everything else in MoveKind is yours to use.',

  measureTitle: "Today's measurements",
  measureBody: 'Fill in what you have. A weigh-in alone is fine. Saving again today replaces today.',
  weight: (unit: string) => `Weight (${unit})`,
  neck: (unit: string) => `Neck (${unit})`,
  waist: (unit: string) => `Waist (${unit})`,
  hip: (unit: string) => `Hips (${unit})`,
  saveMeasure: 'Save measurements',
  saved: 'Saved.',
  howTitle: 'How to measure',
  how: [
    'Weight: same scale, same time of day, when you can.',
    'Neck: just below the voice box, tape level, not pulled tight.',
    'Waist: level with the navel, relaxed, after breathing out.',
    'Hips: around the widest part.',
  ],
  invalid: {
    birthYear: 'Please check the year of birth.',
    height: 'Please check the height.',
    weight: 'Please check the weight.',
    neck: 'Please check the neck measurement.',
    waist: 'Please check the waist measurement.',
    hip: 'Please check the hip measurement.',
    nothing: 'Add at least one measurement first.',
    sex: 'Choose a formula set first.',
  },

  reportTitle: 'Your body report',
  needWeight: 'Add a weigh-in to see your report.',
  rows: {
    weight: 'Weight',
    bmi: 'Body mass index',
    bodyFat: 'Body fat',
    fatMass: 'Fat mass',
    leanMass: 'Lean mass',
    ffmi: 'Fat-free mass index',
    waistToHeight: 'Waist to height',
    resting: 'Resting energy use',
    daily: 'Daily energy use',
    intake: 'Calories you noted',
  },
  intakeNote: (days: number) =>
    `Your own average over ${days} days in the last two weeks. Shown beside energy use for comparison only.`,
  plusMinus: (value: string, error: string) => `${value} (give or take ${error})`,
  kcalRange: (lo: number, hi: number) => `about ${lo.toLocaleString()} to ${hi.toLocaleString()} kcal a day`,
  kcal: (n: number) => `about ${n.toLocaleString()} kcal a day`,
  band: {
    below: 'Below the reference range',
    within: 'In the reference range',
    above: 'Above the reference range',
  },
  needTape: 'Add neck and waist to see body fat, fat mass and lean mass.',
  needTapeFemale: 'Add neck, waist and hips to see body fat, fat mass and lean mass.',
  noStepsNote: 'Without step access this uses logged movement only, so it is rougher.',
  source: (label: string) => `Source: ${label}`,

  paceTitle: 'At this pace',
  paceBody: 'Where your own weigh-ins are heading if your eating and activity stay as they are now.',
  needMore: (weighIns: number, days: number) => {
    const parts = [
      weighIns > 0 ? (weighIns === 1 ? '1 more weigh-in' : `${weighIns} more weigh-ins`) : '',
      days > 0
        ? days === 1
          ? '1 more day between the first and the last'
          : `${days} more days between the first and the last`
        : '',
    ].filter(Boolean);
    return `A trend needs at least 4 weigh-ins across 2 weeks. Still needed: ${parts.join(', and ')}.`;
  },
  steady: 'Your weight is holding steady. At this pace it stays about where it is.',
  tooFast:
    'Your recent weigh-ins are changing faster than is usually considered healthy, or are heading below the reference range, so there is no projection to show. A doctor is the right person to talk this through with.',
  span: (weeks: number) => `${weeks} weeks`,
  spanA11y: (weeks: number) => `Show ${weeks} weeks from now`,
  now: 'Now',
  later: (weeks: number) => `In ${weeks} weeks`,
  about: (value: string, lo: string, hi: string) =>
    lo === hi ? `about ${value}` : `about ${value} (between ${lo} and ${hi})`,
  estimatedFat: 'Body fat here is a rougher estimate from height and weight. Add neck and waist for the tape method.',
  figureNeedsTape: 'Add neck and waist measurements to see the figure.',
  figureA11y: (nowWaist: string, laterWaist: string, weeks: number) =>
    `Two simple figures. Waist now about ${nowWaist}. Waist in ${weeks} weeks about ${laterWaist}.`,
  whatIfTitle: 'What if',
  whatIf: (steps: number) => (steps === 0 ? 'No extra steps' : `With ${steps.toLocaleString()} more steps a day`),
  whatIfLess: 'Fewer extra steps',
  whatIfMore: 'More extra steps',
  ignores:
    'This is a model, not a promise. It leaves out water shifts, the way the body adapts, and muscle gained from training.',
} as const;

/** Insights: patterns for everyone, numbers only behind the Body switch. */
export const INSIGHTS_COPY = {
  title: 'Insights',
  patternsTitle: 'Patterns',
  patternsEmpty: 'Patterns appear after about two weeks of logging.',
  patternsNote: 'These come from your own logs. They show what tends to go together, not what causes what.',
  patterns: {
    'sleep-mood': {
      up: 'In your logs, your mood tends to be brighter after nights of 7 hours or more.',
      down: 'In your logs, your mood tends to be brighter after shorter nights.',
    },
    'movement-mood': {
      up: 'In your logs, your mood tends to be brighter on days you moved.',
      down: 'In your logs, your mood tends to be brighter on days without logged movement.',
    },
    'steps-mood': {
      up: 'In your logs, your mood tends to be brighter on days with more steps.',
      down: 'In your logs, your mood tends to be brighter on days with fewer steps.',
    },
    'water-mood': {
      up: 'In your logs, your mood tends to be brighter on days with more water.',
      down: 'In your logs, your mood tends to be brighter on days with less water.',
    },
  },

  sleepTitle: 'Sleep balance',
  sleepNeed: (h: number) => `Your sleep need: ${h} hours`,
  sleepNeedLess: 'Half an hour less sleep need',
  sleepNeedMore: 'Half an hour more sleep need',
  less: 'Less',
  more: 'More',
  sleepLevel: (nights: number) => `Level over the last two weeks (${nights} nights logged).`,
  sleepBehind: (hours: number, nights: number) =>
    `About ${hours} ${hours === 1 ? 'hour' : 'hours'} behind over the last two weeks (${nights} nights logged). A few earlier nights would close it.`,
  sleepEmpty: 'Shows after 5 logged nights in two weeks.',

  stepsTitle: 'Steps and long-term health',
  stepsEmpty: 'Shows after a week of steps.',
  stepsAverage: (n: number) => `Your recent average: ${n.toLocaleString()} steps a day.`,
  stepsRisk: (pct: number) =>
    pct <= 0
      ? 'Across large studies, this is around the level of the least active group.'
      : `Across large studies, people at this level had about ${pct}% lower risk of early death than the least active group.`,
  stepsPlateau: (lo: number, hi: number) =>
    `The benefit levels off around ${lo.toLocaleString()} to ${hi.toLocaleString()} steps a day for your age group.`,
  stepsNote: 'This is a link seen across many people, not a promise for any one person.',
  stepsChartA11y: (n: number) =>
    `A curve of risk falling as daily steps rise, with your average of ${n.toLocaleString()} marked.`,

  fitnessTitle: 'Fitness estimate',
  fitnessBody:
    'An estimate of cardio fitness from your age, waist, resting pulse and logged movement. No exercise test needed.',
  fitnessNeeds: 'Needs your details, a waist measurement and a resting pulse.',
  fitnessValue: (v: string, error: string) => `About ${v} ml per kg per minute (give or take ${error}).`,
  fitnessAssumed: (perWeek: string, minutes: number, hard: boolean) =>
    `Assumed from the last 4 weeks of logged movement: about ${perWeek} times a week, ${minutes} minutes each, ${hard ? 'breathing hard' : 'taking it easy'}.`,
  pulseTitle: 'Resting pulse',
  pulseBody:
    'Sit quietly for a few minutes. Find your pulse at your wrist or neck, start the timer, and count the beats until it ends.',
  pulseStart: 'Start 30 seconds',
  pulseCounting: (s: number) => `Counting: ${s} seconds left`,
  pulseDone: 'Time. How many beats did you count?',
  pulseInput: 'Beats counted in 30 seconds',
  pulseSave: 'Save pulse',
  pulseLatest: (bpm: number) => `Latest: ${bpm} beats a minute`,
  pulseInvalid: 'Please check the count.',

  exportTitle: 'Your data',
  exportBody:
    'A plain report and a full copy of everything stored on this phone, to keep or to show someone you trust.',
  exportButton: 'Share my report',
  exportFailed: 'The report could not be shared just now.',
  report: {
    heading: 'MoveKind report',
    made: (date: string) => `Made on ${date}. Everything below was stored and worked out on this phone.`,
    logs: 'What you logged',
    logLabels: {
      checkIns: 'Mood check-ins',
      water: 'Glasses of water',
      workouts: 'Movement entries',
      meals: 'Meals',
      sleep: 'Nights of sleep',
    },
    body: 'Body',
    pace: 'At this pace',
    insights: 'Insights',
    sources: 'Sources',
    disclaimer: 'Wellness estimates from published formulas. Not a medical device or a diagnosis.',
    data: 'Full data (JSON)',
  },
} as const;
