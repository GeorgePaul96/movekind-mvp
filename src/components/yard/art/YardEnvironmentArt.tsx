import React from 'react';
import { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { gardenColors, yardColors, type YardLight } from '@/constants/colors';
import type { GardenState } from '@/domain/garden/garden';
import type { Point, YardLayout } from '@/domain/yard/layout';

interface Props {
  layout: YardLayout;
  light: YardLight;
  treeStage: GardenState['tree'];
  birds: boolean;
  bloomedSpots: { point: Point; color: string }[];
}

export const YardEnvironmentArt = React.memo(function YardEnvironmentArt({
  layout,
  light,
  treeStage,
  birds,
  bloomedSpots,
}: Props) {
  const { width: w, height: h, horizonY, fenceY, treeSpot } = layout;
  const sky = yardColors.sky[light];
  const hill = yardColors.hill[light];
  const lawn = yardColors.lawn[light];
  const isNight = light === 'night';
  const isRain = light === 'rain';
  const fenceFill = isNight ? yardColors.fence.nightWood : yardColors.fence.wood;
  const fenceStroke = isNight ? yardColors.fence.nightStroke : yardColors.fence.stroke;
  const stoneFill = isNight ? yardColors.path.nightStone : yardColors.path.stone;

  const picketCount = Math.min(18, Math.floor(w / 24));
  const picketGap = w / picketCount;

  return (
    <G>
      <Defs>
        <LinearGradient id="yardSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={sky.top} />
          <Stop offset="1" stopColor={sky.low} />
        </LinearGradient>
        <LinearGradient id="yardLawn" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={lawn.top} />
          <Stop offset="1" stopColor={lawn.low} />
        </LinearGradient>
      </Defs>

      {/* Sky */}
      <Rect x="0" y="0" width={w} height={h} fill="url(#yardSky)" />

      {/* Sun or Moon & Stars */}
      {isNight ? (
        <G>
          <Circle cx={w * 0.8} cy={h * 0.12} r={20} fill={gardenColors.moon} />
          <Circle cx={w * 0.2} cy={h * 0.09} r={2} fill={gardenColors.star} />
          <Circle cx={w * 0.45} cy={h * 0.07} r={2.2} fill={gardenColors.star} />
          <Circle cx={w * 0.64} cy={h * 0.14} r={1.8} fill={gardenColors.star} />
        </G>
      ) : !isRain ? (
        <G>
          <Circle cx={w * 0.8} cy={h * 0.13} r={42} fill={gardenColors.sunGlow} opacity={0.5} />
          <Circle
            cx={w * 0.8}
            cy={h * 0.13}
            r={22}
            fill={light === 'dusk' ? gardenColors.sunDusk : gardenColors.sun}
          />
        </G>
      ) : null}

      {/* Soft Clouds */}
      {!isNight && (
        <G fill={isRain ? gardenColors.rainCloud : gardenColors.cloud} opacity={0.85}>
          <Ellipse cx={w * 0.22} cy={h * 0.14} rx={32} ry={11} />
          <Ellipse cx={w * 0.28} cy={h * 0.13} rx={22} ry={11} />
          <Ellipse cx={w * 0.56} cy={h * 0.17} rx={26} ry={9} />
        </G>
      )}

      {/* Soft Background Hills (no outline) */}
      <Path
        d={`M0 ${horizonY - 12} Q${w * 0.28} ${horizonY - 52} ${w * 0.55} ${horizonY - 22} T${w} ${horizonY - 28} V${fenceY + 30} H0 Z`}
        fill={hill.back}
      />
      <Path
        d={`M0 ${horizonY + 6} Q${w * 0.35} ${horizonY - 24} ${w * 0.68} ${horizonY + 2} T${w} ${horizonY - 6} V${fenceY + 40} H0 Z`}
        fill={hill.front}
      />

      {/* Low Picket Fence at Horizon */}
      <G fill={fenceFill} stroke={fenceStroke} strokeWidth={1.5}>
        <Rect x={0} y={fenceY - 14} width={w} height={6} rx={3} />
        <Rect x={0} y={fenceY + 4} width={w} height={6} rx={3} />
        {Array.from({ length: picketCount }, (_, i) => (
          <Rect
            key={i}
            x={Math.round(i * picketGap + 5)}
            y={fenceY - 26}
            width={11}
            height={44}
            rx={4}
          />
        ))}
      </G>

      {/* Edge-to-Edge Lawn */}
      <Path
        d={`M0 ${fenceY + 16} Q${w * 0.5} ${fenceY + 4} ${w} ${fenceY + 16} V${h} H0 Z`}
        fill="url(#yardLawn)"
      />

      {/* Stepping-Stone Path below the interactive band */}
      <G fill={stoneFill} stroke={yardColors.path.stroke} strokeWidth={1.5}>
        <Ellipse cx={w * 0.48} cy={h * 0.64} rx={28} ry={10} />
        <Ellipse cx={w * 0.53} cy={h * 0.71} rx={34} ry={12} />
        <Ellipse cx={w * 0.47} cy={h * 0.78} rx={30} ry={11} />
        <Ellipse cx={w * 0.52} cy={h * 0.85} rx={36} ry={12} />
      </G>

      {/* Growing Tree behind Pudding (grows through gardenState().tree stages 0..6) */}
      <G transform={`translate(${treeSpot.x}, ${treeSpot.y})`}>
        <Ellipse cx={0} cy={6} rx={28} ry={7} fill={yardColors.shadow} />
        {treeStage === 0 ? (
          <G stroke={yardColors.outline} strokeWidth={2.2} strokeLinecap="round">
            <Path d="M0 4 V-14" />
            <Path d="M0 -8 C-10 -16 -18 -12 -14 -4 C-8 0 -2 -4 0 -8 Z" fill={yardColors.tree.leaf} />
            <Path d="M0 -12 C10 -20 18 -16 14 -8 C8 -4 2 -8 0 -12 Z" fill={yardColors.tree.light} />
          </G>
        ) : (
          <G stroke={yardColors.outline} strokeWidth={2.2}>
            <Rect
              x={-7}
              y={-58 - treeStage * 4}
              width={14}
              height={64 + treeStage * 4}
              rx={6}
              fill={yardColors.tree.trunk}
            />
            <Circle cx={0} cy={-68 - treeStage * 4} r={26 + treeStage * 3} fill={yardColors.tree.leaf} />
            <Circle cx={-18} cy={-56 - treeStage * 3} r={18 + treeStage * 2} fill={yardColors.tree.shade} />
            <Circle cx={14} cy={-76 - treeStage * 4} r={16 + treeStage * 2} fill={yardColors.tree.light} />
            {birds && (
              <Path
                d={`M-8 ${-78 - treeStage * 4} q5 -5 10 0 q5 -5 10 0`}
                stroke={yardColors.outline}
                strokeWidth={2}
                fill="none"
              />
            )}
            {treeStage >= 4 && (
              <G fill={yardColors.tree.blossom} stroke="none">
                <Circle cx={-12} cy={-66 - treeStage * 4} r={4} />
                <Circle cx={10} cy={-60 - treeStage * 4} r={4} />
                <Circle cx={2} cy={-80 - treeStage * 4} r={4} />
              </G>
            )}
            {treeStage >= 5 && (
              <G fill={yardColors.tree.fruit} stroke="none">
                <Circle cx={-6} cy={-52 - treeStage * 3} r={4.5} />
                <Circle cx={14} cy={-68 - treeStage * 4} r={4.5} />
              </G>
            )}
          </G>
        )}
      </G>

      {/* Flowers bloomed today near tended objects */}
      {bloomedSpots.map((b, idx) => (
        <G key={idx} transform={`translate(${b.point.x}, ${b.point.y})`}>
          <Path d="M0 0 V-11" stroke={yardColors.flower.stem} strokeWidth={2.2} strokeLinecap="round" />
          <Circle cx={-4} cy={-13} r={3.5} fill={b.color} />
          <Circle cx={4} cy={-13} r={3.5} fill={b.color} />
          <Circle cx={0} cy={-17} r={3.5} fill={b.color} />
          <Circle cx={0} cy={-9} r={3.5} fill={b.color} />
          <Circle cx={0} cy={-13} r={2.5} fill={yardColors.flower.center} />
        </G>
      ))}

      {/* Gentle Rain when Unwell */}
      {isRain && (
        <G stroke={gardenColors.rain} strokeWidth={2} strokeLinecap="round" opacity={0.65}>
          <Path d={`M${w * 0.18} ${h * 0.18} l-8 24`} />
          <Path d={`M${w * 0.42} ${h * 0.14} l-8 24`} />
          <Path d={`M${w * 0.68} ${h * 0.20} l-8 24`} />
          <Path d={`M${w * 0.84} ${h * 0.15} l-8 24`} />
          <Path d={`M${w * 0.28} ${h * 0.48} l-8 24`} />
          <Path d={`M${w * 0.58} ${h * 0.52} l-8 24`} />
        </G>
      )}
    </G>
  );
});