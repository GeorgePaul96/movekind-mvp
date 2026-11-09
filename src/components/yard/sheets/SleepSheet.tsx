import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Sheet } from '@/components/park/Sheet';
import { colors } from '@/constants/colors';
import { YARD_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import type { SleepLog } from '@/types';

const FEELS: readonly NonNullable<SleepLog['feel']>[] = ['restless', 'okay', 'deep'];

interface Props {
  visible: boolean;
  initial?: SleepLog | null;
  onSave: (hours: number, feel: SleepLog['feel']) => void;
  onClose: () => void;
}

/**
 * Pudding's sleep sheet: half-hour stepper starting empty ("Tap + to add")
 * plus an optional feel row. Save stays disabled until hours are picked.
 */
export function SleepSheet({ visible, initial, onSave, onClose }: Props) {
  const [hours, setHours] = useState<number | null>(null);
  const [feel, setFeel] = useState<SleepLog['feel']>(null);

  useEffect(() => {
    if (visible) {
      setHours(initial?.hours ?? null);
      setFeel(initial?.feel ?? null);
    }
  }, [visible, initial]);

  const stepHours = (delta: number) => {
    setHours((prev) => {
      if (prev === null) {
        return delta > 0 ? 7 : null;
      }
      const next = Math.max(0.5, Math.min(16, prev + delta));
      return next;
    });
  };

  return (
    <Sheet
      visible={visible}
      title={YARD_COPY.sleepSheet.title}
      subtitle={YARD_COPY.sleepSheet.subtitle}
      onClose={onClose}
    >
      <View style={styles.stepper}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={YARD_COPY.sleepSheet.lessA11y}
          disabled={hours === null || hours <= 0.5}
          onPress={() => stepHours(-0.5)}
          style={[styles.stepBtn, (hours === null || hours <= 0.5) && styles.stepBtnDisabled]}
        >
          <Text style={styles.stepSymbol}>-</Text>
        </Pressable>

        <View style={styles.valueWrap}>
          <Text style={styles.valueText}>
            {hours === null ? YARD_COPY.sleepSheet.emptyHours : YARD_COPY.sleepSheet.hoursLabel(hours)}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={YARD_COPY.sleepSheet.moreA11y}
          onPress={() => stepHours(0.5)}
          style={styles.stepBtn}
        >
          <Text style={styles.stepSymbol}>+</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>{YARD_COPY.sleepSheet.feelTitle}</Text>
      <View style={styles.row}>
        {FEELS.map((f) => (
          <Chip
            key={f}
            label={YARD_COPY.sleepSheet.feels[f]}
            selected={feel === f}
            onPress={() => setFeel((prev) => (prev === f ? null : f))}
          />
        ))}
      </View>

      <View style={styles.spacer} />
      <Button
        label={YARD_COPY.sleepSheet.save}
        disabled={hours === null}
        onPress={() => hours !== null && onSave(hours, feel)}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: { opacity: 0.4 },
  stepSymbol: { ...font.bold, fontSize: 22, color: colors.primary },
  valueWrap: { flex: 1, alignItems: 'center', paddingHorizontal: 12 },
  valueText: { ...font.extrabold, fontSize: 20, color: colors.textPrimary },
  label: { ...font.semibold, fontSize: 15, color: colors.textSecondary, marginTop: 12, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  spacer: { height: 10 },
});