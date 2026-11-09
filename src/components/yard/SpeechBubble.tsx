import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, yardColors } from '@/constants/colors';
import { font } from '@/constants/typography';
import type { Point } from '@/domain/yard/layout';

const BUBBLE_W = 216;

interface Props {
  speaker: 'Maple' | 'Pudding';
  text: string;
  anchor: Point;
  screenW: number;
  screenH: number;
}

export function SpeechBubble({ speaker, text, anchor, screenW, screenH }: Props) {
  const left = Math.min(Math.max(anchor.x - BUBBLE_W / 2, 14), screenW - 14 - BUBBLE_W);
  const bottom = Math.max(screenH - anchor.y + 54, Math.round(screenH * 0.46));

  return (
    <View
      testID="yard-speech-bubble"
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[styles.bubble, { left, bottom, width: BUBBLE_W }]}
    >
      <Text style={styles.speaker}>{speaker}</Text>
      <Text style={styles.line}>{text}</Text>
      <View style={[styles.tail, { left: Math.min(Math.max(anchor.x - left - 7, 18), BUBBLE_W - 28) }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderColor: yardColors.outline,
    borderWidth: 2,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    zIndex: 10,
  },
  speaker: {
    ...font.bold,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 2,
  },
  line: {
    ...font.bold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  tail: {
    position: 'absolute',
    bottom: -8,
    width: 14,
    height: 14,
    backgroundColor: colors.surface,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: yardColors.outline,
    transform: [{ rotate: '45deg' }],
  },
});