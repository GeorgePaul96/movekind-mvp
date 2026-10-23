import { flowersByWeek, weeklyChanges } from '../src/domain/garden/changes';
import type { GardenInput } from '../src/domain/garden/garden';
import { CHANGES_COPY } from '../src/constants/copy';

// Wednesday 21 Oct 2026, noon. This week started Mon 19 Oct; last week Mon 12 Oct.
const NOW = new Date(2026, 9, 21, 12);
const at = (day: number, h = 9) => new Date(2026, 9, day, h).toISOString();
const empty: GardenInput = { checkIns: [], water: [], workouts: [], stepsToday: null };
const wk = (day: number, minutes = 20) => ({ minutes, created_at: at(day) });

const gentle = /less|fewer|down|drop|missed|\d/i;

describe('weeklyChanges', () => {
  it('first week shows a welcome line', () => {
    const lines = weeklyChanges({ ...empty, workouts: [wk(20)] }, NOW);
    expect(lines).toEqual([{ kind: 'welcome', text: CHANGES_COPY.welcome }]);
  });

  it('more workouts this week is celebrated', () => {
    const lines = weeklyChanges({ ...empty, workouts: [wk(13), wk(19), wk(20)] }, NOW);
    expect(lines[0]).toEqual({ kind: 'workouts', text: CHANGES_COPY.workoutsUp(2, 1) });
  });

  it('fewer workouts is gentle and states no shortfall', () => {
    const lines = weeklyChanges({ ...empty, workouts: [wk(12), wk(13), wk(14), wk(20)] }, NOW);
    const w = lines.find((l) => l.kind === 'workouts')!;
    expect(w.text).toBe(CHANGES_COPY.workoutsQuieter);
    expect(w.text).not.toMatch(gentle);
  });

  it('same is steady', () => {
    const lines = weeklyChanges({ ...empty, workouts: [wk(13), wk(20)] }, NOW);
    expect(lines.find((l) => l.kind === 'workouts')!.text).toBe(CHANGES_COPY.workoutsSame);
  });

  it('compares the same stretch of each week, so Monday is never "quieter" by default', () => {
    // Last week's workout fell on Saturday, after the point we have reached this week.
    const lines = weeklyChanges({ ...empty, workouts: [wk(17), wk(20)] }, NOW);
    expect(lines.find((l) => l.kind === 'workouts')!.text).toBe(CHANGES_COPY.workoutsUp(1, 1));
  });

  it('encouraging lines come before gentle ones', () => {
    const lines = weeklyChanges(
      { ...empty, workouts: [wk(12), wk(13)], water: [{ created_at: at(19) }, { created_at: at(20) }], checkIns: [{ energy_score: 4, created_at: at(13) }] },
      NOW,
    );
    expect(lines[0]!.kind).toBe('water');
    expect(lines.map((l) => l.kind)).toEqual(['water', 'workouts', 'checkins']);
    for (const l of lines.slice(1)) expect(l.text).not.toMatch(gentle);
  });

  it('no steps line without step data', () => {
    const lines = weeklyChanges({ ...empty, workouts: [wk(13), wk(20)] }, NOW);
    expect(lines.some((l) => l.kind === 'steps')).toBe(false);
  });

  it('steps up shows the rounded daily difference', () => {
    const stepsByDay = { '2026-10-12': 3000, '2026-10-13': 3000, '2026-10-14': 3000, '2026-10-19': 5000, '2026-10-20': 5000, '2026-10-21': 5000 };
    const lines = weeklyChanges({ ...empty, stepsByDay }, NOW);
    expect(lines[0]).toEqual({ kind: 'steps', text: CHANGES_COPY.stepsUp(2000) });
  });
});

describe('flowersByWeek', () => {
  it('groups by local week, 4 weeks, oldest first', () => {
    const checkIns = [
      { energy_score: 1, created_at: at(20) },
      { energy_score: 5, created_at: at(13) },
      { energy_score: 4, created_at: at(13, 18) },
      { energy_score: 2, created_at: new Date(2026, 8, 1).toISOString() }, // too old
    ];
    const weeks = flowersByWeek(checkIns, NOW);
    expect(weeks.map((w) => w.weekStart)).toEqual(['2026-09-28', '2026-10-05', '2026-10-12', '2026-10-19']);
    expect(weeks[2]!.flowers).toEqual([{ day: '2026-10-13', mood: 'regulated' }]);
    expect(weeks[3]!.flowers).toEqual([{ day: '2026-10-20', mood: 'overloaded' }]);
    expect(weeks[0]!.flowers).toEqual([]);
  });
});
