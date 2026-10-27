import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { GARDEN_COPY, SHEET_COPY, STEPS_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import { localDayKey, startOfLocalDay } from '@/domain/garden/days';
import { useGardenStore } from '@/store/gardenStore';
import { Sheet } from '../Sheet';

/** The grass and path: today's steps and the week, or a calm line on how steps arrive. */
export function StepsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const status = useGardenStore((s) => s.stepsStatus);
  const stepsByDay = useGardenStore((s) => s.stepsByDay);
  const allowSteps = useGardenStore((s) => s.allowSteps);
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => startOfLocalDay(now, -i));

  return (
    <Sheet visible={visible} title={SHEET_COPY.stepsTitle} subtitle={SHEET_COPY.stepsSubtitle} onClose={onClose}>
      {status === 'granted' ? (
        <>
          {days.map((d) => (
            <View key={localDayKey(d)} style={styles.row}>
              <Text style={styles.day}>{STEPS_COPY.day(d)}</Text>
              <Text style={styles.count}>{STEPS_COPY.count(stepsByDay[localDayKey(d)] ?? 0)}</Text>
            </View>
          ))}
          <Text style={styles.note}>{STEPS_COPY.weekNote}</Text>
        </>
      ) : status === 'ask' ? (
        <>
          <Text style={styles.note}>{STEPS_COPY.allowHint}</Text>
          <Button label={STEPS_COPY.allowButton} onPress={() => allowSteps().catch(() => {})} />
        </>
      ) : (
        <Text style={styles.note}>
          {status === 'denied'
            ? STEPS_COPY.offHint
            : status === 'unavailable'
              ? STEPS_COPY.unavailableHint
              : GARDEN_COPY.stepsHint}
        </Text>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
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
  note: { ...font.regular, fontSize: 15, lineHeight: 22, color: colors.textSecondary, marginVertical: 12 },
});
