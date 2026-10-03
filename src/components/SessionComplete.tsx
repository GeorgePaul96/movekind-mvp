import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Alert } from 'react-native';
import { Card } from './Card';
import { Button } from './Button';
import { Chip } from './Chip';
import { colors, stateColors } from '@/constants/colors';
import { INTENTION, MOOD_COPY, SESSION_COPY } from '@/constants/copy';
import { useSessionStore } from '@/store/sessionStore';
import { supabase } from '@/services/supabase';

export function SessionComplete() {
  const session = useSessionStore((s) => s.currentSession);
  const checkIn = useSessionStore((s) => s.currentCheckIn);
  const completeSession = useSessionStore((s) => s.completeSession);
  const loading = useSessionStore((s) => s.loading);

  const intention = checkIn?.intention?.trim();

  const [delta, setDelta] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<'rate' | 'win'>('rate');
  const [winDetails, setWinDetails] = useState<{ emoji: string; title: string; desc: string } | null>(null);

  const handleSubmitRating = async () => {
    if (!session) return;
    
    try {
      // 1. Check for Capacity Wins before resetting session
      // Check if session was completed in Overloaded or Recovering state
      const isResilient = session.state === 'overloaded' || session.state === 'recovering';
      
      // Check sessions completed this week
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
      weekStart.setHours(0,0,0,0);

      const { count } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user_id)
        .eq('status', 'completed')
        .gte('created_at', weekStart.toISOString());

      const thisWeekCompletedCount = (count || 0) + 1; // Add this current session

      if (isResilient) {
        setWinDetails({
          emoji: '💪',
          title: SESSION_COPY.resilienceTitle,
          desc: SESSION_COPY.resilienceDesc(MOOD_COPY[session.state].label),
        });
      } else if (thisWeekCompletedCount === 3) {
        setWinDetails({
          emoji: '🌿',
          title: SESSION_COPY.consistencyTitle,
          desc: SESSION_COPY.consistencyDesc,
        });
      } else {
        setWinDetails({
          emoji: '✨',
          title: SESSION_COPY.showedUpTitle,
          desc: SESSION_COPY.showedUpDesc,
        });
      }

      setStep('win');
    } catch (err) {
      console.warn('Error evaluating wins:', err);
      // Fallback directly to complete session if evaluation fails
      await completeSession(delta, notes);
    }
  };

  const handleFinish = async () => {
    try {
      await completeSession(delta, notes);
    } catch (err) {
      Alert.alert('Error completing session', (err as Error).message);
    }
  };

  if (step === 'win' && winDetails) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.winEmoji} importantForAccessibility="no" accessibilityElementsHidden>{winDetails.emoji}</Text>
          <Text style={styles.winTitle} accessibilityRole="header">{winDetails.title}</Text>
          <Text style={styles.winDesc}>{winDetails.desc}</Text>

          <View style={styles.noStreakNotice}>
            <Text style={styles.noStreakText}>{SESSION_COPY.noStreaks}</Text>
          </View>

          <View style={{ height: 24, width: '100%' }} />
          <View style={{ width: '100%' }}>
            <Button label={SESSION_COPY.done} loading={loading} onPress={handleFinish} />
          </View>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.congratsEmoji} importantForAccessibility="no" accessibilityElementsHidden>🎉</Text>
        <Text style={styles.title} accessibilityRole="header">{SESSION_COPY.completeTitle}</Text>
        <Text style={styles.subtitle}>{SESSION_COPY.completeSub}</Text>

        {intention ? (
          <View style={styles.intentionCard}>
            <Text style={styles.intentionLabel}>{INTENTION.reflectionTitle}</Text>
            <Text style={styles.intentionText}>“{intention}”</Text>
          </View>
        ) : null}

        <View style={styles.separator} />

        <Text style={styles.sectionTitle} accessibilityRole="header">{SESSION_COPY.rateTitle}</Text>
        <Text style={styles.desc}>{SESSION_COPY.rateDesc}</Text>

        <View style={styles.ratingGrid}>
          {[0, 2].map((row) => (
            <View key={row} style={styles.ratingRow}>
              {SESSION_COPY.ratings.slice(row, row + 2).map((opt) => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  accessibilityLabel={`I feel ${opt.spoken.toLowerCase()}`}
                  selected={delta === opt.value}
                  onPress={() => setDelta(opt.value)}
                />
              ))}
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>{SESSION_COPY.notesTitle}</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          accessibilityLabel="Session notes, optional"
          placeholder={SESSION_COPY.notesPlaceholder}
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
          style={styles.notesInput}
        />

        <View style={{ height: 24, width: '100%' }} />
        <View style={{ width: '100%' }}>
          <Button
            label={SESSION_COPY.saveRating}
            accessibilityLabel={SESSION_COPY.saveRatingA11y}
            onPress={handleSubmitRating}
          />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 12 },
  card: { padding: 20, borderRadius: 20, alignItems: 'center' },
  congratsEmoji: { fontSize: 48, marginBottom: 8 },
  winEmoji: { fontSize: 64, marginVertical: 16 },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  winTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: 20 },
  winDesc: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  intentionCard: {
    width: '100%',
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
  },
  intentionLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.secondaryText,
    marginBottom: 4,
  },
  intentionText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 21,
    fontStyle: 'italic',
  },
  separator: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    width: '100%',
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  desc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  ratingGrid: { width: '100%', gap: 8 },
  ratingRow: { flexDirection: 'row', gap: 8, width: '100%' },
  notesInput: {
    width: '100%',
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    height: 80,
  },
  noStreakNotice: {
    backgroundColor: stateColors.regulated.soft,
    padding: 12,
    borderRadius: 14,
    borderColor: stateColors.regulated.ink,
    borderWidth: 1,
  },
  noStreakText: {
    fontSize: 14,
    color: stateColors.regulated.ink,
    textAlign: 'center',
    lineHeight: 20,
  },
});
