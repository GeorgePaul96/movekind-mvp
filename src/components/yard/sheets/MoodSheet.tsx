import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Chip } from '@/components/Chip';
import { Icon, type IconName } from '@/components/Icon';
import { Sheet } from '@/components/park/Sheet';
import { colors } from '@/constants/colors';
import { SHEET_COPY, UNWELL_COPY, YARD_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import { YARD_MOODS, yardMoodColors } from '@/domain/yard/moods';
import { useGardenStore } from '@/store/gardenStore';
import type { YardMood } from '@/types';

const MOOD_ICON: Record<YardMood, IconName> = {
  tired: 'weather-night',
  low: 'sprout-outline',
  frustrated: 'weather-cloudy',
  steady: 'white-balance-sunny',
  buzzing: 'lightning-bolt-outline',
};

interface Props {
  visible: boolean;
  onSelectMood?: (mood: YardMood) => void;
  onClose: () => void;
}

export function MoodSheet({ visible, onSelectMood, onClose }: Props) {
  const todayMood = useGardenStore((s) => s.todayYardMood());
  const todayUnwell = useGardenStore((s) => s.todayUnwell());
  const logMood = useGardenStore((s) => s.logYardMood);
  const setUnwell = useGardenStore((s) => s.setUnwell);

  const pick = (m: YardMood) => {
    logMood(m).catch(() => {});
    onSelectMood?.(m);
  };

  return (
    <Sheet
      visible={visible}
      title={SHEET_COPY.moodTitle}
      subtitle={SHEET_COPY.moodSubtitle}
      onClose={onClose}
    >
      <View style={styles.grid}>
        {YARD_MOODS.map((m) => {
          const c = yardMoodColors(m);
          const copy = YARD_COPY.moods[m];
          const selected = todayMood === m;
          return (
            <Pressable
              key={m}
              accessibilityRole="button"
              accessibilityLabel={copy.label}
              accessibilityState={{ selected }}
              onPress={() => pick(m)}
              style={[
                styles.tile,
                { backgroundColor: c.soft, borderColor: selected ? c.ink : 'transparent' },
              ]}
            >
              <View style={styles.tileTop}>
                <View style={styles.iconCircle}>
                  <Icon name={MOOD_ICON[m]} size={20} color={c.ink} />
                </View>
                {selected ? (
                  <Icon name="check" size={20} color={c.ink} />
                ) : (
                  <Text style={[styles.flavor, { color: c.ink }]}>{copy.flavor}</Text>
                )}
              </View>
              <Text style={[styles.label, { color: c.ink }]}>{copy.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {todayMood && (
        <View style={styles.unwellRow}>
          <Chip
            label={UNWELL_COPY.toggle}
            selected={todayUnwell}
            onPress={() => setUnwell(!useGardenStore.getState().todayUnwell()).catch(() => {})}
          />
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 10, marginBottom: 10 },
  tile: {
    minHeight: 72,
    borderRadius: 20,
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flavor: { ...font.medium, fontSize: 13 },
  label: { ...font.bold, fontSize: 16, lineHeight: 21, marginTop: 6 },
  unwellRow: { flexDirection: 'row', marginTop: 4, marginBottom: 8 },
});