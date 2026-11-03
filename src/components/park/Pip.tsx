import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, parkColors } from '@/constants/colors';
import { PIP_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import type { ParkLayout } from '@/domain/park/layout';
import { pipSpot, type PipMood, type PipNotice } from '@/domain/park/pip';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import type { ParkLight } from './ParkLayers';
import { PipArt } from './art/PipArt';

const SAY_MS = 4500;
const BUBBLE_W = 210;
const MIN_TARGET = 48;

interface Props {
  clock: SharedValue<number>;
  layout: ParkLayout;
  light: ParkLight;
  mood: PipMood;
  /** What Pip can mention; each tap says the next one. */
  notices: PipNotice[];
}

/**
 * Pip stands by the tree and breathes gently on the shared clock. A tap shows a short speech
 * bubble with something it noticed; the bubble fades after a few seconds. A fresh log makes Pip hop.
 */
export function Pip({ clock, layout, light, mood, notices }: Props) {
  const reduce = useReduceMotion();
  const { feet, size } = pipSpot(layout);
  const [said, setSaid] = useState<number | null>(null);
  const turn = useRef(0);
  const hop = useSharedValue(0);

  useEffect(() => {
    if (said === null) return;
    const t = setTimeout(() => setSaid(null), SAY_MS);
    return () => clearTimeout(t);
  }, [said]);

  useEffect(() => {
    if (mood !== 'cheer' || reduce) return;
    hop.value = withSequence(withTiming(-14, { duration: 180 }), withSpring(0, { damping: 10, stiffness: 200 }));
  }, [hop, mood, reduce]);

  const sleepy = mood === 'sleepy';
  const bodyStyle = useAnimatedStyle(() => {
    const breathe = reduce ? 0 : Math.sin(clock.value * (sleepy ? 1.2 : 2.2)) * 0.025;
    return { transform: [{ translateY: hop.value }, { scaleY: 1 + breathe }, { scaleX: 1 - breathe / 2 }] };
  });

  const artH = (size * 124) / 120;
  const box = Math.max(size, MIN_TARGET);
  const left = feet[0] - box / 2;
  const top = feet[1] - artH * 0.94;
  const line = said === null ? null : PIP_COPY.lines[notices[said % notices.length]!];
  const bubbleLeft = Math.min(Math.max(feet[0] - BUBBLE_W * 0.7, 12), layout.worldW - 12 - BUBBLE_W);

  return (
    <>
      <Pressable
        testID="pip"
        accessibilityRole="button"
        accessibilityLabel={PIP_COPY.label}
        accessibilityHint={PIP_COPY.hint}
        onPress={() => {
          const i = turn.current;
          turn.current += 1;
          setSaid(i);
          AccessibilityInfo.announceForAccessibility(PIP_COPY.lines[notices[i % notices.length]!]);
        }}
        style={[styles.abs, { left, top, width: box, height: Math.max(artH, MIN_TARGET) }]}
      >
        <Animated.View
          testID={`pip-${mood}`}
          style={[styles.art, { width: box, height: artH, transformOrigin: '50% 94%' }, bodyStyle]}
        >
          <PipArt mood={mood} light={light} size={size} />
        </Animated.View>
      </Pressable>

      {line && (
        <View
          testID="pip-says"
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={[styles.bubble, { left: bubbleLeft, bottom: layout.worldH - top + 10, width: BUBBLE_W }]}
        >
          <Text style={styles.line}>{line}</Text>
          <View style={[styles.tail, { left: feet[0] - bubbleLeft - 7 }]} />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  art: { alignItems: 'center' },
  bubble: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderColor: parkColors.outline,
    borderWidth: 2.5,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: parkColors.outline,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  line: { ...font.bold, fontSize: 14, lineHeight: 19, color: colors.textPrimary },
  tail: {
    position: 'absolute',
    bottom: -9,
    width: 14,
    height: 14,
    backgroundColor: colors.surface,
    borderRightWidth: 2.5,
    borderBottomWidth: 2.5,
    borderColor: parkColors.outline,
    transform: [{ rotate: '45deg' }],
  },
});
