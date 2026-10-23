import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { colors, elevation } from '@/constants/colors';
import { WORKOUT_COPY } from '@/constants/copy';
import type { WorkoutType } from '@/types';

const TYPES: WorkoutType[] = ['walk', 'run', 'yoga', 'gym', 'cycle', 'sport', 'dance', 'other'];
const PER_ROW = 4;

interface Props {
  visible: boolean;
  /** Prefill when editing an existing workout. */
  initial?: { type: WorkoutType; minutes: number } | null;
  onSave: (type: WorkoutType, minutes: number) => void;
  onClose: () => void;
}

/** The two-tap workout log: what you did, roughly how long. Never how to do it. */
export function WorkoutSheet({ visible, initial, onSave, onClose }: Props) {
  const [type, setType] = useState<WorkoutType | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      setType(initial?.type ?? null);
      setMinutes(initial?.minutes ?? null);
    }
  }, [visible, initial]);

  const rows = [TYPES.slice(0, PER_ROW), TYPES.slice(PER_ROW)];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title} accessibilityRole="header">{WORKOUT_COPY.title}</Text>
          {rows.map((row, i) => (
            <View key={i} style={styles.row}>
              {row.map((t) => (
                <Chip key={t} label={WORKOUT_COPY.types[t]} selected={type === t} onPress={() => setType(t)} />
              ))}
            </View>
          ))}

          <Text style={styles.subtitle}>{WORKOUT_COPY.lengthTitle}</Text>
          <View style={styles.row}>
            {WORKOUT_COPY.durations.map((m) => (
              <Chip key={m} label={WORKOUT_COPY.minutes(m)} selected={minutes === m} onPress={() => setMinutes(m)} />
            ))}
          </View>

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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    ...elevation.raised,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 12 },
  subtitle: { fontSize: 15, fontWeight: '700', color: colors.textSecondary, marginTop: 8, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
});
