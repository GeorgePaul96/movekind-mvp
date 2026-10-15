import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { PROFILE_COPY } from '@/constants/copy';
import { useProfileStore } from '@/store/profileStore';
import { startCheckout } from '@/services/premium';
import { PRO_PLAN_LIVE } from '@/domain/premium/entitlements';

export default function ProfileScreen() {
  const profile = useProfileStore((s) => s.profile);
  const saveName = useProfileStore((s) => s.setName);
  const eraseAll = useProfileStore((s) => s.eraseAll);

  const [name, setName] = useState(profile?.name ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(profile?.name ?? '');
  }, [profile?.name]);

  const onSave = async () => {
    setSaving(true);
    try {
      await saveName(name);
      Alert.alert(PROFILE_COPY.savedTitle, PROFILE_COPY.savedBody);
    } catch (e) {
      Alert.alert(PROFILE_COPY.saveFailedTitle, e instanceof Error ? e.message : '');
    } finally {
      setSaving(false);
    }
  };

  const onPremium = async () => {
    const result = await startCheckout(profile?.id ?? '');
    if (result) {
      Alert.alert('Premium', `Continue to: ${result.url}`);
    } else {
      Alert.alert(PROFILE_COPY.premiumComingSoonTitle, PROFILE_COPY.premiumComingSoonBody);
    }
  };

  const onErase = () => {
    Alert.alert(PROFILE_COPY.eraseTitle, PROFILE_COPY.eraseBody, [
      { text: PROFILE_COPY.cancel, style: 'cancel' },
      {
        text: PROFILE_COPY.eraseConfirm,
        style: 'destructive',
        onPress: () => {
          eraseAll().catch((e) => console.warn('Could not erase data:', e));
        },
      },
    ]);
  };

  return (
    <Screen>
      <Header tag={PROFILE_COPY.tag} title={profile?.name ? `Hello, ${profile.name}` : 'Hello'} />

      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.label}>{PROFILE_COPY.nameLabel}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          accessibilityLabel={PROFILE_COPY.nameLabel}
          placeholder={PROFILE_COPY.namePlaceholder}
          placeholderTextColor={colors.textMuted}
          maxLength={40}
          style={styles.input}
        />

        <View style={{ height: 12 }} />
        <Button label={saving ? 'Saving…' : 'Save changes'} onPress={onSave} loading={saving} />
      </Card>

      {/* Hidden until the Pro plan launches — MoveKind is free for now. */}
      {PRO_PLAN_LIVE && (
        <Card style={{ marginBottom: 12 }}>
          <Text style={styles.label}>{PROFILE_COPY.premiumTitle}</Text>
          <Text style={styles.body}>
            {profile?.is_premium ? PROFILE_COPY.premiumActive : PROFILE_COPY.premiumDesc}
          </Text>
          <View style={{ height: 8 }} />
          <Button
            label={profile?.is_premium ? 'Manage premium' : 'Learn about premium'}
            variant="secondary"
            onPress={onPremium}
          />
        </Card>
      )}

      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.label}>{PROFILE_COPY.dataTitle}</Text>
        <Text style={styles.body}>{PROFILE_COPY.localNote}</Text>
      </Card>

      <Button label={PROFILE_COPY.eraseButton} variant="link" onPress={onErase} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  body: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
});
