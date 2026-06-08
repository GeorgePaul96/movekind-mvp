export type ActivityType =
  | 'walk'
  | 'run'
  | 'weights'
  | 'cycle'
  | 'yoga'
  | 'swim'
  | 'sport'
  | 'stretch'
  | 'other';

export type ScoreFocus =
  | 'energy'
  | 'stressLoad'
  | 'recoveryState';

export interface Profile {
  id: string;
  name: string | null;
  is_premium: boolean;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  weekly_minutes_target: number;
  weekly_sessions_target: number;
  focus: ScoreFocus;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  type: ActivityType;
  duration_minutes: number;
  effort: number;
  moods: string[];
  notes: string | null;
  performed_at: string;
  created_at: string;
}

export type NewActivity = Omit<Activity, 'id' | 'user_id' | 'created_at'>;

export interface Reflection {
  id: string;
  user_id: string;
  week_start: string; // ISO date (yyyy-mm-dd)
  energy: number;
  recovery: number;
  mood: number;
  notes: string | null;
  created_at: string;
}

export type NewReflection = Omit<Reflection, 'id' | 'user_id' | 'created_at'>;

export interface ProgressScore {
  id: string;
  user_id: string;
  week_start: string;
  energy: number;
  stressLoad: number;
  recoveryState: number;
  computed_at: string;
}

export interface AIInsight {
  id: string;
  user_id: string;
  body: string;
  source: 'openai' | 'fallback';
  created_at: string;
}

export interface ComputedScores {
  energy: number;
  stressLoad: number;
  recoveryState: number;
}
