export interface GapProfile {
  hasHistory: boolean;
  lastGapDays: number;
  avgGapDays: number;
  gapHistory: number[];          // last 5 inter-session intervals (days), oldest → newest
  trend: 'shrinking' | 'stable' | 'growing' | 'insufficient_data';
  observation: string | null;
}

export interface RhythmStability {
  weeklyVariance: number;
  avgWeeklySessions: number;
  weeklyCounts: number[];
  trajectory: 'stabilizing' | 'stable' | 'fragmenting' | 'rebuilding' | 'insufficient_data';
  observation: string | null;
}

export type RecoverySignal =
  | 'collapse' | 'spiral' | 'burnout_risk' | 'returning' | 'stable' | 'thriving';

export interface RecoveryState {
  signal: RecoverySignal;
  isMotivationalCollapse: boolean;
  isAvoidanceSpiral: boolean;
  isBurnoutRisk: boolean;
  reEntryReadiness: 'high' | 'medium' | 'low';
}

export type WinType =
  | 'faster_return'
  | 'difficult_week_log'
  | 'gap_shrinking'
  | 'rhythm_stabilizing';

export interface SelfEfficacyWin {
  type: WinType;
  observation: string;
}

export interface BehavioralProfile {
  gaps: GapProfile;
  rhythm: RhythmStability;
  recovery: RecoveryState;
  wins: SelfEfficacyWin[];
}
