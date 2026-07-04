import type { RecoverySignal } from '@/domain/behavioral/types';

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
