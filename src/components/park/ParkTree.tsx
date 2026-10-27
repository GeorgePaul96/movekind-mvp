import React from 'react';
import { G, Image } from 'react-native-svg';
import type { GardenState } from '@/domain/garden/garden';
import { Bird } from '@/components/garden/Garden';

/** The painted growth stages (cut from design/park/layers/layer 5.jpg), with their pixel sizes. */
const ART = [
  { src: require('../../../assets/park/tree-0.png'), w: 512, h: 447 }, // sprout
  { src: require('../../../assets/park/tree-1.png'), w: 512, h: 447 }, // sapling
  { src: require('../../../assets/park/tree-2.png'), w: 512, h: 447 }, // young tree
  { src: require('../../../assets/park/tree-3.png'), w: 512, h: 478 }, // full tree
  { src: require('../../../assets/park/tree-4.png'), w: 512, h: 478 }, // in blossom
  { src: require('../../../assets/park/tree-5.png'), w: 512, h: 459 }, // with fruit
] as const;
const YOUNG = { src: require('../../../assets/park/tree-young.png'), w: 512, h: 478 };

/** In every painting the trunk meets the ground this far down the image. */
const FOOT = 0.94;

interface Props {
  stage: GardenState['tree'];
  birds: boolean;
  asleep: boolean;
  /** Where the trunk meets the ground, and how wide to paint the image, in world pixels. */
  x: number;
  y: number;
  width: number;
}

function Painting({ art, x, y, width, testID }: { art: { src: number; w: number; h: number }; x: number; y: number; width: number; testID: string }) {
  const h = (width * art.h) / art.w;
  return <Image testID={testID} href={art.src} x={x - width / 2} y={y - h * FOOT} width={width} height={h} />;
}

/**
 * The park's tree, grown by all-time workout minutes: sprout, sapling, young tree, full tree
 * (birds arrive), blossom, fruit, then a younger tree beside it. It never shrinks.
 */
export function ParkTree({ stage, birds, asleep, x, y, width }: Props) {
  const art = ART[Math.min(stage, 5)]!;
  const h = (width * art.h) / art.w;
  return (
    <G>
      {stage >= 6 && <Painting testID="second-tree" art={YOUNG} x={x + width * 0.55} y={y - 6} width={width * 0.6} />}
      <Painting testID={`tree-stage-${Math.min(stage, 5)}`} art={art} x={x} y={y} width={width} />
      {birds && stage >= 3 && (
        <G transform={`translate(${x} ${y - h * 0.86}) scale(0.9)`}>
          <Bird x={-22} y={4} asleep={asleep} />
          <Bird x={20} y={0} asleep={asleep} flip />
        </G>
      )}
    </G>
  );
}
