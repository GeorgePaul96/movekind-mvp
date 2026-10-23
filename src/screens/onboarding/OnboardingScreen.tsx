import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { GARDEN_INTRO_COPY, ONBOARDING_COPY } from '@/constants/copy';
import { Button } from '@/components/Button';
import { useSettingsStore } from '@/store/settingsStore';
import { useProfileStore } from '@/store/profileStore';

/** First launch: an optional name, then one screen on how the garden grows. No accounts. */
export default function OnboardingScreen() {
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const setName = useProfileStore((s) => s.setName);

  const [step, setStep] = useState<0 | 1>(0);
  const [name, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);

  const finish = async () => {
    setLoading(true);
    try {
      await setName(name); // stays on this phone
      await completeOnboarding();
    } catch (err) {
      console.warn('Could not finish onboarding', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.progressBarWrap}>
        <View style={[styles.progressBar, { width: step === 0 ? '50%' : '100%' }]} />
      </View>

      <View style={styles.container}>
        {step === 0 ? (
          <View style={styles.slide}>
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
          </View>
        ) : (
          <View style={styles.slide}>
            <Text style={styles.tag}>{GARDEN_INTRO_COPY.tag}</Text>
            <Text style={styles.title} accessibilityRole="header">{GARDEN_INTRO_COPY.title}</Text>
            {GARDEN_INTRO_COPY.lines.map((l) => (
              <View key={l.text} style={styles.introRow}>
                <Text style={styles.introEmoji} importantForAccessibility="no" accessibilityElementsHidden>
                  {l.emoji}
                </Text>
                <Text style={styles.introText}>{l.text}</Text>
              </View>
            ))}
            <Text style={[styles.subtitle, { marginTop: 16 }]}>{GARDEN_INTRO_COPY.promise}</Text>
          </View>
        )}

        <View style={styles.footer}>
          {step === 1 ? (
            <Button label="Back" variant="link" accessibilityLabel="Go back to your name" onPress={() => setStep(0)} />
          ) : (
            <View />
          )}
          <View style={styles.btnWrap}>
            <Button
              label={step === 0 ? GARDEN_INTRO_COPY.next : GARDEN_INTRO_COPY.start}
              onPress={() => (step === 0 ? setStep(1) : finish())}
              loading={loading}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  progressBarWrap: { height: 4, backgroundColor: colors.border, width: '100%' },
  progressBar: { height: '100%', backgroundColor: colors.primary },
  container: { flex: 1, padding: 24, justifyContent: 'space-between' },
  slide: { flex: 1, justifyContent: 'center', paddingBottom: 40 },
  tag: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: { fontSize: 26, color: colors.textPrimary, fontWeight: '700', lineHeight: 32, marginBottom: 12 },
  subtitle: { fontSize: 15, color: colors.textSecondary, lineHeight: 21, marginBottom: 24 },
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
  introRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  introEmoji: { fontSize: 26 },
  introText: { fontSize: 17, color: colors.textPrimary, fontWeight: '600', flex: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btnWrap: { minWidth: 180 },
});
