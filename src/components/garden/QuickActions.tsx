import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActionTile } from '@/components/ActionTile';
import { Button } from '@/components/Button';
import { GARDEN_COPY, STEPS_COPY } from '@/constants/copy';
import type { StepsStatus } from '@/services/steps';

interface Props {
  glassesToday: number;
  /** Minutes of workouts logged today (0 = none yet). */
  workoutMinutesToday?: number;
  stepsToday: number | null;
  stepsStatus?: StepsStatus | 'unknown';
  onWater: () => void;
  onUndoWater: () => void;
  onWorkout: () => void;
  /** Tapped Steps: ask for access, or open the week once steps are shared. */
  onSteps?: () => void;
}

function stepsTile(status: StepsStatus | 'unknown', steps: number | null): { value: string; unit?: string; hint?: string } {
  switch (status) {
    case 'granted':
      return { value: STEPS_COPY.count(steps ?? 0), unit: GARDEN_COPY.stepsUnit, hint: STEPS_COPY.weekHint };
    case 'ask':
      return { value: STEPS_COPY.allow, hint: STEPS_COPY.allowHint };
    case 'denied':
      return { value: STEPS_COPY.off, hint: STEPS_COPY.offHint };
    case 'unavailable':
      return { value: STEPS_COPY.unavailable, hint: STEPS_COPY.unavailableHint };
    case 'needs-full-app':
      return { value: GARDEN_COPY.stepsSoon, hint: GARDEN_COPY.stepsHint };
    default:
      return { value: STEPS_COPY.checking };
  }
}

/** Water (one tap), Workout (opens the log), Steps (counted by the phone). */
export function QuickActions({
  glassesToday,
  workoutMinutesToday = 0,
  stepsToday,
  stepsStatus = 'needs-full-app',
  onWater,
  onUndoWater,
  onWorkout,
  onSteps = () => {},
}: Props) {
  const steps = stepsTile(stepsStatus, stepsToday);
  return (
    <View>
      <View style={styles.row}>
        <ActionTile
          icon="water-outline"
          title={GARDEN_COPY.water}
          value={String(glassesToday)}
          unit={GARDEN_COPY.glassesUnit(glassesToday)}
          note={glassesToday > 0 ? GARDEN_COPY.waterNote : GARDEN_COPY.waterTap}
          accessibilityLabel={GARDEN_COPY.waterA11y(glassesToday)}
          onPress={onWater}
        />
        <ActionTile
          icon="run"
          title={GARDEN_COPY.workout}
          value={workoutMinutesToday > 0 ? GARDEN_COPY.workoutToday(workoutMinutesToday) : GARDEN_COPY.logOne}
          unit={workoutMinutesToday > 0 ? GARDEN_COPY.workoutTodayUnit : GARDEN_COPY.workoutUnit}
          note={workoutMinutesToday > 0 ? GARDEN_COPY.workoutNote : undefined}
          accessibilityLabel={GARDEN_COPY.workoutA11y}
          onPress={onWorkout}
        />
        <ActionTile
          icon="shoe-print"
          title={GARDEN_COPY.steps}
          value={steps.value}
          unit={steps.unit}
          accessibilityLabel={GARDEN_COPY.steps}
          accessibilityHint={steps.hint}
          onPress={onSteps}
        />
      </View>
      {glassesToday > 0 && (
        <Button label={GARDEN_COPY.undoGlass} variant="link" size="sm" onPress={onUndoWater} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
});
