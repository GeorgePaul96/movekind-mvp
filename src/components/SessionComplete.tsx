import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Card } from './Card';
import { colors } from '@/constants/colors';
import { INTENTION } from '@/constants/copy';
import { useSessionStore } from '@/store/sessionStore';
import { supabase } from '@/services/supabase';

// Selected background colors — all WCAG-AA against the white label.
const RATING_OPTIONS = [
  { value: -1, emoji: '🔴', label: 'Worse', color: colors.error },
  { value: 0, emoji: '😐', label: 'Same', color: colors.textSecondary },
  { value: 1, emoji: '🌱', label: 'Better', color: colors.primary },
  { value: 2, emoji: '✨', label: 'Much Better', color: colors.warmAccent },
];

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
          title: 'Resilience Win',
          desc: `You showed up and completed movement today despite feeling ${session.state}. This is true attunement and self-trust.`,
        });
      } else if (thisWeekCompletedCount === 3) {
        setWinDetails({
          emoji: '🌿',
          title: 'Consistency Win',
          desc: 'You completed 3 sessions this week. Beautiful, steady momentum built at your own pace.',
        });
      } else {
        setWinDetails({
          emoji: '✨',
          title: 'Attunement Win',
          desc: 'You listened to your daily capacity and completed a routine composed specifically for your nervous system.',
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
            <Text style={styles.noStreakText}>
              🌸 Remember: MoveKind has no streaks. Your progress is preserved, and rest is actively celebrated.
            </Text>
          </View>

          <View style={{ height: 24 }} />

          {loading ? (
            <ActivityIndicator size="small" color={colors.sage} />
          ) : (
            <Pressable
              style={styles.finishBtn}
              onPress={handleFinish}
              accessibilityRole="button"
              accessibilityLabel="Go to dashboard"
            >
              <Text style={styles.finishBtnText}>Go to Dashboard</Text>
            </Pressable>
          )}
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.congratsEmoji} importantForAccessibility="no" accessibilityElementsHidden>🎉</Text>
        <Text style={styles.title} accessibilityRole="header">Session Complete!</Text>
        <Text style={styles.subtitle}>You completed today's adaptive routine.</Text>

        {intention ? (
          <View style={styles.intentionCard}>
            <Text style={styles.intentionLabel}>{INTENTION.reflectionTitle}</Text>
            <Text style={styles.intentionText}>“{intention}”</Text>
          </View>
        ) : null}

        <View style={styles.separator} />

        <Text style={styles.sectionTitle}>How is your capacity right now?</Text>
        <Text style={styles.desc}>Rate how your body feels compared to before you started:</Text>

        <View style={styles.ratingRow}>
          {RATING_OPTIONS.map((opt) => {
            const selected = delta === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setDelta(opt.value)}
                accessibilityRole="button"
                accessibilityLabel={`Capacity feels: ${opt.label}`}
                accessibilityState={{ selected }}
                style={[
                  styles.ratingBtn,
                  selected && { backgroundColor: opt.color, borderColor: opt.color },
                ]}
              >
                <Text style={styles.ratingEmoji}>{opt.emoji}</Text>
                <Text style={[styles.ratingLabel, selected && { color: colors.onPrimary }]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Notes (Optional)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          accessibilityLabel="Session notes, optional"
          placeholder="Any stiffness, relief, or insights?"
          placeholderTextColor={colors.hint}
          multiline
          numberOfLines={3}
          style={styles.notesInput}
        />

        <View style={{ height: 24 }} />

        <Pressable
          style={styles.finishBtn}
          onPress={handleSubmitRating}
          accessibilityRole="button"
          accessibilityLabel="Log capacity rating"
        >
          <Text style={styles.finishBtnText}>Log Capacity Delta</Text>
        </Pressable>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  card: {
    padding: 20,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    alignItems: 'center',
  },
  congratsEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  winEmoji: {
    fontSize: 64,
    marginVertical: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 4,
  },
  winTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 20,
  },
  winDesc: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
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
    fontSize: 11,
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
    fontSize: 12,
    color: colors.muted,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  desc: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 6,
    width: '100%',
  },
  ratingBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    alignItems: 'center',
  },
  ratingEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  ratingLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.muted,
    textAlign: 'center',
  },
  notesInput: {
    width: '100%',
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: colors.ink,
    textAlignVertical: 'top',
    height: 80,
  },
  finishBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  finishBtnText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  noStreakNotice: {
    backgroundColor: colors.warmLight,
    padding: 12,
    borderRadius: 14,
    borderColor: colors.warm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  noStreakText: {
    fontSize: 11,
    color: colors.warmDark,
    textAlign: 'center',
    lineHeight: 16,
  },
});
