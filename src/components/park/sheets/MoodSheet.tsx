import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip } from '@/components/Chip';
import { MoodPicker } from '@/components/home/MoodPicker';
import { SHEET_COPY, UNWELL_COPY } from '@/constants/copy';
import { useGardenStore } from '@/store/gardenStore';
import { Sheet } from '../Sheet';

/** The flowerbed: one tap on a mood plants today's flower; then "Feeling unwell today" appears. */
export function MoodSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  // Select the values (not the functions) so the sheet redraws when they change.
  const todayMood = useGardenStore((s) => s.todayMood());
  const todayUnwell = useGardenStore((s) => s.todayUnwell());
  const setUnwell = useGardenStore((s) => s.setUnwell);

  return (
    <Sheet visible={visible} title={SHEET_COPY.moodTitle} subtitle={SHEET_COPY.moodSubtitle} onClose={onClose}>
      <MoodPicker hideTitle />
      {todayMood && (
        <View style={styles.unwell}>
          <Chip
            label={UNWELL_COPY.toggle}
            selected={todayUnwell}
            // Read the live value: two quick taps must not both send the same answer.
            onPress={() => setUnwell(!useGardenStore.getState().todayUnwell()).catch(() => {})}
          />
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  unwell: { flexDirection: 'row', marginTop: 4, marginBottom: 8 },
});
