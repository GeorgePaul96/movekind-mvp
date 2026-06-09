export type BodyState =
  | 'Relaxed'
  | 'Tense'
  | 'Wired'
  | 'Exhausted'
  | 'Restless'
  | 'Heavy';

export type EmotionState =
  | 'Calm'
  | 'Focused'
  | 'Overwhelmed'
  | 'Anxious'
  | 'Frustrated'
  | 'Drained'
  | 'Hopeful';

export type RecoveryStateEnum =
  | 'Regulated'
  | 'Activated'
  | 'Recovering'
  | 'Overloaded';

export interface DailyCheckInInput {
  energy: number; // 0-10
  stress: number; // 0-10
  bodyState: BodyState;
  emotions: EmotionState[]; // max 2
}

export interface RecoveryStateOutput {
  state: RecoveryStateEnum;
  confidence: number;
  reasons: string[];
}

export function generateRecoveryState(
  input: DailyCheckInInput,
): RecoveryStateOutput {
  const { energy, stress, bodyState, emotions } = input;
  const reasons: string[] = [];

  // Rules Evaluation
  const isExhausted = bodyState === 'Exhausted';
  const isWired = bodyState === 'Wired';
  const isHeavy = bodyState === 'Heavy';
  const hasCalmOrFocused = emotions.includes('Calm') || emotions.includes('Focused');

  // Activated often has high stress. We should check if it's explicitly wired or highly activated.
  // Overloaded is low energy and high stress, or exhausted.
  // We'll prioritize Activated if Energy >= 6 && Stress >= 6 even though Stress >= 7 is Overloaded.

  if ((energy >= 6 && stress >= 6) || isWired) {
    if (energy >= 6 && stress >= 6) reasons.push('High energy with high stress');
    if (isWired) reasons.push('Wired body state selected');

    return {
      state: 'Activated',
      confidence: 0.8,
      reasons: reasons.length > 0 ? reasons : ['Metrics indicate activation'],
    };
  }

  if (energy <= 3 || stress >= 7 || isExhausted) {
    if (energy <= 3) reasons.push('Low energy reported');
    if (stress >= 7) reasons.push('High stress reported');
    if (isExhausted) reasons.push('Exhausted body state selected');

    return {
      state: 'Overloaded',
      confidence: 0.85,
      reasons: reasons.length > 0 ? reasons : ['Metrics indicate overload'],
    };
  }

  if ((energy >= 4 && energy <= 6) && (stress >= 3 && stress <= 6) || isHeavy) {
    if (energy >= 4 && energy <= 6) reasons.push('Moderate energy reported');
    if (stress >= 3 && stress <= 6) reasons.push('Moderate stress reported');
    if (isHeavy) reasons.push('Heavy body state selected');

    return {
      state: 'Recovering',
      confidence: 0.75,
      reasons: reasons.length > 0 ? reasons : ['Metrics indicate recovery phase'],
    };
  }

  if (energy >= 6 && stress <= 4 && hasCalmOrFocused) {
    if (energy >= 6) reasons.push('Good energy reported');
    if (stress <= 4) reasons.push('Low stress reported');
    if (hasCalmOrFocused) reasons.push('Calm or focused emotions selected');

    return {
      state: 'Regulated',
      confidence: 0.9,
      reasons: reasons.length > 0 ? reasons : ['Metrics indicate regulated state'],
    };
  }

  // Fallback if none match perfectly (default to Recovering to be safe)
  return {
    state: 'Recovering',
    confidence: 0.5,
    reasons: ['No strong indicators for other states; defaulting to safe recovery.'],
  };
}
