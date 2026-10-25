import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActionTile } from '@/components/ActionTile';
import { Button } from '@/components/Button';
import { GARDEN_COPY, STEPS_COPY } from '@/constants/copy';
import type { StepsStatus } from '@/services/steps';

interface Props {
  glassesToday: number;
  stepsToday: number | null;
  stepsStatus?: StepsStatus | 'unknown';
  onWater: () => void;
  onUndoWater: () => void;
  onWorkout: () => void;
  /** Tapped Steps: ask for access, or open the week once steps are shared. */
  onSteps?: () => void;
}

function stepsTile(status: StepsStatus | 'unknown', steps: number | null): { detail: string; hint?: string } {
  switch (status) {
    case 'granted':
      return { detail: STEPS_COPY.count(steps ?? 0), hint: STEPS_COPY.weekHint };
    case 'ask':
      return { detail: STEPS_COPY.allow, hint: STEPS_COPY.allowHint };
    case 'denied':
      return { detail: STEPS_COPY.off, hint: STEPS_COPY.offHint };
    case 'unavailable':
      return { detail: STEPS_COPY.unavailable, hint: STEPS_COPY.unavailableHint };
    case 'needs-full-app':
      return { detail: GARDEN_COPY.stepsSoon, hint: GARDEN_COPY.stepsHint };
    default:
      return { detail: STEPS_COPY.checking };
  }
}

/** Water (one tap), Workout (opens the log), Steps (counted by the phone). */
export function QuickActions({
  glassesToday,
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
          emoji="💧"
          label={GARDEN_COPY.water}
          detail={GARDEN_COPY.glasses(glassesToday)}
          accessibilityLabel={GARDEN_COPY.waterA11y(glassesToday)}
          onPress={onWater}
        />
        <ActionTile
          emoji="🏃"
          label={GARDEN_COPY.workout}
          detail={GARDEN_COPY.logOne}
          accessibilityLabel={GARDEN_COPY.workoutA11y}
          onPress={onWorkout}
        />
        <ActionTile
          emoji="👣"
          label={GARDEN_COPY.steps}
          detail={steps.detail}
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
  row: { flexDirection: 'row', gap: 8 },
});
