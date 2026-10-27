import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { G } from 'react-native-svg';
import type { GardenState } from '@/domain/garden/garden';
import { Bird } from '@/components/garden/Garden';
import { Sway } from './Motion';

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
  /** Not tended today: the tree sways a little more, inviting a tap. */
  cue: boolean;
  /** Where the trunk meets the ground, and how wide to paint the image, in world pixels. */
  x: number;
  y: number;
  width: number;
}

const box = (art: { w: number; h: number }, x: number, y: number, width: number) => {
  const height = (width * art.h) / art.w;
  return { x: x - width / 2, y: y - height * FOOT, width, height };
};

/**
 * The park's tree, grown by all-time workout minutes: sprout, sapling, young tree, full tree
 * (birds arrive), blossom, fruit, then a younger tree beside it. It never shrinks, and it always
 * moves a little in the breeze.
 */
export function ParkTree({ stage, birds, asleep, cue, x, y, width }: Props) {
  const s = Math.min(stage, 5);
  const art = ART[s]!;
  const main = box(art, x, y, width);
  return (
    <View testID={cue ? 'cue-tree' : undefined} pointerEvents="none" style={StyleSheet.absoluteFill}>
      {stage >= 6 && <Sway testID="second-tree" source={YOUNG.src} box={box(YOUNG, x + width * 0.55, y - 6, width * 0.6)} degrees={0.8} period={5600} />}
      <Sway testID={`tree-stage-${s}`} source={art.src} box={main} degrees={cue ? 2.2 : 0.6} period={cue ? 3200 : 5200} />
      {birds && stage >= 3 && (
        <Svg style={{ position: 'absolute', left: x - 40, top: main.y + main.height * 0.06 - 20 }} width={80} height={30}>
          <G transform="translate(40 18) scale(0.9)">
            <Bird x={-22} y={4} asleep={asleep} />
            <Bird x={20} y={0} asleep={asleep} flip />
          </G>
        </Svg>
      )}
    </View>
  );
}
