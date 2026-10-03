import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MoodTile } from '@/components/MoodTile';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { CHECKIN_COPY, checkInPrompt } from '@/constants/copy';
import { MOODS } from '@/domain/checkin/moods';
import { useSessionStore } from '@/store/sessionStore';
import type { UserState } from '@/types';

/** The whole check-in: one tap on a tile. */
export function MoodPicker({ name }: { name?: string | null }) {
  const logCheckIn = useSessionStore((s) => s.logCheckIn);
  const safeHarbor = useSessionStore((s) => s.safeHarborBypass);
  const loading = useSessionStore((s) => s.loading);
  const [picked, setPicked] = useState<UserState | null>(null);
  const [failed, setFailed] = useState(false);

  const pick = async (mood: UserState) => {
    setPicked(mood);
    setFailed(false);
    try {
      await logCheckIn(mood);
    } catch {
      setFailed(true); // keep the tile selected; one tap retries
    }
  };

  return (
    <View>
      <Text style={styles.prompt} accessibilityRole="header">{checkInPrompt(name)}</Text>
      <View style={styles.grid}>
        {[0, 2].map((row) => (
          <View key={row} style={styles.row}>
            {MOODS.slice(row, row + 2).map((m) => (
              <MoodTile key={m} mood={m} selected={picked === m} disabled={loading} onPress={() => pick(m)} />
            ))}
          </View>
        ))}
      </View>
      {failed && picked && (
        <Button label={CHECKIN_COPY.saveFailed} variant="link" onPress={() => pick(picked)} />
      )}
      <Button
        label={CHECKIN_COPY.gentleReset}
        variant="link"
        disabled={loading}
        onPress={() => safeHarbor().catch((e) => console.warn('Gentle reset error:', e))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  prompt: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginBottom: 16, lineHeight: 30 },
  grid: { gap: 10, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 10 },
});
