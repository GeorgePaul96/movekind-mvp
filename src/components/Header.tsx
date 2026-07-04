import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';

interface Props {
  tag?: string;
  title: string;
  subtitle?: string;
}

export function Header({ tag, title, subtitle }: Props) {
  return (
    <View style={{ marginBottom: 16 }}>
      {tag ? <Text style={styles.tag}>{tag}</Text> : null}
      <Text style={styles.title} accessibilityRole="header">{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.sage,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    color: colors.ink,
    lineHeight: 32,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
  },
});
