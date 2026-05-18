import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Card } from './Card';
import { colors } from '@/constants/colors';

export function QuoteCard({ quote }: { quote: string }) {
  return (
    <Card style={styles.card}>
      <Text style={styles.text}>{`“${quote}”`}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.blushLight,
    borderColor: colors.blush,
    marginBottom: 12,
  },
  text: {
    fontStyle: 'italic',
    fontSize: 15,
    color: colors.blushDark,
    lineHeight: 22,
  },
});
