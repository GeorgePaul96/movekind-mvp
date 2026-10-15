import { ACTIVE_EXERCISES, EXERCISES, exerciseById } from '../src/data/exercises';

/**
 * Safety contract for the exercise library (docs/exercise-source-review.md):
 * every exercise the app can show is backed by an authoritative source; anything
 * unsourced or awaiting physiotherapist review is never shown.
 */

const TRUSTED_SOURCE_HOSTS = [
  'www.nhs.uk',
  'www.nhsinform.scot',
  'www.mayoclinic.org',
  'health.clevelandclinic.org',
  'www.acefitness.org',
];

const PENDING_REVIEW = ['ex-move-3', 'ex-move-4', 'ex-downshift-2'];

describe('exercise library', () => {
  it('keeps every id stable (stats are keyed by id) and retires ex-downshift-6', () => {
    const ids = EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^ex-(regulate|mobilize|strengthen|move|downshift)-[1-6]$/);
    expect(ids).toHaveLength(29);
    expect(ids).not.toContain('ex-downshift-6');
  });

  it('every shown exercise cites a trusted source over https', () => {
    for (const e of ACTIVE_EXERCISES) {
      expect(e.review).toBe('sourced');
      expect(e.source?.name.length).toBeGreaterThan(0);
      const url = new URL(e.source!.url);
      expect(url.protocol).toBe('https:');
      expect(TRUSTED_SOURCE_HOSTS).toContain(url.host);
    }
  });

  it('never shows exercises that are unsourced or awaiting physio review', () => {
    const activeIds = ACTIVE_EXERCISES.map((e) => e.id);
    for (const id of PENDING_REVIEW) {
      expect(exerciseById(id)?.review).toBe('pending_review');
      expect(activeIds).not.toContain(id);
    }
    expect(ACTIVE_EXERCISES).toHaveLength(26);
  });

  it('still has enough of each category to build every session type', () => {
    const count = (c: string) => ACTIVE_EXERCISES.filter((e) => e.category === c).length;
    expect(count('regulate')).toBeGreaterThanOrEqual(2);
    expect(count('mobilize')).toBeGreaterThanOrEqual(2);
    expect(count('strengthen')).toBeGreaterThanOrEqual(2);
    expect(count('move')).toBeGreaterThanOrEqual(2);
    expect(count('downshift')).toBeGreaterThanOrEqual(2); // overloaded uses two downshift blocks
  });

  it('carries the source-stated warnings', () => {
    expect(exerciseById('ex-downshift-1')?.cautions?.join(' ')).toMatch(/glaucoma/i);
    expect(exerciseById('ex-downshift-4')?.cautions?.join(' ')).toMatch(/osteoporosis/i);
  });

  it('drops the exercises the review flagged as risky or unsourced', () => {
    const names = EXERCISES.map((e) => e.name).join(' | ');
    for (const gone of ['Box Breathing', 'Scorpion', 'Downward Dog', 'Bodyweight Row', 'Lateral Hops', 'Reverse Lunge']) {
      expect(names).not.toContain(gone);
    }
  });

  it('every exercise has cues and no jargon in its name', () => {
    for (const e of EXERCISES) {
      expect(e.cues.length).toBeGreaterThan(0);
      expect(e.name).not.toMatch(/somatic|attunement|nervous system/i);
    }
  });

  it('looks exercises up by id', () => {
    expect(exerciseById('ex-regulate-1')?.name).toBe('Slow belly breathing');
    expect(exerciseById('nope')).toBeUndefined();
  });
});
