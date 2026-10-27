import React, { useMemo } from 'react';
import Svg, { Circle, Ellipse, G, Line, Path } from 'react-native-svg';
import { parkColors as p, stateColors, gardenColors as g } from '@/constants/colors';
import type { GardenState } from '@/domain/garden/garden';
import type { ParkLayout } from '@/domain/park/layout';
import { parkCourses, ribbon, smoothPath, type Pt } from '@/domain/park/shapes';
import { Duck } from '@/components/garden/Garden';
import type { ParkLight } from './ParkLayers';
import { ParkTree } from './ParkTree';

interface Props {
  layout: ParkLayout;
  state: GardenState;
  light: ParkLight;
}

const PER_ROW = 7;
/** The middle row fills first, then the back, then the front (as fractions of the bed's depth). */
const ROW_Y = [0, -0.42, 0.42];

/** A five-petal flower in its mood's colour. */
function Flower({ x, y, color, stem }: { x: number; y: number; color: string; stem: string }) {
  return (
    <G testID="flower">
      <Line x1={x} y1={y + 2} x2={x} y2={y + 10} stroke={stem} strokeWidth={1.6} strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        return <Circle key={i} cx={x + Math.cos(a) * 3.2} cy={y + Math.sin(a) * 3.2} r={2.8} fill={color} />;
      })}
      <Circle cx={x} cy={y} r={2} fill={g.flowerHeart} />
    </G>
  );
}

/**
 * The foreground: one rolling back hill, the river rising on its crest, the walkway down from the
 * hammock, the tree, the flowerbed and the grass, all placed from the shared layout. Static by
 * design (no timers) so panning stays smooth.
 */
export function ParkWorld({ layout, state, light }: Props) {
  const { worldW: W, worldH: H, objects } = layout;
  const courses = useMemo(() => parkCourses(layout), [layout]);
  const ground = p.ground[light];
  const river = p.river[light];
  const night = light === 'night';
  const at = (u: number, v: number): Pt => [u * W, v * H];

  const backHill = `${smoothPath(courses.hill)} L${W * 1.02} ${H} L${-0.02 * W} ${H} Z`;
  const frontGround = `${smoothPath([at(-0.02, 0.74), at(0.25, 0.7), at(0.5, 0.73), at(0.75, 0.69), at(1.02, 0.72)])} L${W * 1.02} ${H} L${-0.02 * W} ${H} Z`;
  const riverNear = 22 + state.stream * 8;
  const walkNear = Math.max(34, W * 0.07);
  const duck = courses.river[3]!; // where the river has widened
  const tree = objects.tree;

  const hm = objects.hammock;
  const groundY = hm.y + hm.h;
  const posts = [hm.x + hm.w * 0.12, hm.x + hm.w * 0.88];
  const crownW = hm.w * 0.26;
  const crownTop = hm.y - hm.h * 1.55;
  const crownBottom = hm.y + hm.h * 0.15;
  const tie = hm.y + hm.h * 0.3;
  const sagL = posts[0]! + hm.w * 0.1;
  const sagR = posts[1]! - hm.w * 0.1;
  const sagY = hm.y + hm.h * 0.48;

  const fb = objects.flowerbed;
  const bedX = fb.x + fb.w / 2;
  const bedY = fb.y + fb.h * 0.55;
  const rx = fb.w / 2;
  const ry = fb.h * 0.36;
  const flowers = state.flowers.slice(-(ROW_Y.length * PER_ROW));
  const tuftH = 6 + state.grass * 4;

  return (
    <Svg width={W} height={H}>
      <Path d={backHill} fill={ground.back} />
      <Path d={frontGround} fill={ground.front} />

      {/* River: rises thin on the far crest and widens as it nears; never dry. */}
      <G testID="river">
        <Path d={ribbon(courses.river, 5, riverNear + 10)} fill={ground.fore} opacity={0.45} />
        <Path testID="river-water" d={ribbon(courses.river, 2, riverNear)} fill={river.water} />
        <Path d={smoothPath(courses.river.slice(2))} stroke={river.flow} strokeWidth={2} strokeDasharray="12 20" strokeLinecap="round" fill="none" opacity={0.75} />
      </G>
      {state.ducks && (
        <G transform={`translate(${duck[0]} ${duck[1]}) scale(1.6) translate(-168 -190)`}>
          <Duck x={168} y={190} />
          {state.stream >= 3 && <Duck x={150} y={198} />}
        </G>
      )}

      {/* Walkway from the hammock down toward you. */}
      <Path d={ribbon(courses.walkway, 10, walkNear + 8)} fill={ground.fore} opacity={0.3} />
      <Path testID="walkway" d={ribbon(courses.walkway, 6, walkNear)} fill={p.path[light]} />

      <ParkTree
        stage={state.tree}
        birds={state.birds}
        asleep={night || state.resting}
        light={light}
        x={tree.x + tree.w / 2}
        y={tree.y + tree.h}
        height={tree.h * 1.1}
      />

      {/* Two slim cypress trees and the hammock between them, at the top of the walkway. */}
      <G testID="hammock">
        {posts.map((x, i) => {
          const mid = crownTop + (crownBottom - crownTop) * 0.4;
          const crown =
            `M${x} ${crownTop} C${x + crownW * 0.8} ${mid - (crownBottom - crownTop) * 0.05} ${x + crownW * 0.62} ${crownBottom} ${x} ${crownBottom} ` +
            `C${x - crownW * 0.62} ${crownBottom} ${x - crownW * 0.8} ${mid - (crownBottom - crownTop) * 0.05} ${x} ${crownTop}Z`;
          const lit =
            `M${x} ${crownTop} C${x - crownW * 0.8} ${mid} ${x - crownW * 0.55} ${crownBottom - 6} ${x - 2} ${crownBottom - 4} ` +
            `C${x - crownW * 0.2} ${mid} ${x - crownW * 0.1} ${crownTop + 20} ${x} ${crownTop}Z`;
          return (
            <G key={i}>
              <Ellipse cx={x} cy={groundY + 1} rx={crownW * 0.7} ry={4} fill={ground.fore} opacity={0.5} />
              <Path d={`M${x - 5} ${groundY + 1} L${x - 3} ${mid} L${x + 3} ${mid} L${x + 5} ${groundY + 1} Z`} fill={g.trunk} />
              <Path d={crown} fill={p.foliage[light].shade} />
              <Path d={lit} fill={p.foliage[light].leaf} />
            </G>
          );
        })}
        <Path
          d={`M${posts[0]} ${tie} L${sagL} ${sagY} M${sagR} ${sagY} L${posts[1]} ${tie}`}
          stroke={g.trunk}
          strokeWidth={2}
          fill="none"
        />
        <Path
          d={`M${sagL} ${sagY} Q${hm.x + hm.w / 2} ${hm.y + hm.h * 1.02} ${sagR} ${sagY} Q${hm.x + hm.w / 2} ${hm.y + hm.h * 0.78} ${sagL} ${sagY}Z`}
          fill={p.hammock.cloth}
          opacity={night ? 0.7 : 1}
        />
        <Path d={`M${sagL + 6} ${sagY + 3} Q${hm.x + hm.w / 2} ${hm.y + hm.h * 0.9} ${sagR - 6} ${sagY + 3}`} stroke={p.hammock.stripe} strokeWidth={2} fill="none" opacity={night ? 0.6 : 1} />
      </G>

      {/* The flowerbed: a soil bed edged with stones, one flower per day with a check-in. */}
      <G testID="flowerbed">
        <Ellipse cx={bedX} cy={bedY + 3} rx={rx + 6} ry={ry + 5} fill={ground.fore} opacity={0.4} />
        <Ellipse testID="flowerbed-soil" cx={bedX} cy={bedY} rx={rx} ry={ry} fill={p.soil[light]} />
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return <Ellipse key={i} cx={bedX + Math.cos(a) * rx} cy={bedY + Math.sin(a) * ry} rx={5} ry={3.4} fill={p.stone[light]} />;
        })}
        {flowers.map((f, i) => {
          const row = Math.floor(i / PER_ROW);
          const col = i % PER_ROW;
          const x = bedX + (col / (PER_ROW - 1) - 0.5) * rx * (row ? 1.2 : 1.45) + (row % 2 ? rx * 0.08 : 0);
          const y = bedY + ROW_Y[row]! * ry - 6;
          return <Flower key={f.day} x={x} y={y} color={stateColors[f.mood].tint} stem={p.foliage[light].shade} />;
        })}
      </G>

      {/* Grass: V-shaped tufts along the near ground, taller with more steps. */}
      {Array.from({ length: Math.round(W / 26) }, (_, i) => {
        const x = 10 + i * 26;
        const base = H * 0.97 - (i % 3) * 8;
        return (
          <G key={i}>
            <Line x1={x} y1={base} x2={x - 3} y2={base - tuftH} stroke={ground.fore} strokeWidth={2} strokeLinecap="round" />
            <Line x1={x} y1={base} x2={x + 3} y2={base - tuftH * 0.85} stroke={ground.fore} strokeWidth={2} strokeLinecap="round" />
          </G>
        );
      })}

      {/* Fireflies on the night side of the park. */}
      {night &&
        Array.from({ length: 14 }, (_, i) => (
          <Circle key={i} cx={((i * 83) % 100) / 100 * W} cy={H * (0.55 + ((i * 29) % 35) / 100)} r={1.8} fill={p.firefly} opacity={0.8} />
        ))}
    </Svg>
  );
}
