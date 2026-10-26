import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { colors, elevation } from '@/constants/colors';
import { STEPS_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import { Icon } from '@/components/Icon';
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
          <View style={styles.handle} />
          <Text style={styles.title} accessibilityRole="header">{STEPS_COPY.weekTitle}</Text>
          {days.map((d) => (
            <View key={localDayKey(d)} style={styles.row}>
              <Text style={styles.day}>{STEPS_COPY.day(d)}</Text>
              <Text style={styles.count}>{STEPS_COPY.count(stepsByDay[localDayKey(d)] ?? 0)}</Text>
            </View>
          ))}
          <View style={styles.noteBox}>
            <Icon name="leaf" size={18} color={colors.primary} />
            <Text style={styles.note}>{STEPS_COPY.weekNote}</Text>
          </View>
          <View style={{ height: 12 }} />
          <Button label={STEPS_COPY.close} onPress={onClose} />
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
  title: { ...font.bold, fontSize: 24, color: colors.primary, marginBottom: 10 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  day: { ...font.medium, fontSize: 16, color: colors.textPrimary },
  count: { ...font.bold, fontSize: 16, color: colors.textPrimary },
  noteBox: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: colors.surfaceSecondary, borderRadius: 16, padding: 14, marginTop: 8 },
  note: { ...font.regular, flex: 1, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
});
