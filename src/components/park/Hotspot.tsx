import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import type { ParkObject, Rect } from '@/domain/park/layout';

interface Props {
  object: ParkObject;
  rect: Rect;
  label: string;
  hint: string;
  onPress: (o: ParkObject) => void;
}

/**
 * An invisible, accessible button laid over a park object. The painting is the visual, and the
 * object's own movement (see ParkWorld) is the "tap me" cue.
 */
export function Hotspot({ object, rect, label, hint, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={() => onPress(object)}
      style={[styles.target, { left: rect.x, top: rect.y, width: rect.w, height: rect.h }]}
    />
  );
}

const styles = StyleSheet.create({
  target: { position: 'absolute' },
});
