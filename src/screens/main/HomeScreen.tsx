import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { useCheckInStore } from '@/store/checkInStore';
import { getRecommendation } from '@/domain/recovery/recommendationEngine';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const { latestCheckIn, loadLatest } = useCheckInStore();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  useEffect(() => {
    if (user) {
      loadLatest(user.id);
    }
  }, [user, loadLatest]);

  const onCheckIn = () => {
    navigation.navigate('CheckIn');
  };

  if (!latestCheckIn) {
    return (
      <Screen>
        <Header tag="Good morning" title="How are you moving today?" />
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>You haven't checked in today.</Text>
          <Button label="Start Daily Check-In" onPress={onCheckIn} />
        </Card>
      </Screen>
    );
  }

  const rec = getRecommendation(latestCheckIn.generated_state);

  return (
    <Screen>
      <Header tag="Nervous System State" title={latestCheckIn.generated_state} />

      <Card style={styles.card}>
        <Text style={styles.label}>Today's Recommendation</Text>
        <Text style={styles.title}>{rec.title}</Text>
        <Text style={styles.desc}>{rec.description}</Text>
        <Text style={styles.rationale}>Why: {rec.rationale}</Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.label}>Last Check-In</Text>
        <Text style={styles.meta}>
          {format(new Date(latestCheckIn.created_at), 'h:mm a, MMM d')}
        </Text>
        <Text style={styles.meta}>Energy: {latestCheckIn.energy}/10</Text>
        <Text style={styles.meta}>Stress: {latestCheckIn.stress_load}/10</Text>
      </Card>

      <Button label="Update Check-In" onPress={onCheckIn} variant="sage-soft" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyCard: { padding: 24, alignItems: 'center', gap: 16, marginTop: 20 },
  emptyText: { color: colors.ink, fontSize: 16, fontWeight: '500' },
  card: { marginBottom: 12, padding: 16 },
  label: { fontSize: 12, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  title: { fontSize: 18, color: colors.ink, fontWeight: '600', marginBottom: 4 },
  desc: { fontSize: 14, color: colors.ink, lineHeight: 20, marginBottom: 8 },
  rationale: { fontSize: 13, color: colors.sageDark, fontStyle: 'italic' },
  meta: { fontSize: 14, color: colors.ink, marginBottom: 4 },
});
