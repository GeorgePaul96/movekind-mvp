import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { Slider } from '@/components/Slider';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/services/supabase';

const { width } = Dimensions.get('window');

const MOVEMENT_FEEL_OPTIONS = [
  { value: 'gentle', label: 'Gentle & Restorative', desc: 'Focusing on low-intensity movement that heals.' },
  { value: 'consistent', label: 'Consistent & Energizing', desc: 'Building regular habits that raise your baseline vitality.' },
  { value: 'mindful', label: 'Mindful & Grounding', desc: 'Connecting deeply with how your body feels today.' },
  { value: 'playful', label: 'Playful & Joyful', desc: 'Movement for the sheer pleasure of moving.' },
];

const FATIGUE_OPTIONS = [
  { value: 'streaks', label: 'Guilt-based streaks', desc: 'Breaking a streak feels like starting from zero.' },
  { value: 'jargon', label: 'Intimidating gym jargon', desc: 'Corporate or extreme workout terminology.' },
  { value: 'unrealistic', label: 'Unrealistic goals', desc: 'Forced daily quotas that disregard real life.' },
  { value: 'overwhelm', label: 'Feeling overwhelmed', desc: 'Too many features, checkboxes, and pressure.' },
];

const APPROACHABLE_MOVEMENT = [
  { value: 'walk', label: 'Walking', emoji: '🚶' },
  { value: 'yoga', label: 'Yoga', emoji: '🧘' },
  { value: 'stretch', label: 'Stretching', emoji: '💚' },
  { value: 'cycle', label: 'Cycling', emoji: '🚴' },
  { value: 'swim', label: 'Swimming', emoji: '🏊' },
  { value: 'weights', label: 'Weights', emoji: '🏋️' },
  { value: 'sport', label: 'Sports', emoji: '⚽' },
  { value: 'breathing', label: 'Breathing', emoji: '🌬️' },
];

export default function OnboardingScreen() {
  const user = useAuthStore((s) => s.user);
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0);
  const [movementFeel, setMovementFeel] = useState('');
  const [appFatigueReason, setAppFatigueReason] = useState('');
  const [approachableMovements, setApproachableMovements] = useState<string[]>([]);
  const [averageEnergy, setAverageEnergy] = useState(5);
  const [loading, setLoading] = useState(false);

  const toggleMovement = (m: string) => {
    setApproachableMovements((cur) =>
      cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]
    );
  };

  const handleNext = async () => {
    if (step < 3) {
      setStep((s) => s + 1);
    } else {
      setLoading(true);
      const answers = {
        movementFeel,
        appFatigueReason,
        approachableMovements,
        averageEnergy,
      };
      
      try {
        // Complete locally
        await completeOnboarding(answers);

        // Sync with Supabase (write to user metadata so it's backed up)
        if (user) {
          await supabase.auth.updateUser({
            data: { onboarding: answers },
          });

          // Create standard supportive goal for this user based on their preferences
          const defaultMinutes = movementFeel === 'gentle' ? 75 : 150;
          const defaultSessions = averageEnergy < 4 ? 3 : 4;
          
          await supabase.from('goals').upsert({
            user_id: user.id,
            weekly_minutes_target: defaultMinutes,
            weekly_sessions_target: defaultSessions,
            focus: 'overall',
          });
        }
      } catch (err) {
        console.warn('Could not sync onboarding preferences with Supabase', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const progressPct = ((step + 1) / 4) * 100;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress bar */}
      <View style={styles.progressBarWrap}>
        <View style={[styles.progressBar, { width: `${progressPct}%` }]} />
      </View>

      <View style={styles.container}>
        {/* Step 1: Movement Feel */}
        {step === 0 && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.slide}>
            <Text style={styles.tag}>MoveKind Philosophy</Text>
            <Text style={styles.title}>How do you want movement to feel in your life?</Text>
            <Text style={styles.subtitle}>Let’s build a gentle relationship with physical activity.</Text>
            
            <View style={styles.optionsWrap}>
              {MOVEMENT_FEEL_OPTIONS.map((opt) => {
                const selected = movementFeel === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setMovementFeel(opt.value)}
                    style={[styles.card, selected && styles.cardSelected]}
                  >
                    <Text style={[styles.cardLabel, selected && styles.textSelected]}>{opt.label}</Text>
                    <Text style={styles.cardDesc}>{opt.desc}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Step 2: Fitness App Fatigue */}
        {step === 1 && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.slide}>
            <Text style={styles.tag}>Your Past Struggles</Text>
            <Text style={styles.title}>What usually makes fitness apps hard to stick with?</Text>
            <Text style={styles.subtitle}>We understand that old-school guilt tracking is exhausting.</Text>

            <View style={styles.optionsWrap}>
              {FATIGUE_OPTIONS.map((opt) => {
                const selected = appFatigueReason === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setAppFatigueReason(opt.value)}
                    style={[styles.card, selected && styles.cardSelected]}
                  >
                    <Text style={[styles.cardLabel, selected && styles.textSelected]}>{opt.label}</Text>
                    <Text style={styles.cardDesc}>{opt.desc}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Step 3: Approachable Movements */}
        {step === 2 && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.slide}>
            <Text style={styles.tag}>Your Companion</Text>
            <Text style={styles.title}>What types of movement feel approachable right now?</Text>
            <Text style={styles.subtitle}>Every bit of mindful activity counts, even simple stretching.</Text>

            <View style={styles.gridWrap}>
              {APPROACHABLE_MOVEMENT.map((opt) => {
                const selected = approachableMovements.includes(opt.value);
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => toggleMovement(opt.value)}
                    style={[styles.gridCard, selected && styles.gridCardSelected]}
                  >
                    <Text style={styles.gridEmoji}>{opt.emoji}</Text>
                    <Text style={[styles.gridLabel, selected && styles.textSelected]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Step 4: Average Energy */}
        {step === 3 && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.slide}>
            <Text style={styles.tag}>Self Awareness</Text>
            <Text style={styles.title}>How is your energy level usually throughout the week?</Text>
            <Text style={styles.subtitle}>We will calibrate your targets to align comfortably with your energy.</Text>

            <View style={styles.sliderSection}>
              <View style={styles.energyIndicator}>
                <Text style={styles.energyEmoji}>
                  {averageEnergy <= 3 ? '💤' : averageEnergy <= 6 ? '🍃' : '🔋'}
                </Text>
                <Text style={styles.energyLabel}>
                  {averageEnergy <= 3 
                    ? 'Gently Restorative' 
                    : averageEnergy <= 6 
                      ? 'Steady Pace' 
                      : 'High Vitality'}
                </Text>
                <Text style={styles.energyValue}>{averageEnergy} / 10</Text>
              </View>

              <Slider
                min={1}
                max={10}
                step={1}
                value={averageEnergy}
                onChange={setAverageEnergy}
                color={colors.sage}
              />

              <Text style={styles.sliderHint}>
                There is no correct answer. We honor low-energy days just as much as active days.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Action controls */}
        <View style={styles.footer}>
          {step > 0 ? (
            <Pressable onPress={handleBack} style={styles.backBtn}>
              <Text style={styles.backBtnText}>Back</Text>
            </Pressable>
          ) : (
            <View style={{ width: 60 }} />
          )}

          <View style={{ flex: 1 }} />

          <View style={styles.btnWrap}>
            <Button
              label={step === 3 ? (loading ? 'Creating space…' : 'Begin gently') : 'Continue'}
              onPress={handleNext}
              disabled={
                (step === 0 && !movementFeel) ||
                (step === 1 && !appFatigueReason) ||
                (step === 2 && approachableMovements.length === 0)
              }
              loading={loading}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  progressBarWrap: {
    height: 4,
    backgroundColor: colors.border,
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.sage,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  tag: {
    fontSize: 11,
    color: colors.sage,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    color: colors.ink,
    fontWeight: '500',
    lineHeight: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: 24,
  },
  optionsWrap: {
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
  },
  cardSelected: {
    borderColor: colors.sage,
    borderWidth: 1.5,
    backgroundColor: colors.sageLight,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
  },
  textSelected: {
    color: colors.sageDark,
  },
  cardDesc: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
    lineHeight: 16,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 8,
  },
  gridCardSelected: {
    borderColor: colors.sage,
    borderWidth: 1.5,
    backgroundColor: colors.sageLight,
  },
  gridEmoji: {
    fontSize: 24,
  },
  gridLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink,
  },
  sliderSection: {
    alignItems: 'stretch',
    gap: 20,
    marginTop: 10,
  },
  energyIndicator: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  energyEmoji: {
    fontSize: 48,
  },
  energyLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.ink,
  },
  energyValue: {
    fontSize: 14,
    color: colors.muted,
  },
  sliderHint: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
  },
  backBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  backBtnText: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '500',
  },
  btnWrap: {
    width: 140,
  },
});
