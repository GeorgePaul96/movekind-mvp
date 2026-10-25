import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { colors, elevation } from '@/constants/colors';
import { STEPS_COPY } from '@/constants/copy';
import { localDayKey, startOfLocalDay } from '@/domain/garden/days';

interface Props {
  visible: boolean;
  stepsByDay: Record<string, number>;
  onClose: () => void;
}

/** The last seven days of steps, newest first. Plain counts: no goal, no bars to fill. */
export function StepsWeekSheet({ visible, stepsByDay, onClose }: Props) {
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => startOfLocalDay(now, -i));
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title} accessibilityRole="header">{STEPS_COPY.weekTitle}</Text>
          {days.map((d) => (
            <View key={localDayKey(d)} style={styles.row}>
              <Text style={styles.day}>{STEPS_COPY.day(d)}</Text>
              <Text style={styles.count}>{STEPS_COPY.count(stepsByDay[localDayKey(d)] ?? 0)}</Text>
            </View>
          ))}
          <View style={{ height: 12 }} />
          <Button label={STEPS_COPY.close} variant="secondary" onPress={onClose} />
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
  title: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  day: { fontSize: 16, color: colors.textPrimary },
  count: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
});
