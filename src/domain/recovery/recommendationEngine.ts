import type { RecoveryStateEnum } from './recoveryEngine';

export interface RecommendationOutput {
  title: string;
  description: string;
  rationale: string;
}

export function getRecommendation(state: RecoveryStateEnum): RecommendationOutput {
  switch (state) {
    case 'Overloaded':
      return {
        title: 'Physiological Sigh',
        description: 'Take 2 quick inhales through the nose, followed by a long, slow exhale through the mouth. Repeat 3 times.',
        rationale: 'Quickly offloads carbon dioxide and lowers autonomic arousal when you are overwhelmed.',
      };
    case 'Activated':
      return {
        title: 'Box Breathing',
        description: 'Inhale for 4 seconds, hold for 4, exhale for 4, hold for 4.',
        rationale: 'Balances the nervous system when you have high energy but are carrying excess tension.',
      };
    case 'Recovering':
      return {
        title: 'Light Movement',
        description: 'Go for a gentle 10-minute walk outside.',
        rationale: 'Movement without strain helps metabolize residual stress hormones safely.',
      };
    case 'Regulated':
      return {
        title: 'Maintain Current Routine',
        description: 'You are in a good place. Lean into your current habits or tackle a moderate challenge.',
        rationale: 'Your nervous system has the capacity to handle load today.',
      };
    default:
      return {
        title: 'Rest',
        description: 'Take a brief pause.',
        rationale: 'When in doubt, rest is the safest intervention.',
      };
  }
}
