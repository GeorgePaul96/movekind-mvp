import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WeekCard } from '@/components/WeekCard';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { CHECKIN_COPY, MOOD_COPY } from '@/constants/copy';
import { mapEnergyToState } from '@/domain/checkin/moods';
import { useSessionStore } from '@/store/sessionStore';

/** Where the old dead end was: today's mood, this week vs last, and a way to do more. */
export function WeekView({ name }: { name?: string | null }) {
  const week = useSessionStore((s) => s.week);
  const loadWeek = useSessionStore((s) => s.loadWeek);
  const checkIn = useSessionStore((s) => s.currentCheckIn);
  const start = useSessionStore((s) => s.startTodaysSession);
  const change = useSessionStore((s) => s.changeTodaysCheckIn);
  const loading = useSessionStore((s) => s.loading);

  useEffect(() => {
    loadWeek();
  }, [loadWeek]);

  const mood = checkIn ? MOOD_COPY[mapEnergyToState(checkIn.energy_score)] : null;

  return (
    <View style={{ gap: 12 }}>
      {mood && <Text style={styles.today}>Today: {mood.emoji} {mood.label}</Text>}
      <Text style={styles.title} accessibilityRole="header">{CHECKIN_COPY.niceWeek(name)}</Text>
      <WeekCard week={week} />
      {checkIn && (
        <Button
          label={CHECKIN_COPY.anotherSession}
          variant="secondary"
          loading={loading}
          onPress={() => start().catch((e) => console.warn('Start session error:', e))}
        />
      )}
      {checkIn && <Button label={CHECKIN_COPY.changeToday} variant="link" onPress={change} />}
    </View>
  );
}

const styles = StyleSheet.create({
  today: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
});
