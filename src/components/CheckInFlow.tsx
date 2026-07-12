import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { Card } from './Card';
import { Slider } from './Slider';
import { colors, stateColors } from '@/constants/colors';
import { INTENTION } from '@/constants/copy';
import { useSessionStore } from '@/store/sessionStore';
import type { CheckIn } from '@/types';

// `color` is the accessible accent (safe with white text); `tint` fills the slider.
const STATE_DETAILS = [
  { label: 'Overloaded', color: stateColors.overloaded.accent, tint: stateColors.overloaded.tint, desc: 'Low capacity. Slow active recovery and somatic decompression recommended.' },
  { label: 'Recovering', color: stateColors.recovering.accent, tint: stateColors.recovering.tint, desc: 'Gently rebuilding. Mobilizing stretches and light dynamic movements suggested.' },
  { label: 'Recovering', color: stateColors.recovering.accent, tint: stateColors.recovering.tint, desc: 'Gently rebuilding. Mobilizing stretches and light dynamic movements suggested.' },
  { label: 'Regulated', color: stateColors.regulated.accent, tint: stateColors.regulated.tint, desc: 'Stable capacity. Steady strength training and standard physical conditioning.' },
  { label: 'Activated', color: stateColors.activated.accent, tint: stateColors.activated.tint, desc: 'Peak capacity. Higher-intensity movements and progressive bodyweight challenge.' },
];

export function CheckInFlow() {
  const checkIn = useSessionStore((s) => s.checkIn);
  const safeHarbor = useSessionStore((s) => s.safeHarborBypass);
  const loading = useSessionStore((s) => s.loading);

  const [energy, setEnergy] = useState(3);
  const [sleep, setSleep] = useState<CheckIn['sleep_quality']>('fair');
  const [intention, setIntention] = useState('');

  const activeState = STATE_DETAILS[energy - 1]!;

  const handleGenerate = async () => {
    try {
      await checkIn(energy, sleep, intention);
    } catch (err) {
      console.warn('Check-in error:', err);
    }
  };

  const handleSafeHarbor = async () => {
    try {
      await safeHarbor();
    } catch (err) {
      console.warn('Safe Harbor error:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title} accessibilityRole="header">Daily Check-In</Text>
        <Text style={styles.subtitle}>How is your energy level right now?</Text>

        <View style={styles.scaleRow}>
          <Text style={{ fontSize: 24 }} importantForAccessibility="no" accessibilityElementsHidden>🔋</Text>
          <Text
            style={[styles.stateText, { color: activeState.color }]}
            accessibilityLiveRegion="polite"
            accessibilityLabel={`Energy: ${activeState.label}, ${energy} out of 5`}
          >
            {activeState.label} ({energy}/5)
          </Text>
        </View>

        <Slider
          min={1}
          max={5}
          value={energy}
          onChange={setEnergy}
          color={activeState.tint}
          accessibilityLabel="Energy level"
        />

        <Text style={styles.stateDesc}>{activeState.desc}</Text>

        <Text style={[styles.subtitle, { marginTop: 24 }]}>How did you sleep last night?</Text>
        <View style={styles.sleepRow}>
          {(['good', 'fair', 'poor'] as const).map((s) => {
            const selected = sleep === s;
            return (
              <Pressable
                key={s}
                onPress={() => setSleep(s)}
                accessibilityRole="button"
                accessibilityLabel={`Sleep quality: ${s}`}
                accessibilityState={{ selected }}
                style={[
                  styles.sleepBtn,
                  selected && { backgroundColor: activeState.color, borderColor: activeState.color },
                ]}
              >
                <Text style={[styles.sleepText, selected && { color: colors.onPrimary }]}>
                  {s === 'good' ? '✨ Good' : s === 'fair' ? '😐 Fair' : '😴 Poor'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.subtitle, { marginTop: 24 }]}>{INTENTION.label}</Text>
        <Text style={styles.intentionHint}>{INTENTION.hint}</Text>
        <TextInput
          value={intention}
          onChangeText={setIntention}
          accessibilityLabel="Intention for today, optional"
          placeholder={INTENTION.placeholder}
          placeholderTextColor={colors.textMuted}
          maxLength={80}
          returnKeyType="done"
          style={styles.intentionInput}
        />

        <View style={{ height: 24 }} />

        {loading ? (
          <ActivityIndicator size="small" color={colors.sage} />
        ) : (
          <Pressable
            style={[styles.actionBtn, { backgroundColor: activeState.color }]}
            onPress={handleGenerate}
            accessibilityRole="button"
            accessibilityLabel="Compose today's session"
          >
            <Text style={styles.actionBtnText}>Compose Today's Session</Text>
          </Pressable>
        )}
      </Card>

      <Pressable
        style={styles.safeHarborBtn}
        onPress={handleSafeHarbor}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Skip check-in and start a 5 minute Safe Harbor recovery session"
        accessibilityState={{ disabled: loading }}
      >
        <Text style={styles.safeHarborText}>
          Too tired to check in? Bypass to a 5-min Safe Harbor recovery
        </Text>
      </Pressable>
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
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  scaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 16,
  },
  stateText: {
    fontSize: 18,
    fontWeight: '700',
  },
  stateDesc: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
    marginTop: 12,
  },
  sleepRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  sleepBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  sleepText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'capitalize',
  },
  intentionHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: -6,
    marginBottom: 10,
    lineHeight: 16,
  },
  intentionInput: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  actionBtnText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  safeHarborBtn: {
    marginTop: 20,
    alignItems: 'center',
    padding: 10,
  },
  safeHarborText: {
    fontSize: 12,
    color: colors.muted,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});
