import type { UserState } from '@/types';

export interface SpeechParams {
  /** expo-speech rate. Lower = slower, calmer delivery. */
  rate: number;
  /** expo-speech pitch. Slightly lower reads as softer. */
  pitch: number;
  /**
   * How many coaching cues to speak aloud. Low-capacity states get fewer
   * words — an overloaded nervous system doesn't need a paragraph. Cues remain
   * fully visible on screen regardless; this only governs what is spoken.
   */
  maxSpokenCues: number;
}

/**
 * Per-capacity-state voice tuning for the guided player (Composer v3 companion).
 * Gentler, slower, fewer words when the user is depleted; brisker when activated.
 */
export function speechParamsForState(state: UserState): SpeechParams {
  switch (state) {
    case 'overloaded':
      return { rate: 0.82, pitch: 0.96, maxSpokenCues: 1 };
    case 'recovering':
      return { rate: 0.88, pitch: 0.98, maxSpokenCues: 2 };
    case 'regulated':
      return { rate: 0.95, pitch: 1.0, maxSpokenCues: Infinity };
    case 'activated':
      return { rate: 1.0, pitch: 1.0, maxSpokenCues: Infinity };
  }
}
