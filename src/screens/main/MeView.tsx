import React, { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { font } from '@/constants/typography';
import { HOME_COPY, ME_COPY, PROFILE_COPY } from '@/constants/copy';
import { useProfileStore } from '@/store/profileStore';
import { useSettingsStore } from '@/store/settingsStore';
import { disableDailyReminder, enableDailyReminder } from '@/services/notifications';

/** You: the reminder, the optional yard home, and your data. The name is asked once, in onboarding. */
export default function MeView() {
  const profile = useProfileStore((s) => s.profile);
  const eraseAll = useProfileStore((s) => s.eraseAll);

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

  const yardHome = useSettingsStore((s) => s.yardHome);
  const setYardHome = useSettingsStore((s) => s.setYardHome);

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
    <View>
      <View style={styles.hero}>
        <View style={styles.emblemRing}>
          <View style={styles.emblem}>
            <Icon name="sprout" size={40} color={colors.primary} />
          </View>
        </View>
        <Text style={styles.hello} accessibilityRole="header">{ME_COPY.hello(profile?.name)}</Text>
        <Text style={styles.subtitle}>{ME_COPY.subtitle}</Text>
      </View>

      <Card style={styles.card}>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{ME_COPY.reminderTitle}</Text>
            <Text style={styles.body}>{ME_COPY.reminderBody}</Text>
          </View>
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

      <Card style={styles.card}>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{HOME_COPY.yardTitle}</Text>
            <Text style={styles.body}>{HOME_COPY.yardBody}</Text>
          </View>
          <Switch
            value={yardHome}
            onValueChange={(v) => void setYardHome(v)}
            accessibilityLabel={HOME_COPY.yardLabel}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.surface}
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.titleRow}>
          <Icon name="shield-check-outline" size={22} color={colors.primary} />
          <Text style={styles.cardTitle}>{PROFILE_COPY.dataTitle}</Text>
        </View>
        <Text style={styles.body}>{PROFILE_COPY.localNote}</Text>
        <View style={styles.dataFoot}>
          <Button label={PROFILE_COPY.eraseButton} variant="link" size="sm" onPress={onErase} />
          <Text style={styles.badge}>{ME_COPY.localBadge}</Text>
        </View>
      </Card>

      <Card tone="soft" style={styles.card}>
        <View style={styles.titleRow}>
          <View style={styles.philIcon}>
            <Icon name="leaf" size={20} color={colors.primary} />
          </View>
          <Text style={styles.label}>{ME_COPY.philosophyTitle}</Text>
        </View>
        <Text style={styles.quote}>{ME_COPY.philosophy}</Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginTop: 8, marginBottom: 20 },
  emblemRing: { padding: 10, borderRadius: 70, backgroundColor: colors.surfaceSecondary },
  emblem: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hello: { ...font.bold, fontSize: 30, color: colors.textPrimary, marginTop: 14 },
  subtitle: { ...font.regular, fontSize: 16, color: colors.textSecondary, marginTop: 2 },
  card: { marginBottom: 14 },
  label: { ...font.semibold, fontSize: 13, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  cardTitle: { ...font.bold, fontSize: 19, color: colors.textPrimary },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  input: {
    ...font.medium,
    flex: 1,
    minHeight: 50,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.textPrimary,
  },
  saveWrap: { width: 88 },
  body: { ...font.regular, color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginTop: 2 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  unitsRow: { flexDirection: 'row', gap: 8 },
  dataFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  badge: { ...font.medium, fontSize: 13, color: colors.textMuted },
  philIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quote: { ...font.medium, fontSize: 16, lineHeight: 25, color: colors.textPrimary, fontStyle: 'italic' },
});
