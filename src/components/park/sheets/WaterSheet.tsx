import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { colors, gardenColors } from '@/constants/colors';
import { WATER_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import { isSameLocalDay } from '@/domain/garden/days';
import { useGardenStore } from '@/store/gardenStore';
import { Sheet } from '../Sheet';

/** Water from the river: a drop appears for each glass. No empty slots, no target. */
export function WaterSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const water = useGardenStore((s) => s.water);
  const addGlass = useGardenStore((s) => s.addGlass);
  const removeLastGlassToday = useGardenStore((s) => s.removeLastGlassToday);
  const glasses = water.filter((w) => isSameLocalDay(new Date(w.created_at), new Date())).length;
  const quiet = (p: Promise<unknown>) => p.catch(() => {}); // the store keeps a calm error message

  return (
    <Sheet visible={visible} title={WATER_COPY.title} subtitle={WATER_COPY.subtitle} onClose={onClose}>
      <View style={styles.drops} accessible accessibilityLabel={WATER_COPY.count(glasses)}>
        {Array.from({ length: glasses }, (_, i) => (
          <View key={i} testID="drop" style={styles.drop}>
            <Icon name="water" size={20} color={gardenColors.streamDeep} />
          </View>
        ))}
      </View>
      <Text style={styles.count}>{WATER_COPY.count(glasses)}</Text>
      <Button label={WATER_COPY.add} onPress={() => quiet(addGlass())} />
      {glasses > 0 && <Button label={WATER_COPY.remove} variant="link" size="sm" onPress={() => quiet(removeLastGlassToday())} />}
      <View style={styles.note}>
        <Icon name="heart-outline" size={18} color={colors.primary} />
        <Text style={styles.noteText}>{WATER_COPY.note}</Text>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  drops: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, minHeight: 8, marginBottom: 6 },
  drop: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: { ...font.semibold, fontSize: 15, color: colors.textPrimary, marginBottom: 12 },
  note: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
  },
  noteText: { ...font.regular, flex: 1, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
});
