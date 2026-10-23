import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { ME_COPY, PROFILE_COPY } from '@/constants/copy';
import { useProfileStore } from '@/store/profileStore';
import { useSettingsStore } from '@/store/settingsStore';
import { disableDailyReminder, enableDailyReminder } from '@/services/notifications';

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

  const reminderOn = useSettingsStore((s) => s.notificationsEnabled);
  const setReminderOn = useSettingsStore((s) => s.setNotificationsEnabled);
  const [reminderDenied, setReminderDenied] = useState(false);

  const onReminder = async (on: boolean) => {
    setReminderDenied(false);
    if (!on) {
      await setReminderOn(false);
      await disableDailyReminder();
      return;
    }
    const ok = await enableDailyReminder();
    if (ok) await setReminderOn(true);
    else setReminderDenied(true);
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
      <Header tag={ME_COPY.tag} title={profile?.name ? `Hello, ${profile.name}` : 'Hello'} />

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

      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.label}>{ME_COPY.reminderTitle}</Text>
        <View style={styles.switchRow}>
          <Text style={[styles.body, { flex: 1 }]}>{ME_COPY.reminderBody}</Text>
          <Switch
            value={reminderOn}
            onValueChange={(v) => {
              onReminder(v).catch((e) => console.warn('Could not change the reminder:', e));
            }}
            accessibilityLabel={ME_COPY.reminderLabel}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.surface}
          />
        </View>
        {reminderDenied && <Text style={[styles.body, { marginTop: 8 }]}>{ME_COPY.reminderDenied}</Text>}
      </Card>

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
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
});
