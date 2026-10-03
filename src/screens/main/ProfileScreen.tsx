import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { PROFILE_COPY } from '@/constants/copy';
import { useAuthStore } from '@/store/authStore';
import { getProfile, updateProfile } from '@/services/profile';
import { startCheckout } from '@/services/premium';
import type { Profile } from '@/types';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    getProfile(user.id)
      .then((p) => {
        setProfile(p);
        setName(p?.name ?? '');
      })
      .catch((err) => console.warn('Could not load profile:', err));
  }, [user?.id]);

  const onSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.id, { name });
      Alert.alert('Saved', 'Your profile is up to date.');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : '');
    } finally {
      setSaving(false);
    }
  };

  const onSignOut = async () => {
    await signOut();
  };

  const onPremium = async () => {
    const result = await startCheckout(user?.id ?? '');
    if (result) {
      Alert.alert('Premium', `Continue to: ${result.url}`);
    } else {
      Alert.alert(PROFILE_COPY.premiumComingSoonTitle, PROFILE_COPY.premiumComingSoonBody);
    }
  };

  return (
    <Screen>
      <Header tag={PROFILE_COPY.tag} title={profile?.name ? `Hello, ${profile.name}` : 'Hello'} />

      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          accessibilityLabel="Name"
          placeholder="Your name"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <View style={{ height: 12 }} />
        <Button label={saving ? 'Saving…' : 'Save changes'} onPress={onSave} loading={saving} />
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.label}>{PROFILE_COPY.premiumTitle}</Text>
        <Text style={styles.premiumDesc}>
          {profile?.is_premium ? PROFILE_COPY.premiumActive : PROFILE_COPY.premiumDesc}
        </Text>
        <View style={{ height: 8 }} />
        <Button
          label={profile?.is_premium ? 'Manage premium' : 'Learn about premium'}
          variant="secondary"
          onPress={onPremium}
        />
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email}</Text>
      </Card>

      <Button label="Sign out" variant="link" onPress={onSignOut} />
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
  value: { fontSize: 15, color: colors.textPrimary },
  premiumDesc: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
});
