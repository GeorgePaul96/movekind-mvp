import { EXERCISES, exerciseById } from '../src/data/exercises';

describe('exercise library', () => {
  it('has 30 exercises, 6 per category', () => {
    expect(EXERCISES).toHaveLength(30);
    for (const c of ['regulate', 'mobilize', 'strengthen', 'move', 'downshift']) {
      expect(EXERCISES.filter((e) => e.category === c)).toHaveLength(6);
    }
  });

  it('uses unique, stable ids', () => {
    const ids = EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(30);
    for (const id of ids) expect(id).toMatch(/^ex-(regulate|mobilize|strengthen|move|downshift)-[1-6]$/);
  });

  it('every exercise has cues and no jargon in its name', () => {
    for (const e of EXERCISES) {
      expect(e.cues.length).toBeGreaterThan(0);
      expect(e.name).not.toMatch(/somatic|attunement|nervous system/i);
    }
  });

  it('looks exercises up by id', () => {
    expect(exerciseById('ex-regulate-1')?.name).toBe('Box Breathing');
    expect(exerciseById('nope')).toBeUndefined();
  });
});
