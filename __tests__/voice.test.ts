import { speechParamsForState } from '../src/domain/sessions/voice';

describe('speechParamsForState', () => {
  it('speaks slower and softer as capacity drops', () => {
    const overloaded = speechParamsForState('overloaded');
    const recovering = speechParamsForState('recovering');
    const regulated = speechParamsForState('regulated');
    const activated = speechParamsForState('activated');

    expect(overloaded.rate).toBeLessThan(recovering.rate);
    expect(recovering.rate).toBeLessThan(regulated.rate);
    expect(regulated.rate).toBeLessThanOrEqual(activated.rate);
  });

  it('speaks fewer cues to depleted users', () => {
    expect(speechParamsForState('overloaded').maxSpokenCues).toBe(1);
    expect(speechParamsForState('recovering').maxSpokenCues).toBe(2);
    expect(speechParamsForState('regulated').maxSpokenCues).toBe(Infinity);
    expect(speechParamsForState('activated').maxSpokenCues).toBe(Infinity);
  });

  it('keeps rate and pitch within expo-speech sane bounds', () => {
    (['overloaded', 'recovering', 'regulated', 'activated'] as const).forEach((s) => {
      const p = speechParamsForState(s);
      expect(p.rate).toBeGreaterThanOrEqual(0.5);
      expect(p.rate).toBeLessThanOrEqual(1.5);
      expect(p.pitch).toBeGreaterThanOrEqual(0.8);
      expect(p.pitch).toBeLessThanOrEqual(1.2);
    });
  });
});
