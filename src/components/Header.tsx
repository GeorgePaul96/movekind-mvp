import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { font } from '@/constants/typography';

interface Props {
  tag?: string;
  title: string;
  subtitle?: string;
}

/** Screen heading: a small green eyebrow with a dot, a big title, a soft subtitle. */
export function Header({ tag, title, subtitle }: Props) {
  return (
    <View style={styles.wrap}>
      {tag ? (
        <View style={styles.tagRow}>
          <View style={styles.dot} />
          <Text style={styles.tag}>{tag}</Text>
        </View>
      ) : null}
      <Text style={styles.title} accessibilityRole="header">{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  tag: { ...font.semibold, fontSize: 13, color: colors.primary, letterSpacing: 1, textTransform: 'uppercase' },
  title: { ...font.bold, fontSize: 30, lineHeight: 38, color: colors.textPrimary },
  subtitle: { ...font.regular, fontSize: 16, lineHeight: 24, color: colors.textSecondary, marginTop: 2 },
});
