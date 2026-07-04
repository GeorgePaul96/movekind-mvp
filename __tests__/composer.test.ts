import { composeSession, ComposerInput } from '../src/domain/sessions/composer';
import type { Exercise, UserExerciseStats } from '../src/types';
import type { BehavioralProfile } from '../src/domain/behavioral/types';

// Mock Exercise Database
const mockExercises: Exercise[] = [
  { id: '1', name: 'Box Breathing', category: 'regulate', base_difficulty: 1, cues: [], illustration_ref: '', created_at: '' },
  { id: '2', name: 'Somatic Shake', category: 'regulate', base_difficulty: 1, cues: [], illustration_ref: '', created_at: '' },
  { id: '3', name: 'Hip 90/90', category: 'mobilize', base_difficulty: 1, cues: [], illustration_ref: '', created_at: '' },
  { id: '4', name: 'Downward Dog', category: 'mobilize', base_difficulty: 2, cues: [], illustration_ref: '', created_at: '' },
  { id: '5', name: 'Air Squat', category: 'strengthen', base_difficulty: 1, cues: [], illustration_ref: '', created_at: '' },
  { id: '6', name: 'Push-up', category: 'strengthen', base_difficulty: 2, cues: [], illustration_ref: '', created_at: '' },
  { id: '7', name: 'March in Place', category: 'move', base_difficulty: 1, cues: [], illustration_ref: '', created_at: '' },
  { id: '8', name: 'Lateral Hops', category: 'move', base_difficulty: 2, cues: [], illustration_ref: '', created_at: '' },
  { id: '9', name: 'Childs Pose', category: 'downshift', base_difficulty: 1, cues: [], illustration_ref: '', created_at: '' },
  { id: '10', name: 'Legs up Wall', category: 'downshift', base_difficulty: 1, cues: [], illustration_ref: '', created_at: '' },
];

describe('Session Composer', () => {
  test('composes Overloaded session with Regulate and Downshift blocks', () => {
    const input: ComposerInput = {
      state: 'overloaded',
      exercises: mockExercises,
      recentExerciseIds: [],
    };
    const session = composeSession(input);
    
    expect(session).toHaveLength(3);
    expect(session[0]!.exercise.category).toBe('regulate');
    expect(session[1]!.exercise.category).toBe('downshift');
    expect(session[2]!.exercise.category).toBe('downshift');
    expect(session[1]!.exercise.id).not.toBe(session[2]!.exercise.id); // No duplicates in session
  });

  test('composes Regulated session with Mobilize, Strengthen, Move, and Downshift blocks', () => {
    const input: ComposerInput = {
      state: 'regulated',
      exercises: mockExercises,
      recentExerciseIds: [],
    };
    const session = composeSession(input);
    
    expect(session).toHaveLength(4);
    expect(session[0]!.exercise.category).toBe('mobilize');
    expect(session[1]!.exercise.category).toBe('strengthen');
    expect(session[2]!.exercise.category).toBe('move');
    expect(session[3]!.exercise.category).toBe('downshift');
  });

  test('respects recent history (anti-repetition)', () => {
    // If 'Childs Pose' (id: 9) was recently completed, the composer should choose 'Legs up Wall' (id: 10) for downshift
    const input: ComposerInput = {
      state: 'overloaded',
      exercises: mockExercises,
      recentExerciseIds: ['9'], // 'Childs Pose' is recent
    };
    const session = composeSession(input);
    
    // The first downshift block should be 'Legs up Wall' (id: 10) instead of 'Childs Pose' (id: 9)
    expect(session[1]!.exercise.id).toBe('10');
  });

  test('applies user exercise stats weighting (adaptive preference)', () => {
    // If 'Push-up' (id: 6) has a high positive energy delta, it should be selected over 'Air Squat' (id: 5) for strength
    const userStats: UserExerciseStats[] = [
      { id: 'u1', user_id: 'user1', exercise_id: '6', times_completed: 5, average_energy_delta: 1.8, average_session_completion_rate: 1.0, last_completed_at: '' },
      { id: 'u2', user_id: 'user1', exercise_id: '5', times_completed: 5, average_energy_delta: 0.2, average_session_completion_rate: 1.0, last_completed_at: '' },
    ];
    const input: ComposerInput = {
      state: 'regulated',
      exercises: mockExercises,
      recentExerciseIds: [],
      userStats,
    };
    const session = composeSession(input);
    
    // Strength block (index 1) should be 'Push-up' (id: 6) due to high rating delta
    expect(session[1]!.exercise.id).toBe('6');
  });
});

// --- Composer v3: behavioral-profile-aware composition -----------------------

function makeProfile(overrides: {
  reEntryReadiness?: BehavioralProfile['recovery']['reEntryReadiness'];
  signal?: BehavioralProfile['recovery']['signal'];
  lastGapDays?: number;
  hasGapHistory?: boolean;
  completionRate?: number;
  hasFollowThrough?: boolean;
}): BehavioralProfile {
  return {
    gaps: {
      hasHistory: overrides.hasGapHistory ?? false,
      lastGapDays: overrides.lastGapDays ?? 2,
      avgGapDays: 3,
      gapHistory: [],
      trend: 'stable',
      observation: null,
    },
    rhythm: {
      weeklyVariance: 0,
      avgWeeklySessions: 3,
      weeklyCounts: [],
      trajectory: 'stable',
      observation: null,
    },
    recovery: {
      signal: overrides.signal ?? 'stable',
      isMotivationalCollapse: false,
      isAvoidanceSpiral: false,
      isBurnoutRisk: false,
      reEntryReadiness: overrides.reEntryReadiness ?? 'medium',
    },
    wins: [],
    followThrough: {
      completed: 5,
      abandoned: 0,
      total: 5,
      completionRate: overrides.completionRate ?? 1.0,
      hasHistory: overrides.hasFollowThrough ?? false,
      trend: 'steady',
      observation: null,
    },
  };
}

function totalDuration(session: { target_duration: number }[]): number {
  return session.reduce((sum, b) => sum + b.target_duration, 0);
}

describe('Session Composer v3 (behavioral profile)', () => {
  const base: ComposerInput = {
    state: 'regulated',
    exercises: mockExercises,
    recentExerciseIds: [],
  };

  test('no profile leaves composition identical to baseline', () => {
    const withUndefined = composeSession({ ...base });
    const normalProfile = composeSession({ ...base, profile: makeProfile({}) });
    // A neutral profile (medium readiness, stable) must not change the session.
    expect(withUndefined.map((b) => b.exercise.category)).toEqual([
      'mobilize',
      'strengthen',
      'move',
      'downshift',
    ]);
    expect(normalProfile.map((b) => b.exercise.category)).toEqual(
      withUndefined.map((b) => b.exercise.category),
    );
    expect(totalDuration(normalProfile)).toBe(totalDuration(withUndefined));
  });

  test('low re-entry readiness produces a shorter, gentler session', () => {
    const normal = composeSession({ ...base });
    const gentle = composeSession({
      ...base,
      profile: makeProfile({ reEntryReadiness: 'low' }),
    });

    expect(gentle.length).toBeLessThan(normal.length);
    expect(totalDuration(gentle)).toBeLessThan(totalDuration(normal));
    // A high-intensity block is dropped during gentle re-entry.
    const gentleHigh = gentle.filter((b) =>
      ['strengthen', 'move'].includes(b.exercise.category),
    );
    const normalHigh = normal.filter((b) =>
      ['strengthen', 'move'].includes(b.exercise.category),
    );
    expect(gentleHigh.length).toBeLessThan(normalHigh.length);
  });

  test('a long gap since last session triggers gentle re-entry', () => {
    const normal = composeSession({ ...base });
    const afterGap = composeSession({
      ...base,
      profile: makeProfile({ hasGapHistory: true, lastGapDays: 21 }),
    });
    expect(totalDuration(afterGap)).toBeLessThan(totalDuration(normal));
  });

  test('burnout-risk signal triggers gentle re-entry even at medium readiness', () => {
    const gentle = composeSession({
      ...base,
      profile: makeProfile({ signal: 'burnout_risk' }),
    });
    const normal = composeSession({ ...base });
    expect(totalDuration(gentle)).toBeLessThan(totalDuration(normal));
  });

  test('wavering follow-through (low completion) triggers gentle re-entry', () => {
    const gentle = composeSession({
      ...base,
      profile: makeProfile({ hasFollowThrough: true, completionRate: 0.3 }),
    });
    const normal = composeSession({ ...base });
    expect(totalDuration(gentle)).toBeLessThan(totalDuration(normal));
  });

  test('thriving + high readiness lengthens the high-intensity work', () => {
    const normal = composeSession({ ...base });
    const energized = composeSession({
      ...base,
      profile: makeProfile({ reEntryReadiness: 'high', signal: 'thriving' }),
    });
    expect(energized.length).toBe(normal.length); // no blocks dropped
    expect(totalDuration(energized)).toBeGreaterThan(totalDuration(normal));
  });

  test('same energy score, different histories → visibly different sessions (exit criterion)', () => {
    const tired = composeSession({
      ...base,
      profile: makeProfile({ reEntryReadiness: 'low', signal: 'burnout_risk' }),
    });
    const thriving = composeSession({
      ...base,
      profile: makeProfile({ reEntryReadiness: 'high', signal: 'thriving' }),
    });
    expect(totalDuration(tired)).not.toBe(totalDuration(thriving));
    expect(tired.length).not.toBe(thriving.length);
  });

  test('gentle re-entry never collapses below two blocks', () => {
    // Overloaded has only one high-intensity-free short sequence already.
    const gentleOverloaded = composeSession({
      state: 'overloaded',
      exercises: mockExercises,
      recentExerciseIds: [],
      profile: makeProfile({ reEntryReadiness: 'low' }),
    });
    expect(gentleOverloaded.length).toBeGreaterThanOrEqual(2);
  });
});
