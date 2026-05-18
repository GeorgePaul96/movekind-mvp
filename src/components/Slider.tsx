import React from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import { colors } from '@/constants/colors';
import { clamp } from '@/utils/format';

interface Props {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  color?: string;
}

/**
 * Lightweight slider — no native dep — that supports dragging or tapping.
 */
export function Slider({
  min,
  max,
  step = 1,
  value,
  onChange,
  color = colors.sage,
}: Props) {
  const [width, setWidth] = React.useState(0);

  const update = (x: number) => {
    if (width === 0) return;
    const ratio = clamp(x / width, 0, 1);
    const raw = min + ratio * (max - min);
    const stepped = Math.round(raw / step) * step;
    onChange(clamp(stepped, min, max));
  };

  const responder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e: GestureResponderEvent) =>
          update(e.nativeEvent.locationX),
        onPanResponderMove: (e: GestureResponderEvent) =>
          update(e.nativeEvent.locationX),
      }),
    [width, min, max, step], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const ratio = (value - min) / (max - min);
  const knobX = clamp(ratio * width - 12, 0, Math.max(0, width - 24));

  return (
    <View
      style={styles.wrap}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      {...responder.panHandlers}
    >
      <View style={styles.track} />
      <View
        style={[
          styles.fill,
          { width: `${clamp(ratio * 100, 0, 100)}%`, backgroundColor: color },
        ]}
      />
      <View style={[styles.knob, { left: knobX, borderColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 32, justifyContent: 'center' },
  track: {
    height: 4,
    backgroundColor: colors.bg,
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  fill: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    left: 0,
  },
  knob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 3,
    position: 'absolute',
    top: 4,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
});
