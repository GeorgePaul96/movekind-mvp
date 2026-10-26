import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { colors, elevation } from '@/constants/colors';
import { WORKOUT_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import { workoutGrowthLine } from '@/domain/garden/badges';
import type { WorkoutType } from '@/types';

const TYPES: WorkoutType[] = ['walk', 'run', 'yoga', 'gym', 'cycle', 'sport', 'dance', 'other'];
const PER_ROW = 3; // keeps every label on one line, even on small phones

interface Props {
  visible: boolean;
  /** Prefill when editing an existing workout. */
  initial?: { type: WorkoutType; minutes: number } | null;
  /** All-time workout minutes before this one, so the sheet can say what it will grow. */
  minutesSoFar?: number;
  onSave: (type: WorkoutType, minutes: number) => void;
  onClose: () => void;
}

/** The two-tap workout log: what you did, roughly how long. Never how to do it. */
export function WorkoutSheet({ visible, initial, minutesSoFar = 0, onSave, onClose }: Props) {
  const [type, setType] = useState<WorkoutType | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      setType(initial?.type ?? null);
      setMinutes(initial?.minutes ?? null);
    }
  }, [visible, initial]);

  const rows = Array.from({ length: Math.ceil(TYPES.length / PER_ROW) }, (_, i) =>
    TYPES.slice(i * PER_ROW, (i + 1) * PER_ROW),
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title} accessibilityRole="header">{WORKOUT_COPY.title}</Text>
          <Text style={styles.subtitle}>{WORKOUT_COPY.subtitle}</Text>
          {rows.map((row, i) => (
            <View key={i} style={styles.row}>
              {row.map((t) => (
                <Chip key={t} label={WORKOUT_COPY.types[t]} selected={type === t} onPress={() => setType(t)} />
              ))}
            </View>
          ))}

          <Text style={styles.label}>{WORKOUT_COPY.lengthTitle}</Text>
          <View style={styles.row}>
            {WORKOUT_COPY.durations.map((m) => (
              <Chip
                key={m}
                label={WORKOUT_COPY.durationChip(m)}
                accessibilityLabel={WORKOUT_COPY.durationA11y(m)}
                selected={minutes === m}
                onPress={() => setMinutes(m)}
              />
            ))}
          </View>

          {type && minutes ? (
            <View style={styles.growth}>
              <Icon name="sprout" size={20} color={colors.primary} />
              <Text style={styles.growthText}>{workoutGrowthLine(minutesSoFar, minutes)}</Text>
            </View>
          ) : null}

          <View style={{ height: 8 }} />
          <Button
            label={initial ? WORKOUT_COPY.update : WORKOUT_COPY.save}
            disabled={!type || !minutes}
            onPress={() => type && minutes && onSave(type, minutes)}
          />
          <Button label={WORKOUT_COPY.cancel} variant="link" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.scrim },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 20,
    paddingTop: 10,
    paddingBottom: 32,
    ...elevation.raised,
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.divider, marginBottom: 14 },
  title: { ...font.bold, fontSize: 24, color: colors.textPrimary },
  subtitle: { ...font.regular, fontSize: 15, lineHeight: 22, color: colors.textSecondary, marginTop: 4, marginBottom: 14 },
  label: { ...font.semibold, fontSize: 15, color: colors.textSecondary, marginTop: 8, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  growth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 12,
    marginTop: 6,
  },
  growthText: { ...font.medium, flex: 1, fontSize: 14, lineHeight: 20, color: colors.textPrimary },
});
