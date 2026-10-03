import type { RecoverySignal } from '@/domain/behavioral/types';
import type { UserState } from '@/types';

export const QUOTES = [
  'Rest is part of progress. Your body remembers consistency, not perfection.',
  'Even five minutes of gentle movement is a gift to yourself.',
  'Small, kind acts toward your body add up beautifully.',
  'Your path is unique. Progress is not linear, and that is okay.',
  'You showed up for yourself today. That is the whole victory.',
  'Breathe. Stretch. You are exactly where you need to be.',
  'Strength is built one gentle day at a time.',
];

export const NOTIFICATION_LINES = [
  'Even five minutes of movement counts. Be kind to yourself today.',
  'Rest is part of progress. Your body deserves space to heal.',
  'A gentle walk counts. Always.',
  'Thank yourself for moving. Every bit matters.',
  'No pressure — just check in with how your body feels today.',
];

export const FALLBACK_INSIGHTS = [
  'You are building a warm foundation. Small, consistent choices are working — keep going at your own comfortable pace.',
  'Your energy is quietly expanding. Consider a light, nourishing stretch today to integrate your progress.',
  'Strength comes from rhythm, not intensity. Keep moving gently and listening to your body.',
  'You took a moment to reflect — that awareness is a powerful step forward.',
  'Trust the slow build. Recovery is where adaptation and healing actually happen.',
];

export const REFLECTION_PROMPTS = [
  { key: 'energy',      label: 'How was your energy level overall?' },
  { key: 'recovery',    label: 'Did you allow yourself space to nourish and rest?' },
  { key: 'consistency', label: 'How did you feel about your movement rhythm?' },
  { key: 'mood',        label: 'How did you feel emotionally?' },
] as const;

export const BEHAVIORAL_FALLBACK: Record<RecoverySignal, { message: string }> = {
  returning: { message: "Glad you're here. Whenever you're ready, we'll meet you where you are." },
  collapse: { message: "It's been a little while — and that's completely okay. One gentle check-in is enough." },
  spiral: { message: 'No pressure today. Even opening the app is a step. We keep it light.' },
  burnout_risk: { message: 'Your body might be asking for rest. A short, soft session is more than enough.' },
  thriving: { message: "You've found a beautiful rhythm. Keep listening to your body." },
  stable: { message: "Steady and kind. You're showing up for yourself." },
};

export const RE_ENTRY_READINESS: Record<'high' | 'medium' | 'low', string> = {
  high: 'Your body looks ready for a fuller session today.',
  medium: 'Meet yourself where you are — a moderate session fits today.',
  low: 'Gentle is enough today. Honor what your body is asking for.',
};

export const INTENTION = {
  label: 'One intention for today',
  hint: 'Optional — a word or a line, just for you.',
  placeholder: 'e.g. move gently, breathe, just show up',
  reflectionTitle: 'Your intention today',
} as const;

export const ERROR_FALLBACK = {
  title: 'Something needed a pause',
  body: "The app hit a snag — nothing you did. Your progress is safe, and a fresh start is one tap away.",
  action: 'Start fresh',
} as const;

export const NUDGE_COPY: Record<RecoverySignal, string> = {
  thriving: "Your rhythm is strong. A session's here whenever you want it.",
  stable: "A few kind minutes of movement are here when you're ready.",
  returning: "Good to see you back. Whenever you're ready, we'll meet you where you are.",
  burnout_risk: 'Rest counts too. If you move today, keep it gentle and short.',
  spiral: "No pressure at all — even opening the app counts. We're here.",
  collapse: "Whenever you're ready, the smallest step is enough. We'll meet you there.",
};

const NUDGE_DEFAULT = "Check in when you're ready to compose today's session.";

export function nudgeBodyFor(signal: RecoverySignal | null): string {
  return signal ? NUDGE_COPY[signal] : NUDGE_DEFAULT;
}

export const MOOD_COPY: Record<
  UserState,
  { label: string; emoji: string; reassurance: string; sessionTitle: string; sessionFeel: string }
> = {
  overloaded: {
    label: 'Running on empty',
    emoji: '😮‍💨',
    reassurance: "Running on empty. That's okay.",
    sessionTitle: 'Your gentle reset',
    sessionFeel: 'Slow breathing and easy release. Nothing strenuous.',
  },
  recovering: {
    label: 'A bit low',
    emoji: '🌱',
    reassurance: 'A bit low today. Small is plenty.',
    sessionTitle: 'Your easy session',
    sessionFeel: 'Loosening stretches and light movement.',
  },
  regulated: {
    label: 'Steady',
    emoji: '🙂',
    reassurance: 'Steady. A good day to move.',
    sessionTitle: 'Your steady session',
    sessionFeel: 'Mobility, some strength, and a calm finish.',
  },
  activated: {
    label: 'Buzzing',
    emoji: '⚡',
    reassurance: "Buzzing. Let's use that energy well.",
    sessionTitle: 'Your strong session',
    sessionFeel: 'A fuller workout with a proper wind-down.',
  },
};

export const SLEEP_COPY: Record<'poor' | 'fair' | 'good', string> = {
  poor: '😴 Poor',
  fair: '😐 Okay',
  good: '✨ Great',
};

export const CHECKIN_COPY = {
  logged: 'Logged ✓',
  start: 'Start',
  notNow: "Not now — I'm done for today",
  sleepPrompt: 'Optional: how did you sleep?',
  addNote: '+ Add a note for today',
  notePlaceholder: 'e.g. move gently, breathe, just show up',
  saveNote: 'Save note',
  gentleReset: 'Too wiped to choose? Start a gentle reset',
  saveFailed: "Couldn't save that — tap to try again.",
  updateFailed: "Couldn't save that. Try again in a moment.",
  changeToday: "Change today's check-in",
  anotherSession: 'Do another short session',
  weekTitle: 'This week vs last',
  weekEmpty: 'Your week will appear here.',
  checkIns: 'Check-ins',
  minutes: 'Minutes moved',
  niceWeek: (name?: string | null) => (name ? `Nice to see you, ${name}.` : 'Nice to see you.'),
} as const;

export const SESSION_COPY = {
  overviewTitle: "Today's session",
  why: {
    overloaded: 'Today is about recovering. Expect slow breathing and gentle release — nothing strenuous.',
    recovering: 'Today is about loosening up. Slow, easy movement to get things going without wearing you out.',
    regulated: 'A balanced day: joint prep, some bodyweight strength, and a calm finish.',
    activated: "You've got energy today, so there's a fuller strength block and a proper wind-down.",
  } as Record<UserState, string>,
  start: 'Start session',
  discard: 'Not this one — go back',
  discardHint: 'Discards this session. Your check-in stays logged.',
  progress: (n: number, total: number) => `${n} of ${total}`,
  howTo: 'How to do it',
  pause: '⏸ Pause',
  resume: '▶ Resume',
  skip: 'Skip this one',
  endEarly: 'End session early',
  endEarlyHint: "Stops here. What you've done still counts.",
  completeTitle: 'Session done',
  completeSub: 'Nice work. That counts.',
  rateTitle: 'How do you feel now?',
  rateDesc: 'Compared to before you started:',
  ratings: [
    { value: -1, label: '😣 Worse', spoken: 'Worse' },
    { value: 0, label: '😐 Same', spoken: 'Same' },
    { value: 1, label: '🌱 Better', spoken: 'Better' },
    { value: 2, label: '✨ Much better', spoken: 'Much better' },
  ],
  notesTitle: 'Notes (optional)',
  notesPlaceholder: 'Any stiffness, relief, or thoughts?',
  saveRating: 'Save how I feel',
  saveRatingA11y: 'Save how you feel now',
  done: 'Done',
  resilienceTitle: 'You showed up',
  resilienceDesc: (moodLabel: string) =>
    `You moved today even while feeling ${moodLabel.toLowerCase()}. That's real self-trust.`,
  consistencyTitle: 'Steady week',
  consistencyDesc: 'Three sessions this week, at your own pace. That momentum is yours.',
  showedUpTitle: 'You showed up',
  showedUpDesc: 'You checked in with yourself and moved in a way that fit today.',
  noStreaks: '🌸 No streaks here. Rest days count, and nothing resets.',
} as const;

export function checkInPrompt(name?: string | null): string {
  return name ? `How's your energy, ${name}?` : "How's your energy?";
}
