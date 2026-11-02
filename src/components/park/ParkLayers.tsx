import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { parkColors as p } from '@/constants/colors';
import { useReduceMotion } from '@/hooks/useReduceMotion';

export type ParkLight = 'dawn' | 'day' | 'dusk' | 'night' | 'rain';

const STARS = Array.from({ length: 24 }, (_, i) => [
  ((i * 97) % 94) / 100 + 0.03,
  ((i * 53) % 38) / 100 + 0.04,
] as const);

/** Sky gradient and stars/moon. Oversized so parallax never shows an edge. */
export const SkyLayer = React.memo(function SkyLayer({
  width,
  height,
  light,
}: {
  width: number;
  height: number;
  light: ParkLight;
}) {
  const sky = p.sky[light];
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="park-sky-grad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={sky.top} />
          <Stop offset="0.58" stopColor={sky.low} />
          <Stop offset="1" stopColor={sky.low} />
        </LinearGradient>
      </Defs>
      <Rect testID={light === 'night' ? undefined : 'sky-art'} x="0" y="0" width={width} height={height} fill="url(#park-sky-grad)" />
      {light === 'night' && (
        <>
          {STARS.map(([fx, fy], i) => (
            <Circle
              key={i}
              cx={fx * width}
              cy={fy * height}
              r={i % 3 === 0 ? 2 : 1.3}
              fill={p.star}
              opacity={i % 2 === 0 ? 0.9 : 0.55}
            />
          ))}
          <G testID="moon">
            <Path
              d={`M${width * 0.76} ${height * 0.13 - 18} A18 18 0 1 0 ${width * 0.76} ${height * 0.13 + 18} A23 23 0 1 1 ${width * 0.76} ${height * 0.13 - 18} Z`}
              fill={p.moon}
            />
          </G>
        </>
      )}
    </Svg>
  );
});

/** Single puffy vector cloud group, duplicated twice for seamless 120s loop. */
const CloudStrip = React.memo(function CloudStrip({ width, height }: { width: number; height: number }) {
  const puff = (cx: number, cy: number, s: number) => (
    <G transform={`translate(${cx}, ${cy}) scale(${s})`} fill={p.cloud}>
      <Circle cx="0" cy="0" r="26" />
      <Circle cx="-24" cy="6" r="20" />
      <Circle cx="24" cy="6" r="20" />
      <Rect x="-24" y="6" width="48" height="20" rx="10" />
    </G>
  );
  return (
    <Svg width={width * 2} height={height * 0.36}>
      {puff(width * 0.18, height * 0.14, 1.15)}
      {puff(width * 0.56, height * 0.09, 0.85)}
      {puff(width * 0.86, height * 0.17, 1.0)}
      {puff(width * 1.18, height * 0.14, 1.15)}
      {puff(width * 1.56, height * 0.09, 0.85)}
      {puff(width * 1.86, height * 0.17, 1.0)}
    </Svg>
  );
});

export function CloudsLayer({
  clock,
  width,
  height,
  light,
}: {
  clock: SharedValue<number>;
  width: number;
  height: number;
  light: ParkLight;
}) {
  const reduce = useReduceMotion();
  const style = useAnimatedStyle(() => {
    const progress = reduce ? 0 : (clock.value / 120) % 1;
    return { transform: [{ translateX: -progress * width }] };
  });

  if (light === 'night') return null;
  return (
    <Animated.View
      testID="clouds"
      pointerEvents="none"
      style={[{ position: 'absolute', left: 0, top: 0, opacity: light === 'rain' ? 0.6 : 0.95 }, style]}
    >
      <CloudStrip width={width} height={height} />
    </Animated.View>
  );
}

/** Rounded background hills extending all the way to the bottom edge so no seam can ever show. */
export const HillLayer = React.memo(function HillLayer({
  width,
  height,
  light,
  depth,
}: {
  width: number;
  height: number;
  light: ParkLight;
  depth: 'far' | 'mid';
}) {
  const fill = depth === 'far' ? p.far[light] : p.mid[light];
  const yTop = depth === 'far' ? height * 0.34 : height * 0.4;
  const d =
    depth === 'far'
      ? `M0 ${yTop} Q${width * 0.28} ${yTop - 38} ${width * 0.55} ${yTop - 6} T${width} ${yTop - 18} L${width} ${height} L0 ${height} Z`
      : `M0 ${yTop + 10} Q${width * 0.25} ${yTop - 16} ${width * 0.52} ${yTop + 14} T${width} ${yTop - 12} L${width} ${height} L0 ${height} Z`;

  return (
    <Svg width={width} height={height}>
      <Path testID={`${depth}-art`} d={d} fill={fill} />
      <Rect
        testID="mist"
        x={0}
        y={yTop + 12}
        width={width}
        height={height * 0.06}
        fill={p.mistTint}
        opacity={p.mist[light] * 0.5}
      />
    </Svg>
  );
});

/** UI-thread rain overlay. */
export function RainLayer({
  clock,
  width,
  height,
}: {
  clock: SharedValue<number>;
  width: number;
  height: number;
}) {
  const reduce = useReduceMotion();
  const style = useAnimatedStyle(() => {
    const dy = reduce ? 0 : ((clock.value * 180) % 48);
    return { transform: [{ translateY: dy }, { translateX: -dy * 0.2 }] };
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, style]}>
        <Svg width={width} height={height + 60} style={{ top: -48 }}>
          <G testID="rain">
            {Array.from({ length: 32 }, (_, i) => {
              const x = (((i * 61) % 96) / 100) * width;
              const y = (((i * 37) % 96) / 100) * (height + 48);
              return (
                <Line
                  key={i}
                  x1={x}
                  y1={y}
                  x2={x - 4}
                  y2={y + 14}
                  stroke={p.river.rain.flow}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  opacity={0.65}
                />
              );
            })}
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}
