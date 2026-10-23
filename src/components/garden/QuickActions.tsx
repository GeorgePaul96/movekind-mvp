import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActionTile } from '@/components/ActionTile';
import { Button } from '@/components/Button';
import { GARDEN_COPY } from '@/constants/copy';

interface Props {
  glassesToday: number;
  stepsToday: number | null;
  onWater: () => void;
  onUndoWater: () => void;
  onWorkout: () => void;
}

/** Water (one tap), Workout (opens the log), Steps (counted by the phone in stage 2). */
export function QuickActions({ glassesToday, stepsToday, onWater, onUndoWater, onWorkout }: Props) {
  return (
    <View>
      <View style={styles.row}>
        <ActionTile
          primary
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
          detail={stepsToday === null ? GARDEN_COPY.stepsSoon : stepsToday.toLocaleString()}
          accessibilityLabel={GARDEN_COPY.steps}
          accessibilityHint={GARDEN_COPY.stepsHint}
          onPress={() => {}}
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
