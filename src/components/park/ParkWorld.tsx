import React, { useMemo } from 'react';
import Svg, { Circle, G, Image, Line, Path, Rect } from 'react-native-svg';
import { parkColors as p, stateColors, gardenColors as g } from '@/constants/colors';
import type { GardenState } from '@/domain/garden/garden';
import type { ParkLayout } from '@/domain/park/layout';
import { parkCourses, smoothPath } from '@/domain/park/shapes';
import { Duck } from '@/components/garden/Garden';
import type { ParkLight } from './ParkLayers';
import { ParkTree } from './ParkTree';

/** Paintings from design/park/layers (checkerboard cut out, resized). */
const GROUND = require('../../../assets/park/ground.png');
const BED = { src: require('../../../assets/park/bed.png'), w: 768, h: 399 };
const HAMMOCK = require('../../../assets/park/hammock.png');

const PER_ROW = 7;
/** The middle row fills first, then the back, then the front (fractions of the soil's depth). */
const ROW_Y = [0, -0.5, 0.5];

interface Props {
  layout: ParkLayout;
  state: GardenState;
  light: ParkLight;
}

/** A small five-petal flower in its mood's colour. */
function Flower({ x, y, color, stem }: { x: number; y: number; color: string; stem: string }) {
  return (
    <G testID="flower">
      <Line x1={x} y1={y + 2} x2={x} y2={y + 9} stroke={stem} strokeWidth={1.5} strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        return <Circle key={i} cx={x + Math.cos(a) * 2.8} cy={y + Math.sin(a) * 2.8} r={2.5} fill={color} />;
      })}
      <Circle cx={x} cy={y} r={1.7} fill={g.flowerHeart} />
    </G>
  );
}

/**
 * The foreground: the painted ground with its river and footpath, the tree, the flowerbed and the
 * hammock, placed from the shared layout. Daylight paintings, washed toward dawn, dusk, night or
 * rain by one tint. Static by design (no timers) so panning stays smooth.
 */
export function ParkWorld({ layout, state, light }: Props) {
  const { worldW: W, worldH: H, objects } = layout;
  const courses = useMemo(() => parkCourses(layout), [layout]);
  const night = light === 'night';
  const duck = courses.river[6]!;

  const tree = objects.tree;
  const hm = objects.hammock;
  const hmW = hm.w * 1.7;

  const fb = objects.flowerbed;
  const bedW = fb.w * 1.2;
  const bedH = (bedW * BED.h) / BED.w;
  const bedX = fb.x + fb.w / 2 - bedW / 2;
  const bedY = fb.y + fb.h / 2 - bedH / 2;
  // The soil inside the stones, as found in the painting.
  const soil = { cx: bedX + bedW * 0.5, cy: bedY + bedH * 0.46, rx: bedW * 0.34, ry: bedH * 0.24 };
  const flowers = state.flowers.slice(-(ROW_Y.length * PER_ROW));
  const tuftH = 5 + state.grass * 3;
  const tint = light === 'day' ? null : p.tint[light];

  return (
    <Svg width={W} height={H}>
      <Image testID="ground-art" href={GROUND} x={0} y={0} width={W} height={H} preserveAspectRatio="none" />

      {/* More water, more light dancing on the river. */}
      <Path
        testID="river-glint"
        d={smoothPath(courses.river.slice(3))}
        stroke={p.river[light].flow}
        strokeWidth={2.5}
        strokeDasharray="6 26"
        strokeLinecap="round"
        fill="none"
        opacity={Math.min(0.15 + state.stream * 0.15, 0.8)}
      />
      {state.ducks && (
        <G transform={`translate(${duck[0]} ${duck[1]}) scale(1.5) translate(-168 -190)`}>
          <Duck x={168} y={190} />
          {state.stream >= 3 && <Duck x={150} y={198} />}
        </G>
      )}

      <ParkTree stage={state.tree} birds={state.birds} asleep={night || state.resting} x={tree.x + tree.w / 2} y={tree.y + tree.h} width={tree.h * 1.4} />

      <Image testID="hammock" href={HAMMOCK} x={hm.x + hm.w / 2 - hmW * 0.48} y={hm.y + hm.h - hmW * 0.92} width={hmW} height={hmW} />

      <G testID="flowerbed">
        <Image testID="flowerbed-art" href={BED.src} x={bedX} y={bedY} width={bedW} height={bedH} />
        {flowers.map((f, i) => {
          const row = Math.floor(i / PER_ROW);
          const col = i % PER_ROW;
          const x = soil.cx + (col / (PER_ROW - 1) - 0.5) * soil.rx * (row ? 1.4 : 1.7) + (row % 2 ? soil.rx * 0.08 : 0);
          const y = soil.cy + ROW_Y[row]! * soil.ry - 5;
          return <Flower key={f.day} x={x} y={y} color={stateColors[f.mood].tint} stem={p.foliage[light].shade} />;
        })}
      </G>

      {/* A fringe of grass along the near edge, taller with more steps. */}
      {Array.from({ length: Math.round(W / 22) }, (_, i) => {
        const x = 8 + i * 22;
        const base = H * 0.985 - (i % 3) * 6;
        return (
          <G key={i} opacity={0.7}>
            <Line x1={x} y1={base} x2={x - 3} y2={base - tuftH} stroke={p.foliage[light].shade} strokeWidth={1.6} strokeLinecap="round" />
            <Line x1={x} y1={base} x2={x + 3} y2={base - tuftH * 0.85} stroke={p.foliage[light].shade} strokeWidth={1.6} strokeLinecap="round" />
          </G>
        );
      })}

      {tint && <Rect testID="light-tint" x={0} y={0} width={W} height={H} fill={tint.color} opacity={tint.opacity} />}

      {/* Fireflies glow above the night wash. */}
      {night &&
        Array.from({ length: 14 }, (_, i) => (
          <Circle key={i} cx={((i * 83) % 100) / 100 * W} cy={H * (0.45 + ((i * 29) % 45) / 100)} r={1.8} fill={p.firefly} opacity={0.85} />
        ))}
    </Svg>
  );
}
