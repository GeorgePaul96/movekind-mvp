export type UserState = 'overloaded' | 'recovering' | 'regulated' | 'activated';

/**
 * The five moods Maple mirrors in the yard, in tile order. Stored on the check-in as `mood`;
 * `energy_score` is still written so the garden, its flowers and Changes keep working.
 */
export type YardMood = 'tired' | 'low' | 'frustrated' | 'steady' | 'buzzing';

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
  /** Feeling unwell today: the garden gets gentle rain. Absent on older rows. */
  unwell?: boolean;
  /** The yard mood picked. Absent on older rows: derive it from energy_score. */
  mood?: YardMood;
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

export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/** One meal eaten, logged from the food bowl. Only which meal: never what or how much. */
export interface MealLog {
  id: string;
  meal: Meal;
  created_at: string;
}

export type SleepFeel = 'restless' | 'okay' | 'deep';

/** Last night's sleep, logged from Pudding. One row per morning: `night_of` is the localDayKey of the morning after. */
export interface SleepLog {
  id: string;
  night_of: string;
  hours: number;
  feel: SleepFeel | null;
  created_at: string;
}

/** Which version of the published body formulas to use. They exist only as male and female sets. */
export type FormulaSex = 'male' | 'female';

/**
 * Details the opt-in Body section needs. All null until the person fills them in.
 * Lengths are centimetres; never sent anywhere.
 */
export interface BodyProfile {
  sex: FormulaSex | null;
  birth_year: number | null;
  height_cm: number | null;
  /** The person's own sleep need, within the adult 7 to 9 hour recommendation. */
  sleep_need_hours: number;
}

/** A weigh-in and/or tape measurements for one local day. Saving again that day edits the row. */
export interface Measurement {
  id: string;
  /** localDayKey of the day measured. */
  day: string;
  weight_kg?: number;
  neck_cm?: number;
  waist_cm?: number;
  hip_cm?: number;
  created_at: string;
}

/** A resting pulse the person counted themselves. */
export interface PulseLog {
  id: string;
  bpm: number;
  created_at: string;
}
