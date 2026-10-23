export type UserState = 'overloaded' | 'recovering' | 'regulated' | 'activated';

export interface Profile {
  id: string;
  name: string | null;
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

/** One glass of water, logged with a tap. */
export interface WaterLog {
  id: string;
  created_at: string;
}

export type WorkoutType = 'walk' | 'run' | 'yoga' | 'gym' | 'cycle' | 'sport' | 'dance' | 'other';

/** A workout the user did anywhere, logged by hand: what and roughly how long. */
export interface Workout {
  id: string;
  type: WorkoutType;
  minutes: number;
  created_at: string;
}
