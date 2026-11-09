import React from 'react';
import { Circle, Ellipse, G, Path } from 'react-native-svg';
import { yardColors } from '@/constants/colors';
import type { Point } from '@/domain/yard/layout';

const S = yardColors.outline;

export const CushionArt = React.memo(function CushionArt({ spot }: { spot: Point }) {
  return (
    <G transform={`translate(${spot.x}, ${spot.y})`}>
      <Ellipse cx={0} cy={5} rx={52} ry={13} fill={yardColors.shadow} />
      <Ellipse
        cx={0}
        cy={0}
        rx={48}
        ry={12}
        fill={yardColors.cushion.base}
        stroke={S}
        strokeWidth={2.4}
      />
      <Ellipse
        cx={0}
        cy={-2}
        rx={38}
        ry={8}
        fill={yardColors.cushion.plaid}
        stroke={yardColors.cushion.stripe}
        strokeWidth={1.5}
        strokeDasharray="6 4"
      />
    </G>
  );
});

export const WaterBowlArt = React.memo(function WaterBowlArt({
  spot,
  drinking,
}: {
  spot: Point;
  drinking: boolean;
}) {
  return (
    <G transform={`translate(${spot.x}, ${spot.y})`}>
      <Ellipse cx={0} cy={6} rx={30} ry={7} fill={yardColors.shadow} />
      <Path
        d="M-24 -8 Q-22 6 0 6 Q22 6 24 -8 Z"
        fill={yardColors.waterBowl.body}
        stroke={S}
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      <Ellipse
        cx={0}
        cy={-8}
        rx={24}
        ry={7}
        fill={yardColors.waterBowl.rim}
        stroke={S}
        strokeWidth={2.2}
      />
      <Ellipse cx={0} cy={-8} rx={19} ry={4.8} fill={yardColors.waterBowl.water} />
      {drinking && (
        <Ellipse
          cx={0}
          cy={-8}
          rx={12}
          ry={3}
          fill="none"
          stroke={yardColors.waterBowl.ripple}
          strokeWidth={1.8}
        />
      )}
    </G>
  );
});

export const FoodBowlArt = React.memo(function FoodBowlArt({
  spot,
  eating,
}: {
  spot: Point;
  eating: boolean;
}) {
  return (
    <G transform={`translate(${spot.x}, ${spot.y})`}>
      <Ellipse cx={0} cy={6} rx={32} ry={7} fill={yardColors.shadow} />
      <Path
        d="M-26 -8 Q-24 6 0 6 Q24 6 26 -8 Z"
        fill={yardColors.foodBowl.body}
        stroke={S}
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      <Ellipse
        cx={0}
        cy={-8}
        rx={26}
        ry={7.5}
        fill={yardColors.foodBowl.rim}
        stroke={S}
        strokeWidth={2.2}
      />
      <Ellipse cx={0} cy={-8} rx={20} ry={5} fill={yardColors.foodBowl.inside} />
      <G fill={yardColors.foodBowl.kibble}>
        <Circle cx={-9} cy={-9} r={3.5} />
        <Circle cx={-1} cy={-10} r={3.8} fill={yardColors.foodBowl.kibbleLight} />
        <Circle cx={7} cy={-9} r={3.5} />
        <Circle cx={-4} cy={-7} r={3.2} />
        <Circle cx={4} cy={-7} r={3.2} fill={yardColors.foodBowl.kibbleLight} />
      </G>
      {eating && (
        <G fill={yardColors.foodBowl.kibbleLight}>
          <Circle cx={-18} cy={-16} r={2} />
          <Circle cx={16} cy={-15} r={2.2} />
          <Circle cx={0} cy={-19} r={1.8} />
        </G>
      )}
    </G>
  );
});

export const BallArt = React.memo(function BallArt({ spot }: { spot: Point }) {
  return (
    <G transform={`translate(${spot.x}, ${spot.y})`}>
      <Ellipse cx={0} cy={4} rx={12} ry={3.5} fill={yardColors.shadow} />
      <Circle
        cx={0}
        cy={-8}
        r={11}
        fill={yardColors.ball.fill}
        stroke={S}
        strokeWidth={2.4}
      />
      <Path
        d="M-7 -15 Q0 -8 -7 -1 M7 -15 Q0 -8 7 -1"
        stroke={yardColors.ball.seam}
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
    </G>
  );
});