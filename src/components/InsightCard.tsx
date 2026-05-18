import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';

interface Props {
  label?: string;
  body: string;
  tone?: 'sage' | 'sky';
}

export function InsightCard({ label = 'AI Coach insight', body, tone = 'sage' }: Props) {
  const gradient: [string, string] =
    tone === 'sage' ? ['#7BAE8B', '#5A9A72'] : ['#8B9ED4', '#6878B8'];
  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <Text style={styles.label}>{`✨ ${label}`}</Text>
      <Text style={styles.body}>{body}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
  },
  label: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  body: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
});
