import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { useActivityStore } from '@/store/activityStore';
import { useReflectionStore } from '@/store/reflectionStore';
import { getProfile, updateProfile } from '@/services/profile';
import { getGoal, upsertGoal } from '@/services/goals';
import { startCheckout } from '@/services/premium';
import type { Goal, Profile, ScoreFocus } from '@/types';

const FOCUSES: ScoreFocus[] = [
  'overall',
  'consistency',
  'strength',
  'endurance',
  'recovery',
];

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const resetActs = useActivityStore((s) => s.reset);
  const resetRefs = useReflectionStore((s) => s.reset);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [name, setName] = useState('');
  const [minutesTarget, setMinutesTarget] = useState('150');
  const [focus, setFocus] = useState<ScoreFocus>('overall');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, g] = await Promise.all([getProfile(user.id), getGoal(user.id)]);
      setProfile(p);
      setGoal(g);
      setName(p?.name ?? '');
      if (g) {
        setMinutesTarget(String(g.weekly_minutes_target));
        setFocus(g.focus);
      }
    })();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.id, { name });
      await upsertGoal(user.id, {
        weekly_minutes_target: Math.max(15, parseInt(minutesTarget, 10) || 150),
        weekly_sessions_target: goal?.weekly_sessions_target ?? 4,
        focus,
      });
      Alert.alert('Saved', 'Your profile is up to date.');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : '');
    } finally {
      setSaving(false);
    }
  };

  const onSignOut = async () => {
    await signOut();
    resetActs();
    resetRefs();
  };

  const onPremium = async () => {
    const result = await startCheckout(user?.id ?? '');
    if (result) {
      Alert.alert('Premium', `Continue to: ${result.url}`);
    } else {
      Alert.alert(
        'Premium coming soon',
        'Stripe is wired in but checkout is not enabled in this build. Add EXPO_PUBLIC_STRIPE_PUBLIC_KEY and an Edge Function to finish the integration.',
      );
    }
  };

  return (
    <Screen>
      <Header tag="Profile" title={profile?.name ? `Hello, ${profile.name}` : 'Hello'} />

      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={colors.hint}
          style={styles.input}
        />

        <Text style={[styles.label, { marginTop: 12 }]}>Weekly minutes target</Text>
        <TextInput
          value={minutesTarget}
          onChangeText={setMinutesTarget}
          keyboardType="number-pad"
          style={styles.input}
        />

        <Text style={[styles.label, { marginTop: 12 }]}>Focus area</Text>
        <View style={styles.focusRow}>
          {FOCUSES.map((f) => {
            const selected = focus === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFocus(f)}
                style={[styles.focusBtn, selected && styles.focusBtnActive]}
              >
                <Text style={[styles.focusText, selected && { color: '#fff' }]}>
                  {f}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: 12 }} />
        <Button label={saving ? 'Saving…' : 'Save changes'} onPress={onSave} loading={saving} />
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.label}>MoveKind Premium</Text>
        <Text style={styles.premiumDesc}>
          Personalized AI coaching, weekly insights, and unlimited reflections.
          {profile?.is_premium ? ' You are a premium member.' : ' Coming soon.'}
        </Text>
        <View style={{ height: 8 }} />
        <Button
          label={profile?.is_premium ? 'Manage premium' : 'Learn about premium'}
          variant="sage-soft"
          onPress={onPremium}
        />
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email}</Text>
      </Card>

      <Button label="Sign out" variant="ghost" onPress={onSignOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
  },
  value: { fontSize: 14, color: colors.ink },
  focusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  focusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.surface,
  },
  focusBtnActive: { backgroundColor: colors.sage, borderColor: colors.sage },
  focusText: { fontSize: 12, color: colors.muted, textTransform: 'capitalize' },
  premiumDesc: { color: colors.muted, fontSize: 13, lineHeight: 18 },
});
