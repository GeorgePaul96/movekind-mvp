import React from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { gardenColors, parkColors } from '@/constants/colors';
import type { ParkLight } from '../ParkLayers';

const S = parkColors.outline;

export const HammockArt = React.memo(function HammockArt({
  width,
  height,
  light,
}: {
  width: number;
  height: number;
  light: ParkLight;
}) {
  const f = parkColors.foliage[light];
  const trunk = gardenColors.trunk;
  const { cloth, stripe } = parkColors.hammock;

  return (
    <Svg width={width} height={height} viewBox="0 0 180 130">
      <Ellipse cx="34" cy="116" rx="22" ry="6" fill={parkColors.shadow} />
      <Ellipse cx="146" cy="116" rx="22" ry="6" fill={parkColors.shadow} />

      <G stroke={S} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M28 115 L32 54 L40 54 L38 115 Z" fill={trunk} />
        <Path d="M142 115 L140 54 L148 54 L152 115 Z" fill={trunk} />

        <Path d="M36 78 L52 84 M144 78 L128 84" stroke={S} strokeWidth="3.5" />
        <Path d="M50 82 Q90 112 130 82 Q90 94 50 82 Z" fill={cloth} />
        <Path d="M66 88 Q90 101 114 88" stroke={stripe} strokeWidth="3.5" fill="none" />

        <Circle cx="36" cy="44" r="24" fill={f.leaf} />
        <Circle cx="24" cy="52" r="16" fill={f.shade} />
        <Circle cx="48" cy="52" r="16" fill={f.light} />

        <Circle cx="144" cy="44" r="24" fill={f.leaf} />
        <Circle cx="132" cy="52" r="16" fill={f.shade} />
        <Circle cx="156" cy="52" r="16" fill={f.light} />
      </G>
    </Svg>
  );
});
