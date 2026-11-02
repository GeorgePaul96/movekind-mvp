import React from 'react';
import Svg, { Ellipse, G, Path } from 'react-native-svg';
import { parkColors, stateColors } from '@/constants/colors';
import type { UserState } from '@/types';
import type { ParkLight } from '../ParkLayers';

const S = parkColors.outline;
// Unified ~2.6pt on-screen outline weight (viewBox 192 rendered at ~170pt -> strokeWidth 3)
const BED_SW = 3;

export const BedBaseArt = React.memo(function BedBaseArt({
  width,
  height,
  light,
}: {
  width: number;
  height: number;
  light: ParkLight;
}) {
  const stone = parkColors.stone[light];
  const soil = parkColors.soil[light];
  const stones = [
    [28, 65, 15, 9.5],
    [54, 73, 16, 10.5],
    [82, 77, 17, 10.5],
    [110, 77, 17, 10.5],
    [138, 73, 16, 10.5],
    [164, 65, 15, 9.5],
  ] as const;

  return (
    <Svg width={width} height={height} viewBox="0 0 192 96">
      <Ellipse cx="96" cy="66" rx="88" ry="25" fill={parkColors.shadow} />
      <Ellipse cx="96" cy="56" rx="78" ry="22" fill={soil} stroke={S} strokeWidth={BED_SW} />
      <G stroke={S} strokeWidth={BED_SW}>
        {stones.map(([cx, cy, rx, ry], i) => (
          <Ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill={stone} />
        ))}
      </G>
    </Svg>
  );
});

/** Chunky Brainrot-style tulip with rounded petals and dark outline. */
export const TulipArt = React.memo(function TulipArt({
  mood,
  light,
  size = 24,
}: {
  mood: UserState;
  light: ParkLight;
  size?: number;
}) {
  const fill = stateColors[mood].tint;
  const stem = parkColors.foliage[light].leaf;
  return (
    <Svg width={size} height={size * 1.25} viewBox="0 0 40 50">
      <G stroke={S} strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M20 46 L20 24" stroke={stem} strokeWidth="4.5" />
        <Path d="M20 38 C10 36 8 28 16 28 C19 28 20 34 20 38 Z" fill={stem} />
        <Path
          d="M10 18 C10 30 30 30 30 18 L30 10 L24 15 L20 9 L16 15 L10 10 Z"
          fill={fill}
        />
      </G>
    </Svg>
  );
});
