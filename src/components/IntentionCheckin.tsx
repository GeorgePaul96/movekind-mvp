import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/colors';
import type { Intention } from '@/services/intentions';

interface Props {
  intention: Intention;
  onRespond: (met: boolean) => void;
}

type Response = 'yes' | 'mostly' | 'no';

const RESPONSES: { key: Response; label: string; met: boolean }[] = [
  { key: 'yes',    label: 'Yes',           met: true  },
  { key: 'mostly', label: 'Mostly',        met: true  },
  { key: 'no',     label: 'Not this week', met: false },
];

const FOLLOW_UP: Record<Response, string> = {
  yes:    'You followed through. That builds real self-trust.',
  mostly: 'Partial counts. Moving at all was the win.',
  no:     "Missed intentions happen — that's part of the process, not a failure.",
};

export function IntentionCheckin({ intention, onRespond }: Props) {
  const [response, setResponse] = useState<Response | null>(null);

  const handlePress = (r: Response, met: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setResponse(r);
    onRespond(met);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.tag}>Last week</Text>
      <Text style={styles.description}>
        You planned to{' '}
        <Text style={styles.descriptionBold}>{intention.description}</Text>.
      </Text>

      {response === null ? (
        <>
          <Text style={styles.question}>Did you follow through?</Text>
          <View style={styles.row}>
            {RESPONSES.map((r) => (
              <Pressable
                key={r.key}
                style={styles.btn}
                onPress={() => handlePress(r.key, r.met)}
              >
                <Text style={styles.btnText}>{r.label}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : (
        <Text style={styles.followUp}>{FOLLOW_UP[response]}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.sageLight,
    borderColor: colors.sageMid,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  tag: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.sage,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: colors.ink,
    lineHeight: 20,
    marginBottom: 10,
  },
  descriptionBold: { fontWeight: '600' },
  question: {
    fontSize: 13,
    color: colors.sageDark,
    fontWeight: '500',
    marginBottom: 10,
  },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.sageDark,
    backgroundColor: colors.surface,
  },
  btnText: { fontSize: 13, color: colors.sageDark, fontWeight: '500' },
  followUp: {
    fontSize: 13,
    color: colors.sageDark,
    lineHeight: 19,
    fontStyle: 'italic',
  },
});
