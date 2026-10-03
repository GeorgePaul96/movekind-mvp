import { MOODS, moodToEnergy, mapEnergyToState } from '../src/domain/checkin/moods';
import { MOOD_COPY, checkInPrompt } from '../src/constants/copy';

describe('moods', () => {
  it('lists the four moods from lowest to highest energy', () => {
    expect(MOODS).toEqual(['overloaded', 'recovering', 'regulated', 'activated']);
  });

  it('maps each mood to an energy score that round-trips to the same state', () => {
    expect(MOODS.map(moodToEnergy)).toEqual([1, 2, 4, 5]);
    for (const m of MOODS) expect(mapEnergyToState(moodToEnergy(m))).toBe(m);
  });

  it('keeps the legacy 1–5 mapping intact', () => {
    expect([1, 2, 3, 4, 5].map(mapEnergyToState)).toEqual([
      'overloaded', 'recovering', 'recovering', 'regulated', 'activated',
    ]);
  });

  it('has plain-English copy for every mood, free of jargon', () => {
    const banned = /attunement|capacity|nervous system|parasympathetic|somatic|safe harbor/i;
    for (const m of MOODS) {
      const c = MOOD_COPY[m];
      expect(c.label.length).toBeGreaterThan(0);
      for (const s of Object.values(c)) expect(s).not.toMatch(banned);
    }
  });

  it('greets by name when known', () => {
    expect(checkInPrompt('Sam')).toBe("How's your energy, Sam?");
    expect(checkInPrompt(null)).toBe("How's your energy?");
  });
});
