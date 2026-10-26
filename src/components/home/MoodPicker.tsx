import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MoodTile } from '@/components/MoodTile';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { CHECKIN_COPY, GARDEN_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import { MOODS } from '@/domain/checkin/moods';
import { useGardenStore } from '@/store/gardenStore';
import type { UserState } from '@/types';

/** The whole check-in: one tap on a tile plants today's flower. */
export function MoodPicker({ onPicked }: { onPicked?: () => void }) {
  const logMood = useGardenStore((s) => s.logMood);
  const [picked, setPicked] = useState<UserState | null>(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const pick = async (mood: UserState) => {
    setPicked(mood);
    setFailed(false);
    setSaving(true);
    try {
      await logMood(mood);
      onPicked?.();
    } catch {
      setFailed(true); // keep the tile selected; one tap retries
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
      <View style={styles.head}>
        <Text style={styles.prompt} accessibilityRole="header">{GARDEN_COPY.moodTitle}</Text>
        <Text style={styles.aside}>{GARDEN_COPY.moodAside}</Text>
      </View>
      <View style={styles.grid}>
        {[0, 2].map((row) => (
          <View key={row} style={styles.row}>
            {MOODS.slice(row, row + 2).map((m) => (
              <MoodTile key={m} mood={m} selected={picked === m} disabled={saving} onPress={() => pick(m)} />
            ))}
          </View>
        ))}
      </View>
      {failed && picked && (
        <Button label={CHECKIN_COPY.saveFailed} variant="link" onPress={() => pick(picked)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  prompt: { ...font.bold, fontSize: 20, lineHeight: 26, color: colors.textPrimary },
  aside: { ...font.medium, fontSize: 13, color: colors.textSecondary },
  grid: { gap: 10, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 10 },
});
