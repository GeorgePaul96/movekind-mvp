import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { gardenColors as c } from '@/constants/colors';

const STARS = [
  [24, 20], [70, 40], [118, 16], [160, 52], [270, 24], [300, 70], [36, 96], [214, 18], [250, 96],
] as const;

/** A sleepy little bird on the branch. */
function SleepyBird({ x, y, body, wing, flip }: { x: number; y: number; body: string; wing: string; flip?: boolean }) {
  const d = flip ? -1 : 1;
  return (
    <G>
      <Circle cx={x} cy={y} r={12} fill={body} />
      <Ellipse cx={x - 3 * d} cy={y + 2} rx={7} ry={5} fill={wing} />
      <Path d={`M${x + 11 * d} ${y - 1} l${5 * d} 2 l${-5 * d} 2z`} fill={c.beak} />
      <Path d={`M${x + 2 * d} ${y - 4} q${3 * d} 2 ${6 * d} 0`} stroke={c.skyRest} strokeWidth={1.4} fill="none" />
    </G>
  );
}

/** The first screen's night scene: moon, stars, two birds asleep on a branch. Decorative. */
export function NightHero() {
  return (
    <View
      style={{ width: '100%', aspectRatio: 320 / 150, borderRadius: 28, overflow: 'hidden' }}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Svg width="100%" height="100%" viewBox="0 0 320 150">
        <Rect width="320" height="150" fill={c.skyRest} />
        {STARS.map(([x, y], i) => (
          <Circle key={i} cx={x} cy={y} r={i % 2 ? 1.2 : 1.8} fill={c.star} opacity={0.85} />
        ))}
        <Circle cx="252" cy="44" r="20" fill={c.moon} />
        <Circle cx="261" cy="37" r="17" fill={c.skyRest} />
        <Ellipse cx="96" cy="34" rx="20" ry="7" fill={c.skyRestLow} />
        <Ellipse cx="112" cy="30" rx="12" ry="7" fill={c.skyRestLow} />
        <Path d="M30 118 C90 100 160 104 236 92" stroke={c.trunk} strokeWidth="5" strokeLinecap="round" fill="none" />
        <Ellipse cx="200" cy="90" rx="9" ry="4" fill={c.leaf} transform="rotate(-25 200 90)" />
        <Ellipse cx="74" cy="104" rx="8" ry="3.5" fill={c.leafLight} transform="rotate(20 74 104)" />
        <SleepyBird x={128} y={92} body={c.leafLight} wing={c.leaf} />
        <SleepyBird x={156} y={90} body={c.bird} wing={c.birdWing} flip />
      </Svg>
    </View>
  );
}
