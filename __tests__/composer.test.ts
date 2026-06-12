import { composeSession, ComposerInput } from '../src/domain/sessions/composer';
import type { Exercise, UserExerciseStats } from '../src/types';

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
