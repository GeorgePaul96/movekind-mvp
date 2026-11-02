import React from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { gardenColors, parkColors, stateColors } from '@/constants/colors';
import type { ParkLight } from '../ParkLayers';

const S = parkColors.outline;
const T = gardenColors.trunk;
// Unified ~2.6pt on-screen outline weight (viewBox 200 rendered at ~240pt -> strokeWidth 2.2)
const SW = 2.2;

export const TreeTrunkArt = React.memo(function TreeTrunkArt({
  stage,
  width,
  height,
}: {
  stage: number;
  width: number;
  height: number;
}) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 200">
      <Ellipse cx="100" cy="182" rx={stage < 2 ? 28 : 54} ry="11" fill={parkColors.shadow} />
      {stage === 0 ? (
        <Path
          d="M100 180 Q100 155 100 142"
          stroke={S}
          strokeWidth={SW * 1.2}
          strokeLinecap="round"
        />
      ) : (
        <G stroke={S} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round">
          <Path
            d={
              stage === 1
                ? 'M93 180 Q96 140 97 115 L103 115 Q104 140 107 180 Z'
                : 'M82 180 Q90 140 88 102 L112 102 Q110 140 118 180 Z'
            }
            fill={T}
          />
          {stage >= 2 && (
            <>
              <Path d="M92 122 Q74 106 66 94" fill="none" stroke={T} strokeWidth="9" />
              <Path d="M92 122 Q74 106 66 94" fill="none" stroke={S} strokeWidth={SW} />
              <Path d="M108 118 Q126 104 134 92" fill="none" stroke={T} strokeWidth="9" />
              <Path d="M108 118 Q126 104 134 92" fill="none" stroke={S} strokeWidth={SW} />
            </>
          )}
        </G>
      )}
    </Svg>
  );
});

export const TreeCanopyArt = React.memo(function TreeCanopyArt({
  stage,
  light,
  width,
  height,
}: {
  stage: number;
  light: ParkLight;
  width: number;
  height: number;
}) {
  const f = parkColors.foliage[light];
  if (stage === 0) {
    return (
      <Svg width={width} height={height} viewBox="0 0 200 200">
        <G stroke={S} strokeWidth={SW * 1.1} strokeLinejoin="round">
          <Path d="M100 144 C80 138 72 120 88 114 C98 110 100 130 100 144 Z" fill={f.leaf} />
          <Path d="M100 144 C120 138 128 120 112 114 C102 110 100 130 100 144 Z" fill={f.light} />
        </G>
      </Svg>
    );
  }
  const scale = stage === 1 ? 0.62 : stage === 2 ? 0.82 : 1;
  return (
    <Svg width={width} height={height} viewBox="0 0 200 200">
      <G transform={`translate(100, 112) scale(${scale}) translate(-100, -112)`}>
        {/* Single unified silhouette path so no internal dark lines cut across the crown */}
        <Path
          d="M 66 130 A 34 34 0 0 1 42 72 A 36 36 0 0 1 66 36 A 42 42 0 0 1 134 36 A 36 36 0 0 1 158 72 A 34 34 0 0 1 134 130 A 40 24 0 0 1 66 130 Z"
          fill={f.shade}
          stroke={S}
          strokeWidth={SW / scale}
          strokeLinejoin="round"
        />
        {/* Soft two-tone inner foliage puffs without outlines */}
        <Circle cx="72" cy="74" r="33" fill={f.leaf} />
        <Circle cx="128" cy="74" r="33" fill={f.leaf} />
        <Circle cx="100" cy="56" r="39" fill={f.leaf} />
        <Circle cx="96" cy="46" r="26" fill={f.light} />
        <Circle cx="68" cy="66" r="18" fill={f.light} />
        <Circle cx="126" cy="66" r="18" fill={f.light} />

        {stage === 4 &&
          [
            [70, 62],
            [102, 44],
            [130, 68],
            [84, 92],
            [120, 94],
          ].map(([cx, cy], i) => (
            <G key={i} stroke={S} strokeWidth={SW * 0.85}>
              <Circle cx={cx} cy={cy} r="7.5" fill={gardenColors.blossom} />
              <Circle cx={cx} cy={cy} r="2.8" fill={gardenColors.flowerHeart} stroke="none" />
            </G>
          ))}

        {stage >= 5 &&
          [
            [68, 76],
            [100, 52],
            [132, 74],
            [86, 98],
            [118, 96],
          ].map(([cx, cy], i) => (
            <Circle
              key={i}
              cx={cx}
              cy={cy}
              r="8"
              fill={stateColors.activated.tint}
              stroke={S}
              strokeWidth={SW * 0.9}
            />
          ))}
      </G>
    </Svg>
  );
});
