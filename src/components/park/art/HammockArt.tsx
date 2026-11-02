import React from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { gardenColors, parkColors } from '@/constants/colors';
import type { ParkLight } from '../ParkLayers';

const S = parkColors.outline;
// Unified ~2.6pt on-screen outline weight (viewBox 180 rendered at ~118pt -> strokeWidth 3.8)
const SW = 3.8;

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

      <G stroke={S} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M28 115 L32 54 L40 54 L38 115 Z" fill={trunk} />
        <Path d="M142 115 L140 54 L148 54 L152 115 Z" fill={trunk} />

        <Path d="M36 78 L52 84 M144 78 L128 84" stroke={S} strokeWidth={SW * 0.85} />
        <Path d="M50 82 Q90 112 130 82 Q90 94 50 82 Z" fill={cloth} />
        <Path d="M66 88 Q90 101 114 88" stroke={stripe} strokeWidth="3.2" fill="none" />

        {/* Clean unified crowns with two-tone inner highlights */}
        <Circle cx="36" cy="46" r="24" fill={f.shade} />
        <Circle cx="36" cy="43" r="20" fill={f.leaf} stroke="none" />
        <Circle cx="33" cy="37" r="12" fill={f.light} stroke="none" />

        <Circle cx="144" cy="46" r="24" fill={f.shade} />
        <Circle cx="144" cy="43" r="20" fill={f.leaf} stroke="none" />
        <Circle cx="141" cy="37" r="12" fill={f.light} stroke="none" />
      </G>
    </Svg>
  );
});
