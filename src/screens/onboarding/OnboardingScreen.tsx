import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { font } from '@/constants/typography';
import { GARDEN_INTRO_COPY, ONBOARDING_COPY } from '@/constants/copy';
import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { NightHero } from '@/components/garden/NightHero';
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

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {step === 0 ? (
          <View>
            <NightHero />
            <Text style={[styles.title, styles.center, { marginTop: 24 }]} accessibilityRole="header">
              {ONBOARDING_COPY.nameTitle}
            </Text>
            <Text style={[styles.subtitle, styles.center]}>{ONBOARDING_COPY.nameSubtitle}</Text>
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
            <View style={styles.reassure}>
              <View style={styles.reassureIcon}>
                <Icon name="sprout" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reassureTitle}>{ONBOARDING_COPY.reassureTitle}</Text>
                <Text style={styles.reassureBody}>{ONBOARDING_COPY.reassureBody}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.tag}>{GARDEN_INTRO_COPY.tag}</Text>
            <Text style={styles.title} accessibilityRole="header">{GARDEN_INTRO_COPY.title}</Text>
            <Text style={styles.subtitle}>{GARDEN_INTRO_COPY.subtitle}</Text>
            {GARDEN_INTRO_COPY.lines.map((l) => (
              <View key={l.text} style={styles.introRow}>
                <View style={styles.introIcon}>
                  <Icon name={l.icon as IconName} size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.introText}>{l.text}</Text>
                  <Text style={styles.introDetail}>{l.detail}</Text>
                </View>
              </View>
            ))}
            <View style={styles.sanctuary}>
              <Text style={styles.sanctuaryTag}>{GARDEN_INTRO_COPY.sanctuary}</Text>
              <Text style={styles.sanctuaryText}>{GARDEN_INTRO_COPY.promise}</Text>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Button
            label={step === 0 ? GARDEN_INTRO_COPY.next : GARDEN_INTRO_COPY.start}
            onPress={() => (step === 0 ? setStep(1) : finish())}
            loading={loading}
          />
          {step === 0 ? (
            <Button
              label={ONBOARDING_COPY.skip}
              variant="link"
              onPress={() => {
                setNameInput('');
                setStep(1);
              }}
            />
          ) : (
            <Button label="Back" variant="link" accessibilityLabel="Go back to your name" onPress={() => setStep(0)} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  progressBarWrap: { height: 4, backgroundColor: colors.divider, width: '100%' },
  progressBar: { height: '100%', backgroundColor: colors.primary },
  container: { flexGrow: 1, padding: 20, justifyContent: 'space-between' },
  center: { textAlign: 'center' },
  tag: { ...font.semibold, fontSize: 13, color: colors.primary, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 12, marginBottom: 6 },
  title: { ...font.bold, fontSize: 28, lineHeight: 36, color: colors.textPrimary },
  subtitle: { ...font.regular, fontSize: 16, lineHeight: 24, color: colors.textSecondary, marginTop: 6, marginBottom: 20 },
  nameInput: {
    ...font.medium,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 18,
    paddingHorizontal: 18,
    minHeight: 56,
    fontSize: 17,
    color: colors.textPrimary,
  },
  reassure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.ring,
    borderRadius: 20,
    padding: 14,
    marginTop: 16,
  },
  reassureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reassureTitle: { ...font.bold, fontSize: 15, color: colors.textPrimary },
  reassureBody: { ...font.regular, fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  introRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.ring,
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
  },
  introIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introText: { ...font.bold, fontSize: 16, color: colors.textPrimary },
  introDetail: { ...font.regular, fontSize: 14, lineHeight: 20, color: colors.textSecondary, marginTop: 2 },
  sanctuary: { backgroundColor: colors.inverse, borderRadius: 20, padding: 16, marginTop: 6 },
  sanctuaryTag: { ...font.semibold, fontSize: 13, color: colors.onInverse, textTransform: 'uppercase', letterSpacing: 1.2 },
  sanctuaryText: { ...font.medium, fontSize: 15, lineHeight: 22, color: colors.onInverse, marginTop: 6 },
  footer: { marginTop: 24, gap: 4 },
});
