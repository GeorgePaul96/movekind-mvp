export type UserState = 'overloaded' | 'recovering' | 'regulated' | 'activated';

export interface Profile {
  id: string;
  name: string | null;
  is_premium: boolean;
  created_at: string;
}

export interface CheckIn {
  id: string;
  user_id: string;
  energy_score: number; // 1 to 5
  sleep_quality: 'good' | 'fair' | 'poor' | null;
  intention: string | null; // optional one-line intention set at check-in
  engine_version: string;
  created_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: 'regulate' | 'mobilize' | 'strengthen' | 'move' | 'downshift';
  base_difficulty: number; // 1 to 3
  cues: string[];
  illustration_ref: string;
  created_at: string;
  // Premium exercise packs (Phase 5). Absent/false = free base library.
  // DB column + seeding deferred; until then every exercise reads as free.
  is_premium?: boolean;
}

export interface Session {
  id: string;
  user_id: string;
  check_in_id: string | null;
  state: UserState;
  status: 'generated' | 'started' | 'completed' | 'abandoned';
  engine_version: string;
  created_at: string;
}

export interface SessionBlock {
  id: string;
  session_id: string;
  exercise_id: string;
  block_order: number;
  target_duration: number; // in seconds
  actual_duration: number | null;
  status: 'pending' | 'completed' | 'skipped' | 'swapped';
}

export interface PostRating {
  id: string;
  session_id: string;
  rating_delta: number; // -1 to 2
  notes: string | null;
  created_at: string;
}

export interface UserExerciseStats {
  id: string;
  user_id: string;
  exercise_id: string;
  times_completed: number;
  average_energy_delta: number;
  average_session_completion_rate: number;
  last_completed_at: string;
}
