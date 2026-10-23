import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MoodTile } from '@/components/MoodTile';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { CHECKIN_COPY, checkInPrompt } from '@/constants/copy';
import { MOODS } from '@/domain/checkin/moods';
import { useGardenStore } from '@/store/gardenStore';
import type { UserState } from '@/types';

/** The whole check-in: one tap on a tile plants today's flower. */
export function MoodPicker({ name, onPicked }: { name?: string | null; onPicked?: () => void }) {
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
      <Text style={styles.prompt} accessibilityRole="header">{checkInPrompt(name)}</Text>
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
  prompt: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 12, lineHeight: 26 },
  grid: { gap: 10, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 10 },
});
