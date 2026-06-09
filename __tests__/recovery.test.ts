import { generateRecoveryState } from '../src/domain/recovery/recoveryEngine';
import { getRecommendation } from '../src/domain/recovery/recommendationEngine';

describe('Recovery Engine', () => {
  it('identifies Overloaded state', () => {
    const res = generateRecoveryState({
      energy: 2,
      stress: 8,
      bodyState: 'Exhausted',
      emotions: ['Drained'],
    });
    expect(res.state).toBe('Overloaded');
  });

  it('identifies Activated state', () => {
    const res = generateRecoveryState({
      energy: 7,
      stress: 7,
      bodyState: 'Wired',
      emotions: ['Anxious'],
    });
    expect(res.state).toBe('Activated');
  });

  it('identifies Regulated state', () => {
    const res = generateRecoveryState({
      energy: 8,
      stress: 3,
      bodyState: 'Relaxed',
      emotions: ['Calm'],
    });
    expect(res.state).toBe('Regulated');
  });

  it('identifies Recovering state by default or moderate metrics', () => {
    const res = generateRecoveryState({
      energy: 5,
      stress: 5,
      bodyState: 'Heavy',
      emotions: ['Focused'],
    });
    expect(res.state).toBe('Recovering');
  });
});

describe('Recommendation Engine', () => {
  it('returns Physiological Sigh for Overloaded', () => {
    const rec = getRecommendation('Overloaded');
    expect(rec.title).toBe('Physiological Sigh');
  });
  it('returns Box Breathing for Activated', () => {
    const rec = getRecommendation('Activated');
    expect(rec.title).toBe('Box Breathing');
  });
});
