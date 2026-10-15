import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, stateColors } from '@/constants/colors';
import { SAFETY_COPY } from '@/constants/copy';
import { useSettingsStore } from '@/store/settingsStore';

/** Shown once, after onboarding and before any exercise (see navigation/rootRoute). */
export default function SafetyNoticeScreen() {
  const acknowledge = useSettingsStore((s) => s.acknowledgeSafety);
  const [saving, setSaving] = useState(false);

  const onAccept = async () => {
    setSaving(true);
    try {
      await acknowledge();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.tag}>{SAFETY_COPY.tag}</Text>
        <Text style={styles.title} accessibilityRole="header">{SAFETY_COPY.title}</Text>
        <Text style={styles.body}>{SAFETY_COPY.notAdvice}</Text>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{SAFETY_COPY.checkFirstTitle}</Text>
          {SAFETY_COPY.checkFirst.map((line) => (
            <Text key={line} style={styles.item}>• {line}</Text>
          ))}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{SAFETY_COPY.painTitle}</Text>
          {SAFETY_COPY.pain.map((line) => (
            <Text key={line} style={styles.item}>• {line}</Text>
          ))}
        </Card>

        <View style={styles.emergency} accessibilityRole="alert">
          <Text style={styles.emergencyText}>{SAFETY_COPY.emergency}</Text>
        </View>

        <Button label={SAFETY_COPY.accept} loading={saving} onPress={onAccept} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, gap: 14 },
  tag: { fontSize: 13, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, lineHeight: 32 },
  body: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  card: { gap: 6 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  item: { fontSize: 15, color: colors.textPrimary, lineHeight: 22 },
  emergency: {
    backgroundColor: stateColors.activated.soft,
    borderColor: stateColors.activated.ink,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
  },
  emergencyText: { fontSize: 15, fontWeight: '700', color: stateColors.activated.ink, lineHeight: 22 },
});
