import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { colors } from '@/constants/colors';
import { ONBOARDING_COPY } from '@/constants/copy';
import { Button } from '@/components/Button';
import { Slider } from '@/components/Slider';
import { useSettingsStore } from '@/store/settingsStore';
import { useProfileStore } from '@/store/profileStore';

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
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const setName = useProfileStore((s) => s.setName);

  const [step, setStep] = useState(0);
  const [name, setNameInput] = useState('');
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
    if (step < 4) {
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
        // Everything stays on this phone: name on the profile, answers in settings.
        await setName(name);
        await completeOnboarding(answers);
      } catch (err) {
        console.warn('Could not save onboarding answers', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const progressPct = ((step + 1) / 5) * 100;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress bar */}
      <View style={styles.progressBarWrap}>
        <View style={[styles.progressBar, { width: `${progressPct}%` }]} />
      </View>

      <View style={styles.container}>
        {/* Step 0: Name (optional — no accounts, it only lives on this phone) */}
        {step === 0 && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.slide}>
            <Text style={styles.tag}>{ONBOARDING_COPY.nameTag}</Text>
            <Text style={styles.title} accessibilityRole="header">{ONBOARDING_COPY.nameTitle}</Text>
            <Text style={styles.subtitle}>{ONBOARDING_COPY.nameSubtitle}</Text>
            <TextInput
              value={name}
              onChangeText={setNameInput}
              accessibilityLabel={ONBOARDING_COPY.nameTitle}
              placeholder={ONBOARDING_COPY.namePlaceholder}
              placeholderTextColor={colors.textMuted}
              maxLength={40}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => setStep(1)}
              style={styles.nameInput}
            />
          </Animated.View>
        )}

        {/* Step 1: Movement Feel */}
        {step === 1 && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.slide}>
            <Text style={styles.tag}>MoveKind Philosophy</Text>
            <Text style={styles.title} accessibilityRole="header">How do you want movement to feel in your life?</Text>
            <Text style={styles.subtitle}>Let’s build a gentle relationship with physical activity.</Text>
            
            <View style={styles.optionsWrap}>
              {MOVEMENT_FEEL_OPTIONS.map((opt) => {
                const selected = movementFeel === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setMovementFeel(opt.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={`${opt.label}. ${opt.desc}`}
                    style={[styles.card, selected && styles.cardSelected]}
                  >
                    <Text style={[styles.cardLabel, selected && styles.textSelected]}>{selected ? '✓ ' : ''}{opt.label}</Text>
                    <Text style={styles.cardDesc}>{opt.desc}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Step 2: Fitness App Fatigue */}
        {step === 2 && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.slide}>
            <Text style={styles.tag}>Your Past Struggles</Text>
            <Text style={styles.title} accessibilityRole="header">What usually makes fitness apps hard to stick with?</Text>
            <Text style={styles.subtitle}>We understand that old-school guilt tracking is exhausting.</Text>

            <View style={styles.optionsWrap}>
              {FATIGUE_OPTIONS.map((opt) => {
                const selected = appFatigueReason === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setAppFatigueReason(opt.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={`${opt.label}. ${opt.desc}`}
                    style={[styles.card, selected && styles.cardSelected]}
                  >
                    <Text style={[styles.cardLabel, selected && styles.textSelected]}>{selected ? '✓ ' : ''}{opt.label}</Text>
                    <Text style={styles.cardDesc}>{opt.desc}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Step 3: Approachable Movements */}
        {step === 3 && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.slide}>
            <Text style={styles.tag}>Your Companion</Text>
            <Text style={styles.title} accessibilityRole="header">What types of movement feel approachable right now?</Text>
            <Text style={styles.subtitle}>Every bit of mindful activity counts, even simple stretching.</Text>

            <View style={styles.gridWrap}>
              {APPROACHABLE_MOVEMENT.map((opt) => {
                const selected = approachableMovements.includes(opt.value);
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => toggleMovement(opt.value)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={opt.label}
                    style={[styles.gridCard, selected && styles.gridCardSelected]}
                  >
                    <Text style={styles.gridEmoji} importantForAccessibility="no" accessibilityElementsHidden>{opt.emoji}</Text>
                    <Text style={[styles.gridLabel, selected && styles.textSelected]}>{selected ? '✓ ' : ''}{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Step 4: Average Energy */}
        {step === 4 && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.slide}>
            <Text style={styles.tag}>Self Awareness</Text>
            <Text style={styles.title} accessibilityRole="header">How is your energy level usually throughout the week?</Text>
            <Text style={styles.subtitle}>We will calibrate your targets to align comfortably with your energy.</Text>

            <View style={styles.sliderSection}>
              <View style={styles.energyIndicator}>
                <Text style={styles.energyEmoji} importantForAccessibility="no" accessibilityElementsHidden>
                  {averageEnergy <= 3 ? '💤' : averageEnergy <= 6 ? '🍃' : '🔋'}
                </Text>
                <Text style={styles.energyLabel} accessibilityLiveRegion="polite">
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
                color={colors.primary}
                accessibilityLabel="Typical weekly energy level"
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
            <Button
              label="Back"
              variant="link"
              accessibilityLabel="Go back to previous step"
              onPress={handleBack}
            />
          ) : (
            <View style={{ width: 60 }} />
          )}

          <View style={{ flex: 1 }} />

          <View style={styles.btnWrap}>
            <Button
              label={step === 4 ? (loading ? 'Creating space…' : 'Begin gently') : 'Continue'}
              onPress={handleNext}
              disabled={
                (step === 1 && !movementFeel) ||
                (step === 2 && !appFatigueReason) ||
                (step === 3 && approachableMovements.length === 0)
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
    backgroundColor: colors.background,
  },
  progressBarWrap: {
    height: 4,
    backgroundColor: colors.border,
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
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
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    color: colors.textPrimary,
    fontWeight: '500',
    lineHeight: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  nameInput: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: colors.textPrimary,
  },
  optionsWrap: {
    gap: 12,
  },
  // Choice cards: always outlined in primary (≥3:1 on the canvas) so they read as
  // tappable; selection adds a thicker border, a tinted fill and a ✓ on the label.
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
  },
  cardSelected: {
    borderWidth: 3,
    padding: 14.5,
    backgroundColor: colors.primarySoft,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  textSelected: {
    color: colors.primary,
  },
  cardDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 8,
  },
  gridCardSelected: {
    borderWidth: 3,
    paddingVertical: 16.5,
    backgroundColor: colors.primarySoft,
  },
  gridEmoji: {
    fontSize: 24,
  },
  gridLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
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
    color: colors.textPrimary,
  },
  energyValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sliderHint: {
    fontSize: 13,
    color: colors.textSecondary,
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
  btnWrap: {
    width: 160,
  },
});
