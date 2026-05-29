import React from 'react';
import { StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { colors } from '@/constants/colors';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const TIMES = ['Morning', 'Afternoon', 'Evening'] as const;

export interface IntentionDraft {
  description: string;
  intendedDay: string | null;
  intendedTime: string | null;
}

interface Props {
  value: IntentionDraft;
  onChange: (v: IntentionDraft) => void;
  existingDescription?: string | null;
}

export function IntentionPrompt({ value, onChange, existingDescription }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>This week's intention</Text>
      <Text style={styles.subtitle}>
        Optional. One specific thing you intend to do. Not a goal — just an intention.
      </Text>

      <TextInput
        value={value.description}
        onChangeText={(t) => onChange({ ...value, description: t })}
        placeholder={existingDescription ?? 'e.g. One 20-minute walk on Tuesday morning'}
        placeholderTextColor={colors.hint}
        style={styles.input}
        multiline={false}
        returnKeyType="done"
      />

      <Text style={styles.label}>When?</Text>
      <View style={styles.chipRow}>
        {DAYS.map((d) => (
          <Pressable
            key={d}
            onPress={() =>
              onChange({ ...value, intendedDay: value.intendedDay === d ? null : d })
            }
            style={[styles.chip, value.intendedDay === d && styles.chipActive]}
          >
            <Text
              style={[
                styles.chipText,
                { color: value.intendedDay === d ? '#FFFFFF' : colors.muted },
              ]}
            >
              {d}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.chipRow, { marginTop: 6 }]}>
        {TIMES.map((t) => (
          <Pressable
            key={t}
            onPress={() =>
              onChange({ ...value, intendedTime: value.intendedTime === t ? null : t })
            }
            style={[styles.chip, value.intendedTime === t && styles.chipActive]}
          >
            <Text
              style={[
                styles.chipText,
                { color: value.intendedTime === t ? '#FFFFFF' : colors.muted },
              ]}
            >
              {t}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  title: { fontSize: 13, fontWeight: '600', color: colors.ink, marginBottom: 4 },
  subtitle: { fontSize: 12, color: colors.muted, lineHeight: 17, marginBottom: 12 },
  input: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.ink,
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.sageDark, borderColor: colors.sageDark },
  chipText: { fontSize: 12, fontWeight: '500' },
});
