import React from 'react';
import { Circle, Ellipse, G, Path } from 'react-native-svg';
import { gardenColors as g, parkColors as p } from '@/constants/colors';
import type { GardenState } from '@/domain/garden/garden';
import { Bird } from '@/components/garden/Garden';
import type { ParkLight } from './ParkLayers';

interface Props {
  stage: GardenState['tree'];
  birds: boolean;
  asleep: boolean;
  light: ParkLight;
  /** Where the trunk meets the ground, and how tall the full tree stands, in world pixels. */
  x: number;
  y: number;
  height: number;
}

/** Drawn with the trunk's foot at (0, 0) and the full tree about 130 units tall. */
const UNITS = 130;

/** Clustered leaf masses: shade underneath, leaf in the middle, light on the top. */
const SHADE: [number, number, number][] = [[-30, -66, 22], [30, -68, 22], [0, -58, 24], [-16, -96, 26], [18, -98, 26]];
const LEAF: [number, number, number][] = [[-22, -78, 22], [22, -80, 22], [0, -100, 28], [-2, -74, 22], [-32, -90, 16], [32, -92, 16]];
const LIGHT: [number, number, number][] = [[-10, -114, 14], [12, -106, 11], [-24, -96, 9], [26, -86, 8]];
const BLOSSOM: [number, number][] = [[-26, -84], [8, -116], [24, -78], [-6, -92], [34, -98], [-34, -70], [14, -66]];
const FRUIT: [number, number][] = [[-18, -72], [20, -96], [-4, -110], [30, -74], [-30, -94]];

function FullTree({ light, testID }: { light: ParkLight; testID: string }) {
  const f = p.foliage[light];
  return (
    <G testID={testID}>
      <Ellipse cx={0} cy={2} rx={44} ry={6} fill={p.ground[light].fore} opacity={0.55} />
      {/* A trunk that flares into roots at the ground and forks into the crown. */}
      <Path
        testID="trunk"
        d="M-20 3 Q-11 -1 -8 -12 C-6 -28 -5 -44 -4.5 -60 L4.5 -60 C5 -44 6 -28 8 -12 Q11 -1 20 3 Q0 0 -20 3 Z"
        fill={g.trunk}
      />
      <Path d="M-2 -46 Q-14 -58 -24 -66" stroke={g.trunk} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Path d="M2 -50 Q14 -60 26 -68" stroke={g.trunk} strokeWidth={4} strokeLinecap="round" fill="none" />
      {SHADE.map(([cx, cy, r], i) => <Circle key={`s${i}`} cx={cx} cy={cy} r={r} fill={f.shade} />)}
      {LEAF.map(([cx, cy, r], i) => <Circle key={`l${i}`} cx={cx} cy={cy} r={r} fill={f.leaf} />)}
      {LIGHT.map(([cx, cy, r], i) => <Circle key={`h${i}`} cx={cx} cy={cy} r={r} fill={f.light} />)}
    </G>
  );
}

/**
 * The park's tree, grown by all-time workout minutes: sprout, sapling, a full tree, birds,
 * blossom, fruit, then a younger tree beside it. It never shrinks.
 */
export function ParkTree({ stage, birds, asleep, light, x, y, height }: Props) {
  const f = p.foliage[light];
  const k = height / UNITS;
  let body: React.ReactNode;
  if (stage === 0) {
    body = (
      <G testID="sprout">
        <Ellipse cx={0} cy={1} rx={14} ry={3} fill={p.ground[light].fore} opacity={0.5} />
        <Path d="M0 0 C0 -8 1 -14 2 -20" stroke={f.leaf} strokeWidth={3} strokeLinecap="round" fill="none" />
        <Path d="M2 -16 C-6 -20 -10 -18 -12 -14 C-6 -12 -2 -12 2 -16Z" fill={f.leaf} />
        <Path d="M2 -19 C8 -26 14 -25 16 -22 C11 -18 6 -17 2 -19Z" fill={f.light} />
      </G>
    );
  } else if (stage === 1) {
    body = (
      <G testID="sapling">
        <Ellipse cx={0} cy={2} rx={20} ry={4} fill={p.ground[light].fore} opacity={0.5} />
        <Path d="M-4 2 Q-2 -10 -1.5 -36 L1.5 -36 Q2 -10 4 2 Z" fill={g.trunk} />
        <Circle cx={-8} cy={-38} r={11} fill={f.shade} />
        <Circle cx={6} cy={-44} r={13} fill={f.leaf} />
        <Circle cx={0} cy={-52} r={9} fill={f.light} />
      </G>
    );
  } else {
    const grow = stage === 2 ? 0.8 : stage === 3 ? 0.9 : 1;
    body = (
      <>
        {stage >= 6 && (
          <G testID="second-tree" transform="translate(72 -4) scale(0.55)">
            <FullTree light={light} testID="young-tree" />
          </G>
        )}
        <G transform={`scale(${grow})`}>
          <FullTree light={light} testID="tree" />
          {stage >= 4 && BLOSSOM.map(([cx, cy]) => <Circle key={`b${cx}`} testID="blossom" cx={cx} cy={cy} r={3.2} fill={g.blossom} />)}
          {stage >= 5 && FRUIT.map(([cx, cy]) => <Circle key={`f${cx}`} testID="fruit" cx={cx} cy={cy} r={4.5} fill={g.fruit} />)}
          {birds && (
            <>
              <Bird x={-20} y={-122} asleep={asleep} />
              <Bird x={14} y={-128} asleep={asleep} flip />
            </>
          )}
        </G>
      </>
    );
  }
  return <G transform={`translate(${x} ${y}) scale(${k})`}>{body}</G>;
}
